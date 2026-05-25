if (typeof document !== "undefined") {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

  Range.prototype.getClientRects ??= () => ({
    length: 0,
    item: () => null,
    [Symbol.iterator]: function* () {
      yield* [];
    },
  } as DOMRectList);

  Range.prototype.getBoundingClientRect ??= () => ({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    toJSON: () => ({}),
  });
}
