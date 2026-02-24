import { useCallback, useRef, useState } from "react";
import { LineBreakTransformer } from "../lib/LineBreakTransformer";

type MeasurementResolve = (data: ParsedData) => void;

export type ParsedData = {
  voltage: number; // voltled from measure_all
  angle: number; // angle from measure_all
  peek: number; // peek from measure_all
  freq: number; // current frequency setting
  amp: number; // current amplitude setting
  offset: number; // current offset setting
};

export function useWebSerial() {
  const isSupported = typeof navigator !== "undefined" && "serial" in navigator;
  const [isOpen, setIsOpen] = useState(false);
  const [baudRate, setBaudRate] = useState(115200);
  const [errorMessage, setErrorMessage] = useState("");
  const [lastLine, setLastLine] = useState("");
  const [lines, setLines] = useState<string[]>([]);
  const [parsedData, setParsedData] = useState<ParsedData>({
    voltage: 0,
    angle: 0,
    peek: 0,
    freq: 0,
    amp: 0,
    offset: 0,
  });

  const portRef = useRef<SerialPort | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<string> | null>(null);
  const writerRef = useRef<WritableStreamDefaultWriter<string> | null>(null);
  const readableClosedRef = useRef<Promise<void> | null>(null);
  const writableClosedRef = useRef<Promise<void> | null>(null);
  const keepReadingRef = useRef<boolean>(false);
  const measureResolveRef = useRef<MeasurementResolve | null>(null);

  const connect = useCallback(async () => {
    setErrorMessage("");
    try {
      if (!isSupported) throw new Error("Web Serial není podporováno.");
      const port = await navigator.serial.requestPort({
        filters: [{ usbVendorId: 0x0483 }], // ST-Link
      });
      await port.open({ baudRate });

      const textEncoder = new TextEncoderStream();
      writableClosedRef.current = textEncoder.readable.pipeTo(
        port.writable as unknown as WritableStream<Uint8Array>
      );
      writerRef.current = (
        textEncoder.writable as WritableStream<string>
      ).getWriter();

      const textDecoder = new TextDecoderStream();
      keepReadingRef.current = true;
      readableClosedRef.current = (
        port.readable as ReadableStream<BufferSource>
      ).pipeTo(textDecoder.writable);

      const transformer = new LineBreakTransformer();
      const lineStream = (
        textDecoder.readable as ReadableStream<string>
      ).pipeThrough(
        new TransformStream<string, string>({
          transform: transformer.transform.bind(transformer),
          flush: transformer.flush.bind(transformer),
        })
      );

      const reader = lineStream.getReader();
      readerRef.current = reader;
      portRef.current = port;
      setIsOpen(true);

      (async () => {
        try {
          while (keepReadingRef.current) {
            const { value, done } = await reader.read();
            if (done) break;
            if (typeof value === "string") {
              setLastLine(value);
              setLines((prev) => [value, ...prev].slice(0, 200));

              // Parse incoming data from measure_all command
              // Expected format: "freq=xxxx, amp=xxxx, offset=xxxx, voltled=xxxx, peek=xxxx, angle=xxxx"
              try {
                if (value.includes("freq=") && value.includes("voltled=")) {
                  const parts = value.split(",").map((p) => p.trim());
                  const data: Partial<ParsedData> = {};

                  parts.forEach((part) => {
                    const [key, val] = part.split("=");
                    const numVal = parseFloat(val);
                    if (!isNaN(numVal)) {
                      if (key === "freq") data.freq = numVal;
                      else if (key === "amp") data.amp = numVal;
                      else if (key === "offset") data.offset = numVal;
                      else if (key === "voltled") data.voltage = numVal;
                      else if (key === "peek") data.peek = numVal;
                      else if (key === "angle") data.angle = numVal;
                    }
                  });

                  if (data.voltage !== undefined && data.angle !== undefined) {
                    setParsedData((prev) => {
                      const updated = { ...prev, ...data };
                      // Resolve pending measureAllAndWait promise
                      if (measureResolveRef.current) {
                        measureResolveRef.current(updated);
                        measureResolveRef.current = null;
                      }
                      return updated;
                    });
                  }
                }
              } catch {
                // Ignore parsing errors
              }
            }
          }
        } catch (err) {
          setErrorMessage((err as Error).message);
          setIsOpen(false);
        }
      })();
    } catch (err) {
      setErrorMessage((err as Error).message);
      setIsOpen(false);
    }
  }, [baudRate, isSupported]);

  const disconnect = useCallback(async () => {
    setErrorMessage("");
    keepReadingRef.current = false;
    try {
      if (readerRef.current) {
        try {
          await readerRef.current.cancel();
        } catch {
          /* ignore */
        }
        readerRef.current.releaseLock();
        readerRef.current = null;
      }
      if (writerRef.current) {
        try {
          await writerRef.current.close();
        } catch {
          /* ignore */
        }
        writerRef.current.releaseLock();
        writerRef.current = null;
      }
      if (readableClosedRef.current) {
        try {
          await readableClosedRef.current;
        } catch {
          /* ignore */
        }
        readableClosedRef.current = null;
      }
      if (writableClosedRef.current) {
        try {
          await writableClosedRef.current;
        } catch {
          /* ignore */
        }
        writableClosedRef.current = null;
      }
      if (portRef.current) {
        try {
          await portRef.current.close();
        } catch {
          /* ignore */
        }
        portRef.current = null;
      }
    } finally {
      setIsOpen(false);
    }
  }, []);

  const send = useCallback(async (text: string) => {
    try {
      if (!writerRef.current) return;
      await writerRef.current.write(text);
    } catch (err) {
      setErrorMessage((err as Error).message);
      setIsOpen(false);
    }
  }, []);

  const flush = useCallback(async () => {
    try {
      // Wait for pending writer backpressure to settle (best-effort "flush")
      if (writerRef.current) await writerRef.current.ready;
    } finally {
      // Clear receive buffers in UI state
      setLastLine("");
      setLines([]);
    }
  }, []);

  // Set DAC parameters using set_sin command
  // amp and offset are in microamperes (uA), freq is in Hz
  const setParameters = useCallback(
    async (amp: number, frequency: number, offset: number) => {
      try {
        if (!writerRef.current) return;
        const command = `set_sin amp=${Math.round(amp)}, offset=${Math.round(
          offset
        )}, freq=${Math.round(frequency)}\n`;
        await writerRef.current.write(command);
      } catch (err) {
        setErrorMessage((err as Error).message);
      }
    },
    []
  );

  // Calibrate zero angle using set_zero_angle command
  const calibrateZeroAngle = useCallback(async () => {
    try {
      if (!writerRef.current) return;
      await writerRef.current.write("set_zero_angle\n");
    } catch (err) {
      setErrorMessage((err as Error).message);
    }
  }, []);

  // Request measurement from device using measure_all command
  const measureAll = useCallback(async () => {
    try {
      if (!writerRef.current) return;
      await writerRef.current.write("measure_all\n");
    } catch (err) {
      setErrorMessage((err as Error).message);
    }
  }, []);

  // Send measure_all and wait for the parsed response from the device
  const measureAllAndWait = useCallback(
    async (timeoutMs = 3000): Promise<ParsedData | null> => {
      try {
        if (!writerRef.current) return null;
        const promise = new Promise<ParsedData>((resolve, reject) => {
          measureResolveRef.current = resolve;
          setTimeout(() => {
            if (measureResolveRef.current === resolve) {
              measureResolveRef.current = null;
              reject(new Error("Measurement timeout"));
            }
          }, timeoutMs);
        });
        await writerRef.current.write("measure_all\n");
        return await promise;
      } catch (err) {
        setErrorMessage((err as Error).message);
        return null;
      }
    },
    []
  );

  return {
    isSupported,
    isOpen,
    baudRate,
    setBaudRate,
    errorMessage,
    lastLine,
    lines,
    parsedData,
    connect,
    disconnect,
    send,
    flush,
    setParameters,
    calibrateZeroAngle,
    measureAll,
    measureAllAndWait,
  };
}
