import "vue/jsx";
import type { VNodeChild } from "vue";

declare global {
  namespace JSX {
    interface ElementChildrenAttribute {
      children: unknown;
    }
  }
}

declare module "vue/jsx-runtime" {
  namespace JSX {
    interface ElementChildrenAttribute {
      children: unknown;
    }

    interface IntrinsicAttributes {
      children?: unknown;
    }
  }
}

declare module "@vue/runtime-dom" {
  interface HTMLAttributes {
    children?: VNodeChild;
  }
}
