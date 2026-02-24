import { useCallback, useRef, useState } from "react";
import { LineBreakTransformer } from "../lib/LineBreakTransformer";

export function useWebSerial() {
    const isSupported = typeof navigator !== "undefined" && "serial" in navigator;
    const [isOpen, setIsOpen] = useState(false);
    const [baudRate, setBaudRate] = useState(115200);
    const [errorMessage, setErrorMessage] = useState("");
    const [lastLine, setLastLine] = useState("");
    const [lastLineSeq, setLastLineSeq] = useState(0);
    const [lines, setLines] = useState<string[]>([]);

    const portRef = useRef<SerialPort | null>(null);
    const readerRef = useRef<ReadableStreamDefaultReader<string> | null>(null);
    const writerRef = useRef<WritableStreamDefaultWriter<string> | null>(null);
    const readableClosedRef = useRef<Promise<void> | null>(null);
    const writableClosedRef = useRef<Promise<void> | null>(null);
    const keepReadingRef = useRef<boolean>(false);

    const connect = useCallback(async () => {
        setErrorMessage("");
        try {
            if (!isSupported) throw new Error("Web Serial není podporováno.");
            const port = await navigator.serial.requestPort({
                filters: [{ usbVendorId: 0x0403, usbProductId: 0x6010 }], // USB JTAG/serial debug unit
            });
            await port.open({ baudRate });

            const textEncoder = new TextEncoderStream();
            writableClosedRef.current = textEncoder.readable.pipeTo(
                port.writable as unknown as WritableStream<Uint8Array>
            );
            writerRef.current = (textEncoder.writable as WritableStream<string>).getWriter();

            const textDecoder = new TextDecoderStream();
            keepReadingRef.current = true;
            readableClosedRef.current = (port.readable as ReadableStream<Uint8Array>).pipeTo(textDecoder.writable);

            const transformer = new LineBreakTransformer();
            const lineStream = (textDecoder.readable as ReadableStream<string>).pipeThrough(
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
                            setLastLineSeq((prev) => prev + 1);
                            setLines((prev) => [value, ...prev].slice(0, 200));
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
            setLastLineSeq(0);
            setLines([]);
        }
    }, []);

    return {
        isSupported,
        isOpen,
        baudRate,
        setBaudRate,
        errorMessage,
        lastLine,
        lastLineSeq,
        lines,
        connect,
        disconnect,
        send,
        flush,
    };
}
