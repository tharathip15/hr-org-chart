import assert from "node:assert/strict";
import { test } from "node:test";

await import("../dialog-focus.js").catch(error => {
  if (error?.code !== "ERR_MODULE_NOT_FOUND") throw error;
});

class FakeClassList {
  constructor() {
    this.values = new Set();
  }

  add(value) {
    this.values.add(value);
  }

  remove(value) {
    this.values.delete(value);
  }

  contains(value) {
    return this.values.has(value);
  }
}

class FakeElement {
  constructor(documentRef, id) {
    this.ownerDocument = documentRef;
    this.id = id;
    this.attributes = new Map();
    this.classList = new FakeClassList();
    this.listeners = new Map();
    this.disabled = false;
    this.hidden = false;
    this.focusableChildren = [];
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) || [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type, listener) {
    const listeners = this.listeners.get(type) || [];
    this.listeners.set(type, listeners.filter(candidate => candidate !== listener));
  }

  dispatch(type, event = {}) {
    (this.listeners.get(type) || []).forEach(listener => listener({ target: this, ...event }));
  }

  click() {
    this.dispatch("click", { preventDefault() {} });
  }

  focus() {
    this.ownerDocument.activeElement = this;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    return this.attributes.has(name) ? this.attributes.get(name) : null;
  }

  hasAttribute(name) {
    return this.attributes.has(name);
  }

  removeAttribute(name) {
    this.attributes.delete(name);
  }

  querySelectorAll() {
    return this.focusableChildren;
  }

  contains(element) {
    return element === this || this.focusableChildren.includes(element);
  }
}

function createHarness() {
  const listeners = new Map();
  const elements = new Set();
  const documentRef = {
    activeElement: null,
    addEventListener(type, listener) {
      const current = listeners.get(type) || [];
      current.push(listener);
      listeners.set(type, current);
    },
    removeEventListener(type, listener) {
      const current = listeners.get(type) || [];
      listeners.set(type, current.filter(candidate => candidate !== listener));
    },
    dispatchKeydown(event) {
      (listeners.get("keydown") || []).forEach(listener => listener(event));
    },
    contains(element) {
      return elements.has(element);
    }
  };
  const makeElement = id => {
    const element = new FakeElement(documentRef, id);
    elements.add(element);
    return element;
  };
  const opener = makeElement("opener");
  const overlay = makeElement("overlay");
  const dialog = makeElement("dialog");
  const closeButton = makeElement("close");
  const titleInput = makeElement("title");
  const primarySelect = makeElement("primary");
  const cancelButton = makeElement("cancel");
  const saveButton = makeElement("save");
  dialog.focusableChildren = [closeButton, titleInput, primarySelect, cancelButton, saveButton];
  dialog.setAttribute("aria-hidden", "true");
  dialog.setAttribute("inert", "");
  opener.focus();

  return {
    documentRef,
    opener,
    overlay,
    dialog,
    closeButton,
    titleInput,
    cancelButton,
    saveButton
  };
}

function createKeyboardEvent(key, shiftKey = false) {
  return {
    key,
    shiftKey,
    defaultPrevented: false,
    preventDefault() {
      this.defaultPrevented = true;
    }
  };
}

test("Overview group dialog traps forward and reverse Tab navigation", () => {
  assert.equal(typeof globalThis.DialogFocus?.createDialogController, "function");
  const harness = createHarness();
  const controller = globalThis.DialogFocus.createDialogController({
    documentRef: harness.documentRef,
    dialog: harness.dialog,
    overlay: harness.overlay,
    closeElements: [harness.closeButton, harness.cancelButton],
    initialFocus: harness.titleInput
  });

  controller.open();
  assert.equal(harness.dialog.classList.contains("active"), true);
  assert.equal(harness.dialog.getAttribute("aria-hidden"), "false");
  assert.equal(harness.dialog.hasAttribute("inert"), false);
  assert.equal(harness.documentRef.activeElement, harness.titleInput);

  harness.saveButton.focus();
  const forwardTab = createKeyboardEvent("Tab");
  harness.documentRef.dispatchKeydown(forwardTab);
  assert.equal(forwardTab.defaultPrevented, true);
  assert.equal(harness.documentRef.activeElement, harness.closeButton);

  const reverseTab = createKeyboardEvent("Tab", true);
  harness.documentRef.dispatchKeydown(reverseTab);
  assert.equal(reverseTab.defaultPrevented, true);
  assert.equal(harness.documentRef.activeElement, harness.saveButton);
});

test("Overview group dialog closes with Escape or Cancel and restores its opener", () => {
  assert.equal(typeof globalThis.DialogFocus?.createDialogController, "function");
  const harness = createHarness();
  const controller = globalThis.DialogFocus.createDialogController({
    documentRef: harness.documentRef,
    dialog: harness.dialog,
    overlay: harness.overlay,
    closeElements: [harness.closeButton, harness.cancelButton],
    initialFocus: harness.titleInput
  });

  controller.open();
  const escape = createKeyboardEvent("Escape");
  harness.documentRef.dispatchKeydown(escape);
  assert.equal(escape.defaultPrevented, true);
  assert.equal(harness.dialog.classList.contains("active"), false);
  assert.equal(harness.dialog.getAttribute("aria-hidden"), "true");
  assert.equal(harness.dialog.hasAttribute("inert"), true);
  assert.equal(harness.documentRef.activeElement, harness.opener);

  controller.open();
  harness.cancelButton.click();
  assert.equal(harness.dialog.classList.contains("active"), false);
  assert.equal(harness.documentRef.activeElement, harness.opener);
});
