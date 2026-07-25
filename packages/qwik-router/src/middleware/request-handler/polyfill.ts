// Polyfill for TextEncoderStream

/**
 * TextEncoderStream polyfill based on Node.js' implementation
 * https://github.com/nodejs/node/blob/3f3226c8e363a5f06c1e6a37abd59b6b8c1923f1/lib/internal/webstreams/encoding.js#L38-L119
 * (MIT License)
 */
/** @internal */
export class _TextEncoderStream_polyfill {
  #pendingHighSurrogate: string | null = null;

  #handle = new TextEncoder();

  #transform = new TransformStream<string, Uint8Array>({
    transform: (chunk, controller) => {
      // https://encoding.spec.whatwg.org/#encode-and-enqueue-a-chunk
      // TextEncoder already substitutes U+FFFD for lone surrogates, so only a pair
      // straddling a chunk boundary needs handling here.
      chunk = String(chunk);

      if (this.#pendingHighSurrogate !== null) {
        chunk = this.#pendingHighSurrogate + chunk;
        this.#pendingHighSurrogate = null;
      }

      const lastIdx = chunk.length - 1;
      if (lastIdx < 0) {
        return;
      }

      const lastCodeUnit = chunk.charCodeAt(lastIdx);
      if (0xd800 <= lastCodeUnit && lastCodeUnit <= 0xdbff) {
        this.#pendingHighSurrogate = chunk[lastIdx];
        chunk = chunk.slice(0, lastIdx);
      }

      if (chunk) {
        controller.enqueue(this.#handle.encode(chunk));
      }
    },

    flush: (controller) => {
      // https://encoding.spec.whatwg.org/#encode-and-flush
      if (this.#pendingHighSurrogate !== null) {
        controller.enqueue(new Uint8Array([0xef, 0xbf, 0xbd]));
      }
    },
  });

  get encoding() {
    return this.#handle.encoding;
  }

  get readable() {
    return this.#transform.readable;
  }

  get writable() {
    return this.#transform.writable;
  }

  get [Symbol.toStringTag]() {
    return 'TextEncoderStream';
  }
}
