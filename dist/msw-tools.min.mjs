function noop$1() {
}
const identity = (x) => x;
function run(fn) {
  return fn();
}
function blank_object() {
  return /* @__PURE__ */ Object.create(null);
}
function run_all(fns) {
  fns.forEach(run);
}
function is_function(thing) {
  return typeof thing === "function";
}
function safe_not_equal(a, b) {
  return a != a ? b == b : a !== b || (a && typeof a === "object" || typeof a === "function");
}
function is_empty(obj) {
  return Object.keys(obj).length === 0;
}
const is_client = typeof window !== "undefined";
let now = is_client ? () => window.performance.now() : () => Date.now();
let raf = is_client ? (cb) => requestAnimationFrame(cb) : noop$1;
const tasks = /* @__PURE__ */ new Set();
function run_tasks(now2) {
  tasks.forEach((task) => {
    if (!task.c(now2)) {
      tasks.delete(task);
      task.f();
    }
  });
  if (tasks.size !== 0)
    raf(run_tasks);
}
function loop(callback) {
  let task;
  if (tasks.size === 0)
    raf(run_tasks);
  return {
    promise: new Promise((fulfill) => {
      tasks.add(task = { c: callback, f: fulfill });
    }),
    abort() {
      tasks.delete(task);
    }
  };
}
function append(target, node) {
  target.appendChild(node);
}
function get_root_for_style(node) {
  if (!node)
    return document;
  const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
  if (root && root.host) {
    return root;
  }
  return node.ownerDocument;
}
function append_empty_stylesheet(node) {
  const style_element = element("style");
  append_stylesheet(get_root_for_style(node), style_element);
  return style_element.sheet;
}
function append_stylesheet(node, style) {
  append(node.head || node, style);
  return style.sheet;
}
function insert(target, node, anchor) {
  target.insertBefore(node, anchor || null);
}
function detach(node) {
  node.parentNode.removeChild(node);
}
function element(name) {
  return document.createElement(name);
}
function text$1(data2) {
  return document.createTextNode(data2);
}
function space() {
  return text$1(" ");
}
function listen(node, event, handler, options) {
  node.addEventListener(event, handler, options);
  return () => node.removeEventListener(event, handler, options);
}
function stop_propagation(fn) {
  return function(event) {
    event.stopPropagation();
    return fn.call(this, event);
  };
}
function attr(node, attribute, value) {
  if (value == null)
    node.removeAttribute(attribute);
  else if (node.getAttribute(attribute) !== value)
    node.setAttribute(attribute, value);
}
function children(element2) {
  return Array.from(element2.childNodes);
}
function set_data(text2, data2) {
  data2 = "" + data2;
  if (text2.wholeText !== data2)
    text2.data = data2;
}
function set_input_value(input, value) {
  input.value = value == null ? "" : value;
}
function set_style(node, key, value, important) {
  if (value === null) {
    node.style.removeProperty(key);
  } else {
    node.style.setProperty(key, value, important ? "important" : "");
  }
}
function select_option(select, value) {
  for (let i = 0; i < select.options.length; i += 1) {
    const option = select.options[i];
    if (option.__value === value) {
      option.selected = true;
      return;
    }
  }
  select.selectedIndex = -1;
}
function select_value(select) {
  const selected_option = select.querySelector(":checked") || select.options[0];
  return selected_option && selected_option.__value;
}
function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
  const e = document.createEvent("CustomEvent");
  e.initCustomEvent(type, bubbles, cancelable, detail);
  return e;
}
function attribute_to_object(attributes) {
  const result = {};
  for (const attribute of attributes) {
    result[attribute.name] = attribute.value;
  }
  return result;
}
const managed_styles = /* @__PURE__ */ new Map();
let active = 0;
function hash(str) {
  let hash2 = 5381;
  let i = str.length;
  while (i--)
    hash2 = (hash2 << 5) - hash2 ^ str.charCodeAt(i);
  return hash2 >>> 0;
}
function create_style_information(doc, node) {
  const info = { stylesheet: append_empty_stylesheet(node), rules: {} };
  managed_styles.set(doc, info);
  return info;
}
function create_rule(node, a, b, duration, delay2, ease, fn, uid = 0) {
  const step = 16.666 / duration;
  let keyframes = "{\n";
  for (let p = 0; p <= 1; p += step) {
    const t = a + (b - a) * ease(p);
    keyframes += p * 100 + `%{${fn(t, 1 - t)}}
`;
  }
  const rule = keyframes + `100% {${fn(b, 1 - b)}}
}`;
  const name = `__svelte_${hash(rule)}_${uid}`;
  const doc = get_root_for_style(node);
  const { stylesheet, rules } = managed_styles.get(doc) || create_style_information(doc, node);
  if (!rules[name]) {
    rules[name] = true;
    stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
  }
  const animation = node.style.animation || "";
  node.style.animation = `${animation ? `${animation}, ` : ""}${name} ${duration}ms linear ${delay2}ms 1 both`;
  active += 1;
  return name;
}
function delete_rule(node, name) {
  const previous = (node.style.animation || "").split(", ");
  const next = previous.filter(
    name ? (anim) => anim.indexOf(name) < 0 : (anim) => anim.indexOf("__svelte") === -1
  );
  const deleted = previous.length - next.length;
  if (deleted) {
    node.style.animation = next.join(", ");
    active -= deleted;
    if (!active)
      clear_rules();
  }
}
function clear_rules() {
  raf(() => {
    if (active)
      return;
    managed_styles.forEach((info) => {
      const { ownerNode } = info.stylesheet;
      if (ownerNode)
        detach(ownerNode);
    });
    managed_styles.clear();
  });
}
let current_component;
function set_current_component(component) {
  current_component = component;
}
function get_current_component() {
  if (!current_component)
    throw new Error("Function called outside component initialization");
  return current_component;
}
function onMount(fn) {
  get_current_component().$$.on_mount.push(fn);
}
const dirty_components = [];
const binding_callbacks = [];
const render_callbacks = [];
const flush_callbacks = [];
const resolved_promise = Promise.resolve();
let update_scheduled = false;
function schedule_update() {
  if (!update_scheduled) {
    update_scheduled = true;
    resolved_promise.then(flush);
  }
}
function add_render_callback(fn) {
  render_callbacks.push(fn);
}
const seen_callbacks = /* @__PURE__ */ new Set();
let flushidx = 0;
function flush() {
  const saved_component = current_component;
  do {
    while (flushidx < dirty_components.length) {
      const component = dirty_components[flushidx];
      flushidx++;
      set_current_component(component);
      update(component.$$);
    }
    set_current_component(null);
    dirty_components.length = 0;
    flushidx = 0;
    while (binding_callbacks.length)
      binding_callbacks.pop()();
    for (let i = 0; i < render_callbacks.length; i += 1) {
      const callback = render_callbacks[i];
      if (!seen_callbacks.has(callback)) {
        seen_callbacks.add(callback);
        callback();
      }
    }
    render_callbacks.length = 0;
  } while (dirty_components.length);
  while (flush_callbacks.length) {
    flush_callbacks.pop()();
  }
  update_scheduled = false;
  seen_callbacks.clear();
  set_current_component(saved_component);
}
function update($$) {
  if ($$.fragment !== null) {
    $$.update();
    run_all($$.before_update);
    const dirty = $$.dirty;
    $$.dirty = [-1];
    $$.fragment && $$.fragment.p($$.ctx, dirty);
    $$.after_update.forEach(add_render_callback);
  }
}
let promise;
function wait() {
  if (!promise) {
    promise = Promise.resolve();
    promise.then(() => {
      promise = null;
    });
  }
  return promise;
}
function dispatch(node, direction, kind) {
  node.dispatchEvent(custom_event(`${direction ? "intro" : "outro"}${kind}`));
}
const outroing = /* @__PURE__ */ new Set();
let outros;
function group_outros() {
  outros = {
    r: 0,
    c: [],
    p: outros
  };
}
function check_outros() {
  if (!outros.r) {
    run_all(outros.c);
  }
  outros = outros.p;
}
function transition_in(block2, local) {
  if (block2 && block2.i) {
    outroing.delete(block2);
    block2.i(local);
  }
}
function transition_out(block2, local, detach2, callback) {
  if (block2 && block2.o) {
    if (outroing.has(block2))
      return;
    outroing.add(block2);
    outros.c.push(() => {
      outroing.delete(block2);
      if (callback) {
        if (detach2)
          block2.d(1);
        callback();
      }
    });
    block2.o(local);
  } else if (callback) {
    callback();
  }
}
const null_transition = { duration: 0 };
function create_bidirectional_transition(node, fn, params, intro) {
  let config = fn(node, params);
  let t = intro ? 0 : 1;
  let running_program = null;
  let pending_program = null;
  let animation_name = null;
  function clear_animation() {
    if (animation_name)
      delete_rule(node, animation_name);
  }
  function init2(program, duration) {
    const d = program.b - t;
    duration *= Math.abs(d);
    return {
      a: t,
      b: program.b,
      d,
      duration,
      start: program.start,
      end: program.start + duration,
      group: program.group
    };
  }
  function go(b) {
    const { delay: delay2 = 0, duration = 300, easing = identity, tick = noop$1, css } = config || null_transition;
    const program = {
      start: now() + delay2,
      b
    };
    if (!b) {
      program.group = outros;
      outros.r += 1;
    }
    if (running_program || pending_program) {
      pending_program = program;
    } else {
      if (css) {
        clear_animation();
        animation_name = create_rule(node, t, b, duration, delay2, easing, css);
      }
      if (b)
        tick(0, 1);
      running_program = init2(program, duration);
      add_render_callback(() => dispatch(node, b, "start"));
      loop((now2) => {
        if (pending_program && now2 > pending_program.start) {
          running_program = init2(pending_program, duration);
          pending_program = null;
          dispatch(node, running_program.b, "start");
          if (css) {
            clear_animation();
            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
          }
        }
        if (running_program) {
          if (now2 >= running_program.end) {
            tick(t = running_program.b, 1 - t);
            dispatch(node, running_program.b, "end");
            if (!pending_program) {
              if (running_program.b) {
                clear_animation();
              } else {
                if (!--running_program.group.r)
                  run_all(running_program.group.c);
              }
            }
            running_program = null;
          } else if (now2 >= running_program.start) {
            const p = now2 - running_program.start;
            t = running_program.a + running_program.d * easing(p / running_program.duration);
            tick(t, 1 - t);
          }
        }
        return !!(running_program || pending_program);
      });
    }
  }
  return {
    run(b) {
      if (is_function(config)) {
        wait().then(() => {
          config = config();
          go(b);
        });
      } else {
        go(b);
      }
    },
    end() {
      clear_animation();
      running_program = pending_program = null;
    }
  };
}
function destroy_block(block2, lookup) {
  block2.d(1);
  lookup.delete(block2.key);
}
function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block2, next, get_context) {
  let o = old_blocks.length;
  let n = list.length;
  let i = o;
  const old_indexes = {};
  while (i--)
    old_indexes[old_blocks[i].key] = i;
  const new_blocks = [];
  const new_lookup = /* @__PURE__ */ new Map();
  const deltas = /* @__PURE__ */ new Map();
  i = n;
  while (i--) {
    const child_ctx = get_context(ctx, list, i);
    const key = get_key(child_ctx);
    let block2 = lookup.get(key);
    if (!block2) {
      block2 = create_each_block2(key, child_ctx);
      block2.c();
    } else if (dynamic) {
      block2.p(child_ctx, dirty);
    }
    new_lookup.set(key, new_blocks[i] = block2);
    if (key in old_indexes)
      deltas.set(key, Math.abs(i - old_indexes[key]));
  }
  const will_move = /* @__PURE__ */ new Set();
  const did_move = /* @__PURE__ */ new Set();
  function insert2(block2) {
    transition_in(block2, 1);
    block2.m(node, next);
    lookup.set(block2.key, block2);
    next = block2.first;
    n--;
  }
  while (o && n) {
    const new_block = new_blocks[n - 1];
    const old_block = old_blocks[o - 1];
    const new_key = new_block.key;
    const old_key = old_block.key;
    if (new_block === old_block) {
      next = new_block.first;
      o--;
      n--;
    } else if (!new_lookup.has(old_key)) {
      destroy(old_block, lookup);
      o--;
    } else if (!lookup.has(new_key) || will_move.has(new_key)) {
      insert2(new_block);
    } else if (did_move.has(old_key)) {
      o--;
    } else if (deltas.get(new_key) > deltas.get(old_key)) {
      did_move.add(new_key);
      insert2(new_block);
    } else {
      will_move.add(old_key);
      o--;
    }
  }
  while (o--) {
    const old_block = old_blocks[o];
    if (!new_lookup.has(old_block.key))
      destroy(old_block, lookup);
  }
  while (n)
    insert2(new_blocks[n - 1]);
  return new_blocks;
}
function mount_component(component, target, anchor, customElement) {
  const { fragment, on_mount, on_destroy, after_update } = component.$$;
  fragment && fragment.m(target, anchor);
  if (!customElement) {
    add_render_callback(() => {
      const new_on_destroy = on_mount.map(run).filter(is_function);
      if (on_destroy) {
        on_destroy.push(...new_on_destroy);
      } else {
        run_all(new_on_destroy);
      }
      component.$$.on_mount = [];
    });
  }
  after_update.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
  const $$ = component.$$;
  if ($$.fragment !== null) {
    run_all($$.on_destroy);
    $$.fragment && $$.fragment.d(detaching);
    $$.on_destroy = $$.fragment = null;
    $$.ctx = [];
  }
}
function make_dirty(component, i) {
  if (component.$$.dirty[0] === -1) {
    dirty_components.push(component);
    schedule_update();
    component.$$.dirty.fill(0);
  }
  component.$$.dirty[i / 31 | 0] |= 1 << i % 31;
}
function init(component, options, instance2, create_fragment2, not_equal, props, append_styles, dirty = [-1]) {
  const parent_component = current_component;
  set_current_component(component);
  const $$ = component.$$ = {
    fragment: null,
    ctx: null,
    props,
    update: noop$1,
    not_equal,
    bound: blank_object(),
    on_mount: [],
    on_destroy: [],
    on_disconnect: [],
    before_update: [],
    after_update: [],
    context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
    callbacks: blank_object(),
    dirty,
    skip_bound: false,
    root: options.target || parent_component.$$.root
  };
  append_styles && append_styles($$.root);
  let ready = false;
  $$.ctx = instance2 ? instance2(component, options.props || {}, (i, ret, ...rest2) => {
    const value = rest2.length ? rest2[0] : ret;
    if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
      if (!$$.skip_bound && $$.bound[i])
        $$.bound[i](value);
      if (ready)
        make_dirty(component, i);
    }
    return ret;
  }) : [];
  $$.update();
  ready = true;
  run_all($$.before_update);
  $$.fragment = create_fragment2 ? create_fragment2($$.ctx) : false;
  if (options.target) {
    if (options.hydrate) {
      const nodes = children(options.target);
      $$.fragment && $$.fragment.l(nodes);
      nodes.forEach(detach);
    } else {
      $$.fragment && $$.fragment.c();
    }
    if (options.intro)
      transition_in(component.$$.fragment);
    mount_component(component, options.target, options.anchor, options.customElement);
    flush();
  }
  set_current_component(parent_component);
}
let SvelteElement;
if (typeof HTMLElement === "function") {
  SvelteElement = class extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
    }
    connectedCallback() {
      const { on_mount } = this.$$;
      this.$$.on_disconnect = on_mount.map(run).filter(is_function);
      for (const key in this.$$.slotted) {
        this.appendChild(this.$$.slotted[key]);
      }
    }
    attributeChangedCallback(attr2, _oldValue, newValue) {
      this[attr2] = newValue;
    }
    disconnectedCallback() {
      run_all(this.$$.on_disconnect);
    }
    $destroy() {
      destroy_component(this, 1);
      this.$destroy = noop$1;
    }
    $on(type, callback) {
      const callbacks = this.$$.callbacks[type] || (this.$$.callbacks[type] = []);
      callbacks.push(callback);
      return () => {
        const index = callbacks.indexOf(callback);
        if (index !== -1)
          callbacks.splice(index, 1);
      };
    }
    $set($$props) {
      if (this.$$set && !is_empty($$props)) {
        this.$$.skip_bound = true;
        this.$$set($$props);
        this.$$.skip_bound = false;
      }
    }
  };
}
function cubicOut(t) {
  const f = t - 1;
  return f * f * f + 1;
}
function quintOut(t) {
  return --t * t * t * t * t + 1;
}
function fade(node, { delay: delay2 = 0, duration = 400, easing = identity } = {}) {
  const o = +getComputedStyle(node).opacity;
  return {
    delay: delay2,
    duration,
    easing,
    css: (t) => `opacity: ${t * o}`
  };
}
function slide(node, { delay: delay2 = 0, duration = 400, easing = cubicOut } = {}) {
  const style = getComputedStyle(node);
  const opacity = +style.opacity;
  const height = parseFloat(style.height);
  const padding_top = parseFloat(style.paddingTop);
  const padding_bottom = parseFloat(style.paddingBottom);
  const margin_top = parseFloat(style.marginTop);
  const margin_bottom = parseFloat(style.marginBottom);
  const border_top_width = parseFloat(style.borderTopWidth);
  const border_bottom_width = parseFloat(style.borderBottomWidth);
  return {
    delay: delay2,
    duration,
    easing,
    css: (t) => `overflow: hidden;opacity: ${Math.min(t * 20, 1) * opacity};height: ${t * height}px;padding-top: ${t * padding_top}px;padding-bottom: ${t * padding_bottom}px;margin-top: ${t * margin_top}px;margin-bottom: ${t * margin_bottom}px;border-top-width: ${t * border_top_width}px;border-bottom-width: ${t * border_bottom_width}px;`
  };
}
var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
function getAugmentedNamespace(n) {
  var f = n.default;
  if (typeof f == "function") {
    var a = function() {
      return f.apply(this, arguments);
    };
    a.prototype = f.prototype;
  } else
    a = {};
  Object.defineProperty(a, "__esModule", { value: true });
  Object.keys(n).forEach(function(k) {
    var d = Object.getOwnPropertyDescriptor(n, k);
    Object.defineProperty(a, k, d.get ? d : {
      enumerable: true,
      get: function() {
        return n[k];
      }
    });
  });
  return a;
}
const require$$0 = {
  "100": "Continue",
  "101": "Switching Protocols",
  "102": "Processing",
  "103": "Early Hints",
  "200": "OK",
  "201": "Created",
  "202": "Accepted",
  "203": "Non-Authoritative Information",
  "204": "No Content",
  "205": "Reset Content",
  "206": "Partial Content",
  "207": "Multi-Status",
  "208": "Already Reported",
  "226": "IM Used",
  "300": "Multiple Choices",
  "301": "Moved Permanently",
  "302": "Found",
  "303": "See Other",
  "304": "Not Modified",
  "305": "Use Proxy",
  "307": "Temporary Redirect",
  "308": "Permanent Redirect",
  "400": "Bad Request",
  "401": "Unauthorized",
  "402": "Payment Required",
  "403": "Forbidden",
  "404": "Not Found",
  "405": "Method Not Allowed",
  "406": "Not Acceptable",
  "407": "Proxy Authentication Required",
  "408": "Request Timeout",
  "409": "Conflict",
  "410": "Gone",
  "411": "Length Required",
  "412": "Precondition Failed",
  "413": "Payload Too Large",
  "414": "URI Too Long",
  "415": "Unsupported Media Type",
  "416": "Range Not Satisfiable",
  "417": "Expectation Failed",
  "418": "I'm a Teapot",
  "421": "Misdirected Request",
  "422": "Unprocessable Entity",
  "423": "Locked",
  "424": "Failed Dependency",
  "425": "Too Early",
  "426": "Upgrade Required",
  "428": "Precondition Required",
  "429": "Too Many Requests",
  "431": "Request Header Fields Too Large",
  "451": "Unavailable For Legal Reasons",
  "500": "Internal Server Error",
  "501": "Not Implemented",
  "502": "Bad Gateway",
  "503": "Service Unavailable",
  "504": "Gateway Timeout",
  "505": "HTTP Version Not Supported",
  "506": "Variant Also Negotiates",
  "507": "Insufficient Storage",
  "508": "Loop Detected",
  "509": "Bandwidth Limit Exceeded",
  "510": "Not Extended",
  "511": "Network Authentication Required"
};
var lib$9 = {};
var Headers = {};
var normalizeHeaderName$1 = {};
Object.defineProperty(normalizeHeaderName$1, "__esModule", { value: true });
normalizeHeaderName$1.normalizeHeaderName = void 0;
var HEADERS_INVALID_CHARACTERS = /[^a-z0-9\-#$%&'*+.^_`|~]/i;
function normalizeHeaderName(name) {
  if (typeof name !== "string") {
    name = String(name);
  }
  if (HEADERS_INVALID_CHARACTERS.test(name) || name.trim() === "") {
    throw new TypeError("Invalid character in header field name");
  }
  return name.toLowerCase();
}
normalizeHeaderName$1.normalizeHeaderName = normalizeHeaderName;
var normalizeHeaderValue$1 = {};
Object.defineProperty(normalizeHeaderValue$1, "__esModule", { value: true });
normalizeHeaderValue$1.normalizeHeaderValue = void 0;
function normalizeHeaderValue(value) {
  if (typeof value !== "string") {
    value = String(value);
  }
  return value;
}
normalizeHeaderValue$1.normalizeHeaderValue = normalizeHeaderValue;
var __generator$2 = commonjsGlobal && commonjsGlobal.__generator || function(thisArg, body2) {
  var _ = { label: 0, sent: function() {
    if (t[0] & 1)
      throw t[1];
    return t[1];
  }, trys: [], ops: [] }, f, y, t, g;
  return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
    return this;
  }), g;
  function verb(n) {
    return function(v) {
      return step([n, v]);
    };
  }
  function step(op) {
    if (f)
      throw new TypeError("Generator is already executing.");
    while (_)
      try {
        if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done)
          return t;
        if (y = 0, t)
          op = [op[0] & 2, t.value];
        switch (op[0]) {
          case 0:
          case 1:
            t = op;
            break;
          case 4:
            _.label++;
            return { value: op[1], done: false };
          case 5:
            _.label++;
            y = op[1];
            op = [0];
            continue;
          case 7:
            op = _.ops.pop();
            _.trys.pop();
            continue;
          default:
            if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
              _ = 0;
              continue;
            }
            if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
              _.label = op[1];
              break;
            }
            if (op[0] === 6 && _.label < t[1]) {
              _.label = t[1];
              t = op;
              break;
            }
            if (t && _.label < t[2]) {
              _.label = t[2];
              _.ops.push(op);
              break;
            }
            if (t[2])
              _.ops.pop();
            _.trys.pop();
            continue;
        }
        op = body2.call(thisArg, _);
      } catch (e) {
        op = [6, e];
        y = 0;
      } finally {
        f = t = 0;
      }
    if (op[0] & 5)
      throw op[1];
    return { value: op[0] ? op[1] : void 0, done: true };
  }
};
var __read$3 = commonjsGlobal && commonjsGlobal.__read || function(o, n) {
  var m = typeof Symbol === "function" && o[Symbol.iterator];
  if (!m)
    return o;
  var i = m.call(o), r, ar = [], e;
  try {
    while ((n === void 0 || n-- > 0) && !(r = i.next()).done)
      ar.push(r.value);
  } catch (error2) {
    e = { error: error2 };
  } finally {
    try {
      if (r && !r.done && (m = i["return"]))
        m.call(i);
    } finally {
      if (e)
        throw e.error;
    }
  }
  return ar;
};
var __values$1 = commonjsGlobal && commonjsGlobal.__values || function(o) {
  var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
  if (m)
    return m.call(o);
  if (o && typeof o.length === "number")
    return {
      next: function() {
        if (o && i >= o.length)
          o = void 0;
        return { value: o && o[i++], done: !o };
      }
    };
  throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var _a, _b;
Object.defineProperty(Headers, "__esModule", { value: true });
var normalizeHeaderName_1 = normalizeHeaderName$1;
var normalizeHeaderValue_1 = normalizeHeaderValue$1;
var NORMALIZED_HEADERS = Symbol("normalizedHeaders");
var RAW_HEADER_NAMES = Symbol("rawHeaderNames");
var HeadersPolyfill = function() {
  function HeadersPolyfill2(init2) {
    var _this = this;
    this[_a] = {};
    this[_b] = /* @__PURE__ */ new Map();
    if (["Headers", "HeadersPolyfill"].includes(init2 === null || init2 === void 0 ? void 0 : init2.constructor.name) || init2 instanceof HeadersPolyfill2) {
      var initialHeaders = init2;
      initialHeaders.forEach(function(value, name) {
        _this.append(name, value);
      }, this);
    } else if (Array.isArray(init2)) {
      init2.forEach(function(_c) {
        var _d = __read$3(_c, 2), name = _d[0], value = _d[1];
        _this.append(name, Array.isArray(value) ? value.join(", ") : value);
      });
    } else if (init2) {
      Object.getOwnPropertyNames(init2).forEach(function(name) {
        var value = init2[name];
        _this.append(name, Array.isArray(value) ? value.join(", ") : value);
      });
    }
  }
  HeadersPolyfill2.prototype[_a = NORMALIZED_HEADERS, _b = RAW_HEADER_NAMES, Symbol.iterator] = function() {
    return this.entries();
  };
  HeadersPolyfill2.prototype.keys = function() {
    var _c, _d, name_1, e_1_1;
    var e_1, _e;
    return __generator$2(this, function(_f) {
      switch (_f.label) {
        case 0:
          _f.trys.push([0, 5, 6, 7]);
          _c = __values$1(Object.keys(this[NORMALIZED_HEADERS])), _d = _c.next();
          _f.label = 1;
        case 1:
          if (!!_d.done)
            return [3, 4];
          name_1 = _d.value;
          return [4, name_1];
        case 2:
          _f.sent();
          _f.label = 3;
        case 3:
          _d = _c.next();
          return [3, 1];
        case 4:
          return [3, 7];
        case 5:
          e_1_1 = _f.sent();
          e_1 = { error: e_1_1 };
          return [3, 7];
        case 6:
          try {
            if (_d && !_d.done && (_e = _c.return))
              _e.call(_c);
          } finally {
            if (e_1)
              throw e_1.error;
          }
          return [7];
        case 7:
          return [2];
      }
    });
  };
  HeadersPolyfill2.prototype.values = function() {
    var _c, _d, value, e_2_1;
    var e_2, _e;
    return __generator$2(this, function(_f) {
      switch (_f.label) {
        case 0:
          _f.trys.push([0, 5, 6, 7]);
          _c = __values$1(Object.values(this[NORMALIZED_HEADERS])), _d = _c.next();
          _f.label = 1;
        case 1:
          if (!!_d.done)
            return [3, 4];
          value = _d.value;
          return [4, value];
        case 2:
          _f.sent();
          _f.label = 3;
        case 3:
          _d = _c.next();
          return [3, 1];
        case 4:
          return [3, 7];
        case 5:
          e_2_1 = _f.sent();
          e_2 = { error: e_2_1 };
          return [3, 7];
        case 6:
          try {
            if (_d && !_d.done && (_e = _c.return))
              _e.call(_c);
          } finally {
            if (e_2)
              throw e_2.error;
          }
          return [7];
        case 7:
          return [2];
      }
    });
  };
  HeadersPolyfill2.prototype.entries = function() {
    var _c, _d, name_2, e_3_1;
    var e_3, _e;
    return __generator$2(this, function(_f) {
      switch (_f.label) {
        case 0:
          _f.trys.push([0, 5, 6, 7]);
          _c = __values$1(Object.keys(this[NORMALIZED_HEADERS])), _d = _c.next();
          _f.label = 1;
        case 1:
          if (!!_d.done)
            return [3, 4];
          name_2 = _d.value;
          return [4, [name_2, this.get(name_2)]];
        case 2:
          _f.sent();
          _f.label = 3;
        case 3:
          _d = _c.next();
          return [3, 1];
        case 4:
          return [3, 7];
        case 5:
          e_3_1 = _f.sent();
          e_3 = { error: e_3_1 };
          return [3, 7];
        case 6:
          try {
            if (_d && !_d.done && (_e = _c.return))
              _e.call(_c);
          } finally {
            if (e_3)
              throw e_3.error;
          }
          return [7];
        case 7:
          return [2];
      }
    });
  };
  HeadersPolyfill2.prototype.get = function(name) {
    return this[NORMALIZED_HEADERS][normalizeHeaderName_1.normalizeHeaderName(name)] || null;
  };
  HeadersPolyfill2.prototype.set = function(name, value) {
    var normalizedName = normalizeHeaderName_1.normalizeHeaderName(name);
    this[NORMALIZED_HEADERS][normalizedName] = normalizeHeaderValue_1.normalizeHeaderValue(value);
    this[RAW_HEADER_NAMES].set(normalizedName, name);
  };
  HeadersPolyfill2.prototype.append = function(name, value) {
    var normalizedName = normalizeHeaderName_1.normalizeHeaderName(name);
    var resolvedValue = this.has(normalizedName) ? this.get(normalizedName) + ", " + value : value;
    this.set(name, resolvedValue);
  };
  HeadersPolyfill2.prototype.delete = function(name) {
    if (!this.has(name)) {
      return;
    }
    var normalizedName = normalizeHeaderName_1.normalizeHeaderName(name);
    delete this[NORMALIZED_HEADERS][normalizedName];
    this[RAW_HEADER_NAMES].delete(normalizedName);
  };
  HeadersPolyfill2.prototype.all = function() {
    return this[NORMALIZED_HEADERS];
  };
  HeadersPolyfill2.prototype.raw = function() {
    var e_4, _c;
    var rawHeaders = {};
    try {
      for (var _d = __values$1(this.entries()), _e = _d.next(); !_e.done; _e = _d.next()) {
        var _f = __read$3(_e.value, 2), name_3 = _f[0], value = _f[1];
        rawHeaders[this[RAW_HEADER_NAMES].get(name_3)] = value;
      }
    } catch (e_4_1) {
      e_4 = { error: e_4_1 };
    } finally {
      try {
        if (_e && !_e.done && (_c = _d.return))
          _c.call(_d);
      } finally {
        if (e_4)
          throw e_4.error;
      }
    }
    return rawHeaders;
  };
  HeadersPolyfill2.prototype.has = function(name) {
    return this[NORMALIZED_HEADERS].hasOwnProperty(normalizeHeaderName_1.normalizeHeaderName(name));
  };
  HeadersPolyfill2.prototype.forEach = function(callback, thisArg) {
    for (var name_4 in this[NORMALIZED_HEADERS]) {
      if (this[NORMALIZED_HEADERS].hasOwnProperty(name_4)) {
        callback.call(thisArg, this[NORMALIZED_HEADERS][name_4], name_4, this);
      }
    }
  };
  return HeadersPolyfill2;
}();
Headers.default = HeadersPolyfill;
var headersToString$1 = {};
var headersToList$1 = {};
Object.defineProperty(headersToList$1, "__esModule", { value: true });
headersToList$1.headersToList = void 0;
function headersToList(headers) {
  var headersList = [];
  headers.forEach(function(value, name) {
    var resolvedValue = value.includes(",") ? value.split(",").map(function(value2) {
      return value2.trim();
    }) : value;
    headersList.push([name, resolvedValue]);
  });
  return headersList;
}
headersToList$1.headersToList = headersToList;
var __read$2 = commonjsGlobal && commonjsGlobal.__read || function(o, n) {
  var m = typeof Symbol === "function" && o[Symbol.iterator];
  if (!m)
    return o;
  var i = m.call(o), r, ar = [], e;
  try {
    while ((n === void 0 || n-- > 0) && !(r = i.next()).done)
      ar.push(r.value);
  } catch (error2) {
    e = { error: error2 };
  } finally {
    try {
      if (r && !r.done && (m = i["return"]))
        m.call(i);
    } finally {
      if (e)
        throw e.error;
    }
  }
  return ar;
};
Object.defineProperty(headersToString$1, "__esModule", { value: true });
headersToString$1.headersToString = void 0;
var headersToList_1 = headersToList$1;
function headersToString(headers) {
  var list = headersToList_1.headersToList(headers);
  var lines = list.map(function(_a2) {
    var _b2 = __read$2(_a2, 2), name = _b2[0], value = _b2[1];
    var values = [].concat(value);
    return name + ": " + values.join(", ");
  });
  return lines.join("\r\n");
}
headersToString$1.headersToString = headersToString;
var headersToObject$1 = {};
Object.defineProperty(headersToObject$1, "__esModule", { value: true });
headersToObject$1.headersToObject = void 0;
var singleValueHeaders = ["user-agent"];
function headersToObject(headers) {
  var headersObject = {};
  headers.forEach(function(value, name) {
    var isMultiValue = !singleValueHeaders.includes(name.toLowerCase()) && value.includes(",");
    headersObject[name] = isMultiValue ? value.split(",").map(function(s) {
      return s.trim();
    }) : value;
  });
  return headersObject;
}
headersToObject$1.headersToObject = headersToObject;
var stringToHeaders$1 = {};
Object.defineProperty(stringToHeaders$1, "__esModule", { value: true });
stringToHeaders$1.stringToHeaders = void 0;
var Headers_1$2 = Headers;
function stringToHeaders(str) {
  var lines = str.trim().split(/[\r\n]+/);
  return lines.reduce(function(headers, line) {
    if (line.trim() === "") {
      return headers;
    }
    var parts = line.split(": ");
    var name = parts.shift();
    var value = parts.join(": ");
    headers.append(name, value);
    return headers;
  }, new Headers_1$2.default());
}
stringToHeaders$1.stringToHeaders = stringToHeaders;
var listToHeaders$1 = {};
var __read$1 = commonjsGlobal && commonjsGlobal.__read || function(o, n) {
  var m = typeof Symbol === "function" && o[Symbol.iterator];
  if (!m)
    return o;
  var i = m.call(o), r, ar = [], e;
  try {
    while ((n === void 0 || n-- > 0) && !(r = i.next()).done)
      ar.push(r.value);
  } catch (error2) {
    e = { error: error2 };
  } finally {
    try {
      if (r && !r.done && (m = i["return"]))
        m.call(i);
    } finally {
      if (e)
        throw e.error;
    }
  }
  return ar;
};
Object.defineProperty(listToHeaders$1, "__esModule", { value: true });
listToHeaders$1.listToHeaders = void 0;
var Headers_1$1 = Headers;
function listToHeaders(list) {
  var headers = new Headers_1$1.default();
  list.forEach(function(_a2) {
    var _b2 = __read$1(_a2, 2), name = _b2[0], value = _b2[1];
    var values = [].concat(value);
    values.forEach(function(value2) {
      headers.append(name, value2);
    });
  });
  return headers;
}
listToHeaders$1.listToHeaders = listToHeaders;
var objectToHeaders$1 = {};
var reduceHeadersObject$1 = {};
Object.defineProperty(reduceHeadersObject$1, "__esModule", { value: true });
reduceHeadersObject$1.reduceHeadersObject = void 0;
function reduceHeadersObject(headers, reducer, initialState) {
  return Object.keys(headers).reduce(function(nextHeaders, name) {
    return reducer(nextHeaders, name, headers[name]);
  }, initialState);
}
reduceHeadersObject$1.reduceHeadersObject = reduceHeadersObject;
Object.defineProperty(objectToHeaders$1, "__esModule", { value: true });
objectToHeaders$1.objectToHeaders = void 0;
var Headers_1 = Headers;
var reduceHeadersObject_1$1 = reduceHeadersObject$1;
function objectToHeaders(headersObject) {
  return reduceHeadersObject_1$1.reduceHeadersObject(headersObject, function(headers, name, value) {
    var values = [].concat(value).filter(Boolean);
    values.forEach(function(value2) {
      headers.append(name, value2);
    });
    return headers;
  }, new Headers_1.default());
}
objectToHeaders$1.objectToHeaders = objectToHeaders;
var flattenHeadersList$1 = {};
var __read = commonjsGlobal && commonjsGlobal.__read || function(o, n) {
  var m = typeof Symbol === "function" && o[Symbol.iterator];
  if (!m)
    return o;
  var i = m.call(o), r, ar = [], e;
  try {
    while ((n === void 0 || n-- > 0) && !(r = i.next()).done)
      ar.push(r.value);
  } catch (error2) {
    e = { error: error2 };
  } finally {
    try {
      if (r && !r.done && (m = i["return"]))
        m.call(i);
    } finally {
      if (e)
        throw e.error;
    }
  }
  return ar;
};
Object.defineProperty(flattenHeadersList$1, "__esModule", { value: true });
flattenHeadersList$1.flattenHeadersList = void 0;
function flattenHeadersList(list) {
  return list.map(function(_a2) {
    var _b2 = __read(_a2, 2), name = _b2[0], values = _b2[1];
    return [name, [].concat(values).join("; ")];
  });
}
flattenHeadersList$1.flattenHeadersList = flattenHeadersList;
var flattenHeadersObject$1 = {};
Object.defineProperty(flattenHeadersObject$1, "__esModule", { value: true });
flattenHeadersObject$1.flattenHeadersObject = void 0;
var reduceHeadersObject_1 = reduceHeadersObject$1;
function flattenHeadersObject(headersObject) {
  return reduceHeadersObject_1.reduceHeadersObject(headersObject, function(headers, name, value) {
    headers[name] = [].concat(value).join("; ");
    return headers;
  }, {});
}
flattenHeadersObject$1.flattenHeadersObject = flattenHeadersObject;
(function(exports) {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.flattenHeadersObject = exports.flattenHeadersList = exports.reduceHeadersObject = exports.objectToHeaders = exports.listToHeaders = exports.stringToHeaders = exports.headersToObject = exports.headersToList = exports.headersToString = exports.Headers = void 0;
  var Headers_12 = Headers;
  Object.defineProperty(exports, "Headers", { enumerable: true, get: function() {
    return Headers_12.default;
  } });
  var headersToString_1 = headersToString$1;
  Object.defineProperty(exports, "headersToString", { enumerable: true, get: function() {
    return headersToString_1.headersToString;
  } });
  var headersToList_12 = headersToList$1;
  Object.defineProperty(exports, "headersToList", { enumerable: true, get: function() {
    return headersToList_12.headersToList;
  } });
  var headersToObject_1 = headersToObject$1;
  Object.defineProperty(exports, "headersToObject", { enumerable: true, get: function() {
    return headersToObject_1.headersToObject;
  } });
  var stringToHeaders_1 = stringToHeaders$1;
  Object.defineProperty(exports, "stringToHeaders", { enumerable: true, get: function() {
    return stringToHeaders_1.stringToHeaders;
  } });
  var listToHeaders_1 = listToHeaders$1;
  Object.defineProperty(exports, "listToHeaders", { enumerable: true, get: function() {
    return listToHeaders_1.listToHeaders;
  } });
  var objectToHeaders_1 = objectToHeaders$1;
  Object.defineProperty(exports, "objectToHeaders", { enumerable: true, get: function() {
    return objectToHeaders_1.objectToHeaders;
  } });
  var reduceHeadersObject_12 = reduceHeadersObject$1;
  Object.defineProperty(exports, "reduceHeadersObject", { enumerable: true, get: function() {
    return reduceHeadersObject_12.reduceHeadersObject;
  } });
  var flattenHeadersList_1 = flattenHeadersList$1;
  Object.defineProperty(exports, "flattenHeadersList", { enumerable: true, get: function() {
    return flattenHeadersList_1.flattenHeadersList;
  } });
  var flattenHeadersObject_1 = flattenHeadersObject$1;
  Object.defineProperty(exports, "flattenHeadersObject", { enumerable: true, get: function() {
    return flattenHeadersObject_1.flattenHeadersObject;
  } });
})(lib$9);
var _cookie_0_4_2_cookie = {};
/*!
 * cookie
 * Copyright(c) 2012-2014 Roman Shtylman
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */
_cookie_0_4_2_cookie.parse = parse$3;
_cookie_0_4_2_cookie.serialize = serialize;
var decode = decodeURIComponent;
var encode = encodeURIComponent;
var fieldContentRegExp = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;
function parse$3(str, options) {
  if (typeof str !== "string") {
    throw new TypeError("argument str must be a string");
  }
  var obj = {};
  var opt = options || {};
  var pairs = str.split(";");
  var dec = opt.decode || decode;
  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i];
    var index = pair.indexOf("=");
    if (index < 0) {
      continue;
    }
    var key = pair.substring(0, index).trim();
    if (void 0 == obj[key]) {
      var val = pair.substring(index + 1, pair.length).trim();
      if (val[0] === '"') {
        val = val.slice(1, -1);
      }
      obj[key] = tryDecode(val, dec);
    }
  }
  return obj;
}
function serialize(name, val, options) {
  var opt = options || {};
  var enc = opt.encode || encode;
  if (typeof enc !== "function") {
    throw new TypeError("option encode is invalid");
  }
  if (!fieldContentRegExp.test(name)) {
    throw new TypeError("argument name is invalid");
  }
  var value = enc(val);
  if (value && !fieldContentRegExp.test(value)) {
    throw new TypeError("argument val is invalid");
  }
  var str = name + "=" + value;
  if (null != opt.maxAge) {
    var maxAge = opt.maxAge - 0;
    if (isNaN(maxAge) || !isFinite(maxAge)) {
      throw new TypeError("option maxAge is invalid");
    }
    str += "; Max-Age=" + Math.floor(maxAge);
  }
  if (opt.domain) {
    if (!fieldContentRegExp.test(opt.domain)) {
      throw new TypeError("option domain is invalid");
    }
    str += "; Domain=" + opt.domain;
  }
  if (opt.path) {
    if (!fieldContentRegExp.test(opt.path)) {
      throw new TypeError("option path is invalid");
    }
    str += "; Path=" + opt.path;
  }
  if (opt.expires) {
    if (typeof opt.expires.toUTCString !== "function") {
      throw new TypeError("option expires is invalid");
    }
    str += "; Expires=" + opt.expires.toUTCString();
  }
  if (opt.httpOnly) {
    str += "; HttpOnly";
  }
  if (opt.secure) {
    str += "; Secure";
  }
  if (opt.sameSite) {
    var sameSite = typeof opt.sameSite === "string" ? opt.sameSite.toLowerCase() : opt.sameSite;
    switch (sameSite) {
      case true:
        str += "; SameSite=Strict";
        break;
      case "lax":
        str += "; SameSite=Lax";
        break;
      case "strict":
        str += "; SameSite=Strict";
        break;
      case "none":
        str += "; SameSite=None";
        break;
      default:
        throw new TypeError("option sameSite is invalid");
    }
  }
  return str;
}
function tryDecode(str, decode2) {
  try {
    return decode2(str);
  } catch (e) {
    return str;
  }
}
var lib$8 = { exports: {} };
(function(module, exports) {
  (function(global2, factory) {
    factory(exports);
  })(commonjsGlobal, function(exports2) {
    function isNodeProcess() {
      if (typeof navigator !== "undefined" && navigator.product === "ReactNative") {
        return true;
      }
      return !!(typeof process !== "undefined" && process.versions && process.versions.node);
    }
    exports2.isNodeProcess = isNodeProcess;
    Object.defineProperty(exports2, "__esModule", { value: true });
  });
})(lib$8, lib$8.exports);
var browser$1 = { exports: {} };
var hasRequiredBrowser;
function requireBrowser() {
  if (hasRequiredBrowser)
    return browser$1.exports;
  hasRequiredBrowser = 1;
  (function(module, exports) {
    var getGlobal = function() {
      if (typeof self !== "undefined") {
        return self;
      }
      if (typeof window !== "undefined") {
        return window;
      }
      if (typeof global2 !== "undefined") {
        return global2;
      }
      throw new Error("unable to locate global object");
    };
    var global2 = getGlobal();
    module.exports = exports = global2.fetch;
    if (global2.fetch) {
      exports.default = global2.fetch.bind(global2);
    }
    exports.Headers = global2.Headers;
    exports.Request = global2.Request;
    exports.Response = global2.Response;
  })(browser$1, browser$1.exports);
  return browser$1.exports;
}
var lib$7 = {};
var StrictEventEmitter$1 = {};
var events = { exports: {} };
var R = typeof Reflect === "object" ? Reflect : null;
var ReflectApply = R && typeof R.apply === "function" ? R.apply : function ReflectApply2(target, receiver, args) {
  return Function.prototype.apply.call(target, receiver, args);
};
var ReflectOwnKeys;
if (R && typeof R.ownKeys === "function") {
  ReflectOwnKeys = R.ownKeys;
} else if (Object.getOwnPropertySymbols) {
  ReflectOwnKeys = function ReflectOwnKeys2(target) {
    return Object.getOwnPropertyNames(target).concat(Object.getOwnPropertySymbols(target));
  };
} else {
  ReflectOwnKeys = function ReflectOwnKeys2(target) {
    return Object.getOwnPropertyNames(target);
  };
}
function ProcessEmitWarning(warning) {
  if (console && console.warn)
    console.warn(warning);
}
var NumberIsNaN = Number.isNaN || function NumberIsNaN2(value) {
  return value !== value;
};
function EventEmitter() {
  EventEmitter.init.call(this);
}
events.exports = EventEmitter;
events.exports.once = once2;
EventEmitter.EventEmitter = EventEmitter;
EventEmitter.prototype._events = void 0;
EventEmitter.prototype._eventsCount = 0;
EventEmitter.prototype._maxListeners = void 0;
var defaultMaxListeners = 10;
function checkListener(listener) {
  if (typeof listener !== "function") {
    throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
  }
}
Object.defineProperty(EventEmitter, "defaultMaxListeners", {
  enumerable: true,
  get: function() {
    return defaultMaxListeners;
  },
  set: function(arg) {
    if (typeof arg !== "number" || arg < 0 || NumberIsNaN(arg)) {
      throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + ".");
    }
    defaultMaxListeners = arg;
  }
});
EventEmitter.init = function() {
  if (this._events === void 0 || this._events === Object.getPrototypeOf(this)._events) {
    this._events = /* @__PURE__ */ Object.create(null);
    this._eventsCount = 0;
  }
  this._maxListeners = this._maxListeners || void 0;
};
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== "number" || n < 0 || NumberIsNaN(n)) {
    throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n + ".");
  }
  this._maxListeners = n;
  return this;
};
function _getMaxListeners(that) {
  if (that._maxListeners === void 0)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}
EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return _getMaxListeners(this);
};
EventEmitter.prototype.emit = function emit(type) {
  var args = [];
  for (var i = 1; i < arguments.length; i++)
    args.push(arguments[i]);
  var doError = type === "error";
  var events2 = this._events;
  if (events2 !== void 0)
    doError = doError && events2.error === void 0;
  else if (!doError)
    return false;
  if (doError) {
    var er;
    if (args.length > 0)
      er = args[0];
    if (er instanceof Error) {
      throw er;
    }
    var err = new Error("Unhandled error." + (er ? " (" + er.message + ")" : ""));
    err.context = er;
    throw err;
  }
  var handler = events2[type];
  if (handler === void 0)
    return false;
  if (typeof handler === "function") {
    ReflectApply(handler, this, args);
  } else {
    var len = handler.length;
    var listeners3 = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      ReflectApply(listeners3[i], this, args);
  }
  return true;
};
function _addListener(target, type, listener, prepend) {
  var m;
  var events2;
  var existing;
  checkListener(listener);
  events2 = target._events;
  if (events2 === void 0) {
    events2 = target._events = /* @__PURE__ */ Object.create(null);
    target._eventsCount = 0;
  } else {
    if (events2.newListener !== void 0) {
      target.emit(
        "newListener",
        type,
        listener.listener ? listener.listener : listener
      );
      events2 = target._events;
    }
    existing = events2[type];
  }
  if (existing === void 0) {
    existing = events2[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === "function") {
      existing = events2[type] = prepend ? [listener, existing] : [existing, listener];
    } else if (prepend) {
      existing.unshift(listener);
    } else {
      existing.push(listener);
    }
    m = _getMaxListeners(target);
    if (m > 0 && existing.length > m && !existing.warned) {
      existing.warned = true;
      var w = new Error("Possible EventEmitter memory leak detected. " + existing.length + " " + String(type) + " listeners added. Use emitter.setMaxListeners() to increase limit");
      w.name = "MaxListenersExceededWarning";
      w.emitter = target;
      w.type = type;
      w.count = existing.length;
      ProcessEmitWarning(w);
    }
  }
  return target;
}
EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};
EventEmitter.prototype.on = EventEmitter.prototype.addListener;
EventEmitter.prototype.prependListener = function prependListener(type, listener) {
  return _addListener(this, type, listener, true);
};
function onceWrapper() {
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    if (arguments.length === 0)
      return this.listener.call(this.target);
    return this.listener.apply(this.target, arguments);
  }
}
function _onceWrap(target, type, listener) {
  var state = { fired: false, wrapFn: void 0, target, type, listener };
  var wrapped = onceWrapper.bind(state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}
EventEmitter.prototype.once = function once(type, listener) {
  checkListener(listener);
  this.on(type, _onceWrap(this, type, listener));
  return this;
};
EventEmitter.prototype.prependOnceListener = function prependOnceListener(type, listener) {
  checkListener(listener);
  this.prependListener(type, _onceWrap(this, type, listener));
  return this;
};
EventEmitter.prototype.removeListener = function removeListener(type, listener) {
  var list, events2, position, i, originalListener;
  checkListener(listener);
  events2 = this._events;
  if (events2 === void 0)
    return this;
  list = events2[type];
  if (list === void 0)
    return this;
  if (list === listener || list.listener === listener) {
    if (--this._eventsCount === 0)
      this._events = /* @__PURE__ */ Object.create(null);
    else {
      delete events2[type];
      if (events2.removeListener)
        this.emit("removeListener", type, list.listener || listener);
    }
  } else if (typeof list !== "function") {
    position = -1;
    for (i = list.length - 1; i >= 0; i--) {
      if (list[i] === listener || list[i].listener === listener) {
        originalListener = list[i].listener;
        position = i;
        break;
      }
    }
    if (position < 0)
      return this;
    if (position === 0)
      list.shift();
    else {
      spliceOne(list, position);
    }
    if (list.length === 1)
      events2[type] = list[0];
    if (events2.removeListener !== void 0)
      this.emit("removeListener", type, originalListener || listener);
  }
  return this;
};
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.removeAllListeners = function removeAllListeners(type) {
  var listeners3, events2, i;
  events2 = this._events;
  if (events2 === void 0)
    return this;
  if (events2.removeListener === void 0) {
    if (arguments.length === 0) {
      this._events = /* @__PURE__ */ Object.create(null);
      this._eventsCount = 0;
    } else if (events2[type] !== void 0) {
      if (--this._eventsCount === 0)
        this._events = /* @__PURE__ */ Object.create(null);
      else
        delete events2[type];
    }
    return this;
  }
  if (arguments.length === 0) {
    var keys = Object.keys(events2);
    var key;
    for (i = 0; i < keys.length; ++i) {
      key = keys[i];
      if (key === "removeListener")
        continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners("removeListener");
    this._events = /* @__PURE__ */ Object.create(null);
    this._eventsCount = 0;
    return this;
  }
  listeners3 = events2[type];
  if (typeof listeners3 === "function") {
    this.removeListener(type, listeners3);
  } else if (listeners3 !== void 0) {
    for (i = listeners3.length - 1; i >= 0; i--) {
      this.removeListener(type, listeners3[i]);
    }
  }
  return this;
};
function _listeners(target, type, unwrap) {
  var events2 = target._events;
  if (events2 === void 0)
    return [];
  var evlistener = events2[type];
  if (evlistener === void 0)
    return [];
  if (typeof evlistener === "function")
    return unwrap ? [evlistener.listener || evlistener] : [evlistener];
  return unwrap ? unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
}
EventEmitter.prototype.listeners = function listeners(type) {
  return _listeners(this, type, true);
};
EventEmitter.prototype.rawListeners = function rawListeners(type) {
  return _listeners(this, type, false);
};
EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === "function") {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};
EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events2 = this._events;
  if (events2 !== void 0) {
    var evlistener = events2[type];
    if (typeof evlistener === "function") {
      return 1;
    } else if (evlistener !== void 0) {
      return evlistener.length;
    }
  }
  return 0;
}
EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];
};
function arrayClone(arr, n) {
  var copy = new Array(n);
  for (var i = 0; i < n; ++i)
    copy[i] = arr[i];
  return copy;
}
function spliceOne(list, index) {
  for (; index + 1 < list.length; index++)
    list[index] = list[index + 1];
  list.pop();
}
function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}
function once2(emitter, name) {
  return new Promise(function(resolve, reject) {
    function errorListener(err) {
      emitter.removeListener(name, resolver);
      reject(err);
    }
    function resolver() {
      if (typeof emitter.removeListener === "function") {
        emitter.removeListener("error", errorListener);
      }
      resolve([].slice.call(arguments));
    }
    eventTargetAgnosticAddListener(emitter, name, resolver, { once: true });
    if (name !== "error") {
      addErrorHandlerIfEventEmitter(emitter, errorListener, { once: true });
    }
  });
}
function addErrorHandlerIfEventEmitter(emitter, handler, flags2) {
  if (typeof emitter.on === "function") {
    eventTargetAgnosticAddListener(emitter, "error", handler, flags2);
  }
}
function eventTargetAgnosticAddListener(emitter, name, listener, flags2) {
  if (typeof emitter.on === "function") {
    if (flags2.once) {
      emitter.once(name, listener);
    } else {
      emitter.on(name, listener);
    }
  } else if (typeof emitter.addEventListener === "function") {
    emitter.addEventListener(name, function wrapListener(arg) {
      if (flags2.once) {
        emitter.removeEventListener(name, wrapListener);
      }
      listener(arg);
    });
  } else {
    throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof emitter);
  }
}
var __extends$2 = commonjsGlobal && commonjsGlobal.__extends || function() {
  var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
      d2.__proto__ = b2;
    } || function(d2, b2) {
      for (var p in b2)
        if (Object.prototype.hasOwnProperty.call(b2, p))
          d2[p] = b2[p];
    };
    return extendStatics(d, b);
  };
  return function(d, b) {
    extendStatics(d, b);
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
}();
var __spreadArrays = commonjsGlobal && commonjsGlobal.__spreadArrays || function() {
  for (var s = 0, i = 0, il = arguments.length; i < il; i++)
    s += arguments[i].length;
  for (var r = Array(s), k = 0, i = 0; i < il; i++)
    for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
      r[k] = a[j];
  return r;
};
StrictEventEmitter$1.__esModule = true;
StrictEventEmitter$1.StrictEventEmitter = void 0;
var events_1 = events.exports;
var StrictEventEmitter = function(_super) {
  __extends$2(StrictEventEmitter2, _super);
  function StrictEventEmitter2() {
    return _super.call(this) || this;
  }
  StrictEventEmitter2.prototype.on = function(event, listener) {
    return _super.prototype.on.call(this, event.toString(), listener);
  };
  StrictEventEmitter2.prototype.once = function(event, listener) {
    return _super.prototype.on.call(this, event.toString(), listener);
  };
  StrictEventEmitter2.prototype.off = function(event, listener) {
    return _super.prototype.off.call(this, event.toString(), listener);
  };
  StrictEventEmitter2.prototype.emit = function(event) {
    var data2 = [];
    for (var _i = 1; _i < arguments.length; _i++) {
      data2[_i - 1] = arguments[_i];
    }
    return _super.prototype.emit.apply(this, __spreadArrays([event.toString()], data2));
  };
  StrictEventEmitter2.prototype.addListener = function(event, listener) {
    return _super.prototype.addListener.call(this, event.toString(), listener);
  };
  StrictEventEmitter2.prototype.prependListener = function(event, listener) {
    return _super.prototype.prependListener.call(this, event.toString(), listener);
  };
  StrictEventEmitter2.prototype.prependOnceListener = function(event, listener) {
    return _super.prototype.prependOnceListener.call(this, event.toString(), listener);
  };
  StrictEventEmitter2.prototype.removeListener = function(event, listener) {
    return _super.prototype.removeListener.call(this, event.toString(), listener);
  };
  StrictEventEmitter2.prototype.removeAllListeners = function(event) {
    return _super.prototype.removeAllListeners.call(this, event ? event.toString() : void 0);
  };
  StrictEventEmitter2.prototype.eventNames = function() {
    return _super.prototype.eventNames.call(this);
  };
  StrictEventEmitter2.prototype.listeners = function(event) {
    return _super.prototype.listeners.call(this, event.toString());
  };
  StrictEventEmitter2.prototype.rawListeners = function(event) {
    return _super.prototype.rawListeners.call(this, event.toString());
  };
  StrictEventEmitter2.prototype.listenerCount = function(event) {
    return _super.prototype.listenerCount.call(this, event.toString());
  };
  return StrictEventEmitter2;
}(events_1.EventEmitter);
StrictEventEmitter$1.StrictEventEmitter = StrictEventEmitter;
(function(exports) {
  var __createBinding = commonjsGlobal && commonjsGlobal.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === void 0)
      k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() {
      return m[k];
    } });
  } : function(o, m, k, k2) {
    if (k2 === void 0)
      k2 = k;
    o[k2] = m[k];
  });
  var __exportStar = commonjsGlobal && commonjsGlobal.__exportStar || function(m, exports2) {
    for (var p in m)
      if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p))
        __createBinding(exports2, m, p);
  };
  exports.__esModule = true;
  __exportStar(StrictEventEmitter$1, exports);
})(lib$7);
var lib$6 = {};
var until = {};
Object.defineProperty(until, "__esModule", { value: true });
until.until = async (promise2) => {
  try {
    const data2 = await promise2().catch((error2) => {
      throw error2;
    });
    return [null, data2];
  } catch (error2) {
    return [error2, null];
  }
};
Object.defineProperty(lib$6, "__esModule", { value: true });
var until_1 = until;
lib$6.until = until_1.until;
var lib$5 = {};
var invariant$1 = {};
var format$1 = {};
Object.defineProperty(format$1, "__esModule", { value: true });
format$1.format = void 0;
var POSITIONALS_EXP = /(%?)(%([sdjo]))/g;
function serializePositional(positional, flag) {
  switch (flag) {
    case "s":
      return positional;
    case "d":
    case "i":
      return Number(positional);
    case "j":
      return JSON.stringify(positional);
    case "o": {
      if (typeof positional === "string") {
        return positional;
      }
      var json2 = JSON.stringify(positional);
      if (json2 === "{}" || json2 === "[]" || /^\[object .+?\]$/.test(json2)) {
        return positional;
      }
      return json2;
    }
  }
}
function format(message) {
  var positionals = [];
  for (var _i = 1; _i < arguments.length; _i++) {
    positionals[_i - 1] = arguments[_i];
  }
  if (positionals.length === 0) {
    return message;
  }
  var positionalIndex = 0;
  var formattedMessage = message.replace(POSITIONALS_EXP, function(match2, isEscaped, _, flag) {
    var positional = positionals[positionalIndex];
    var value = serializePositional(positional, flag);
    if (!isEscaped) {
      positionalIndex++;
      return value;
    }
    return match2;
  });
  if (positionalIndex < positionals.length) {
    formattedMessage += " " + positionals.slice(positionalIndex).join(" ");
  }
  formattedMessage = formattedMessage.replace(/%{2,2}/g, "%");
  return formattedMessage;
}
format$1.format = format;
(function(exports) {
  var __extends2 = commonjsGlobal && commonjsGlobal.__extends || function() {
    var extendStatics = function(d, b) {
      extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
        d2.__proto__ = b2;
      } || function(d2, b2) {
        for (var p in b2)
          if (Object.prototype.hasOwnProperty.call(b2, p))
            d2[p] = b2[p];
      };
      return extendStatics(d, b);
    };
    return function(d, b) {
      if (typeof b !== "function" && b !== null)
        throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
  }();
  var __spreadArray = commonjsGlobal && commonjsGlobal.__spreadArray || function(to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
      to[j] = from[i];
    return to;
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.invariant = exports.createInvariantWith = exports.InvariantError = void 0;
  var format_1 = format$1;
  var STACK_FRAMES_TO_IGNORE = 2;
  function cleanErrorStack(error2) {
    if (!error2.stack) {
      return;
    }
    var nextStack = error2.stack.split("\n");
    nextStack.splice(1, STACK_FRAMES_TO_IGNORE);
    error2.stack = nextStack.join("\n");
  }
  var InvariantError = function(_super) {
    __extends2(InvariantError2, _super);
    function InvariantError2(message) {
      var positionals = [];
      for (var _i = 1; _i < arguments.length; _i++) {
        positionals[_i - 1] = arguments[_i];
      }
      var _this = _super.call(this, message) || this;
      _this.message = message;
      _this.name = "Invariant Violation";
      _this.message = format_1.format.apply(void 0, __spreadArray([message], positionals));
      cleanErrorStack(_this);
      return _this;
    }
    return InvariantError2;
  }(Error);
  exports.InvariantError = InvariantError;
  function createInvariantWith(ErrorConstructor) {
    var invariant2 = function(predicate, message) {
      var positionals = [];
      for (var _i = 2; _i < arguments.length; _i++) {
        positionals[_i - 2] = arguments[_i];
      }
      if (!predicate) {
        var resolvedMessage = format_1.format.apply(void 0, __spreadArray([message], positionals));
        var isConstructor = !!ErrorConstructor.prototype.name;
        var error2 = isConstructor ? new ErrorConstructor(resolvedMessage) : ErrorConstructor(resolvedMessage);
        cleanErrorStack(error2);
        throw error2;
      }
    };
    return invariant2;
  }
  exports.createInvariantWith = createInvariantWith;
  function polymorphicInvariant(ErrorClass) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
      args[_i - 1] = arguments[_i];
    }
    return createInvariantWith(ErrorClass).apply(void 0, args);
  }
  exports.invariant = createInvariantWith(InvariantError);
  exports.invariant.as = polymorphicInvariant;
})(invariant$1);
(function(exports) {
  var __createBinding = commonjsGlobal && commonjsGlobal.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === void 0)
      k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() {
      return m[k];
    } });
  } : function(o, m, k, k2) {
    if (k2 === void 0)
      k2 = k;
    o[k2] = m[k];
  });
  var __exportStar = commonjsGlobal && commonjsGlobal.__exportStar || function(m, exports2) {
    for (var p in m)
      if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p))
        __createBinding(exports2, m, p);
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  __exportStar(invariant$1, exports);
  __exportStar(format$1, exports);
})(lib$5);
var lib$4 = {};
var glossary = {};
Object.defineProperty(glossary, "__esModule", { value: true });
glossary.IS_PATCHED_MODULE = void 0;
glossary.IS_PATCHED_MODULE = Symbol("isPatchedModule");
var Interceptor = {};
var browser = { exports: {} };
var _ms_2_1_2_ms;
var hasRequired_ms_2_1_2_ms;
function require_ms_2_1_2_ms() {
  if (hasRequired_ms_2_1_2_ms)
    return _ms_2_1_2_ms;
  hasRequired_ms_2_1_2_ms = 1;
  var s = 1e3;
  var m = s * 60;
  var h = m * 60;
  var d = h * 24;
  var w = d * 7;
  var y = d * 365.25;
  _ms_2_1_2_ms = function(val, options) {
    options = options || {};
    var type = typeof val;
    if (type === "string" && val.length > 0) {
      return parse2(val);
    } else if (type === "number" && isFinite(val)) {
      return options.long ? fmtLong(val) : fmtShort(val);
    }
    throw new Error(
      "val is not a non-empty string or a valid number. val=" + JSON.stringify(val)
    );
  };
  function parse2(str) {
    str = String(str);
    if (str.length > 100) {
      return;
    }
    var match2 = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
      str
    );
    if (!match2) {
      return;
    }
    var n = parseFloat(match2[1]);
    var type = (match2[2] || "ms").toLowerCase();
    switch (type) {
      case "years":
      case "year":
      case "yrs":
      case "yr":
      case "y":
        return n * y;
      case "weeks":
      case "week":
      case "w":
        return n * w;
      case "days":
      case "day":
      case "d":
        return n * d;
      case "hours":
      case "hour":
      case "hrs":
      case "hr":
      case "h":
        return n * h;
      case "minutes":
      case "minute":
      case "mins":
      case "min":
      case "m":
        return n * m;
      case "seconds":
      case "second":
      case "secs":
      case "sec":
      case "s":
        return n * s;
      case "milliseconds":
      case "millisecond":
      case "msecs":
      case "msec":
      case "ms":
        return n;
      default:
        return void 0;
    }
  }
  function fmtShort(ms) {
    var msAbs = Math.abs(ms);
    if (msAbs >= d) {
      return Math.round(ms / d) + "d";
    }
    if (msAbs >= h) {
      return Math.round(ms / h) + "h";
    }
    if (msAbs >= m) {
      return Math.round(ms / m) + "m";
    }
    if (msAbs >= s) {
      return Math.round(ms / s) + "s";
    }
    return ms + "ms";
  }
  function fmtLong(ms) {
    var msAbs = Math.abs(ms);
    if (msAbs >= d) {
      return plural(ms, msAbs, d, "day");
    }
    if (msAbs >= h) {
      return plural(ms, msAbs, h, "hour");
    }
    if (msAbs >= m) {
      return plural(ms, msAbs, m, "minute");
    }
    if (msAbs >= s) {
      return plural(ms, msAbs, s, "second");
    }
    return ms + " ms";
  }
  function plural(ms, msAbs, n, name) {
    var isPlural = msAbs >= n * 1.5;
    return Math.round(ms / n) + " " + name + (isPlural ? "s" : "");
  }
  return _ms_2_1_2_ms;
}
function setup(env) {
  createDebug.debug = createDebug;
  createDebug.default = createDebug;
  createDebug.coerce = coerce;
  createDebug.disable = disable;
  createDebug.enable = enable;
  createDebug.enabled = enabled;
  createDebug.humanize = require_ms_2_1_2_ms();
  createDebug.destroy = destroy;
  Object.keys(env).forEach((key) => {
    createDebug[key] = env[key];
  });
  createDebug.names = [];
  createDebug.skips = [];
  createDebug.formatters = {};
  function selectColor(namespace) {
    let hash2 = 0;
    for (let i = 0; i < namespace.length; i++) {
      hash2 = (hash2 << 5) - hash2 + namespace.charCodeAt(i);
      hash2 |= 0;
    }
    return createDebug.colors[Math.abs(hash2) % createDebug.colors.length];
  }
  createDebug.selectColor = selectColor;
  function createDebug(namespace) {
    let prevTime;
    let enableOverride = null;
    let namespacesCache;
    let enabledCache;
    function debug(...args) {
      if (!debug.enabled) {
        return;
      }
      const self2 = debug;
      const curr = Number(new Date());
      const ms = curr - (prevTime || curr);
      self2.diff = ms;
      self2.prev = prevTime;
      self2.curr = curr;
      prevTime = curr;
      args[0] = createDebug.coerce(args[0]);
      if (typeof args[0] !== "string") {
        args.unshift("%O");
      }
      let index = 0;
      args[0] = args[0].replace(/%([a-zA-Z%])/g, (match2, format2) => {
        if (match2 === "%%") {
          return "%";
        }
        index++;
        const formatter = createDebug.formatters[format2];
        if (typeof formatter === "function") {
          const val = args[index];
          match2 = formatter.call(self2, val);
          args.splice(index, 1);
          index--;
        }
        return match2;
      });
      createDebug.formatArgs.call(self2, args);
      const logFn = self2.log || createDebug.log;
      logFn.apply(self2, args);
    }
    debug.namespace = namespace;
    debug.useColors = createDebug.useColors();
    debug.color = createDebug.selectColor(namespace);
    debug.extend = extend;
    debug.destroy = createDebug.destroy;
    Object.defineProperty(debug, "enabled", {
      enumerable: true,
      configurable: false,
      get: () => {
        if (enableOverride !== null) {
          return enableOverride;
        }
        if (namespacesCache !== createDebug.namespaces) {
          namespacesCache = createDebug.namespaces;
          enabledCache = createDebug.enabled(namespace);
        }
        return enabledCache;
      },
      set: (v) => {
        enableOverride = v;
      }
    });
    if (typeof createDebug.init === "function") {
      createDebug.init(debug);
    }
    return debug;
  }
  function extend(namespace, delimiter) {
    const newDebug = createDebug(this.namespace + (typeof delimiter === "undefined" ? ":" : delimiter) + namespace);
    newDebug.log = this.log;
    return newDebug;
  }
  function enable(namespaces) {
    createDebug.save(namespaces);
    createDebug.namespaces = namespaces;
    createDebug.names = [];
    createDebug.skips = [];
    let i;
    const split = (typeof namespaces === "string" ? namespaces : "").split(/[\s,]+/);
    const len = split.length;
    for (i = 0; i < len; i++) {
      if (!split[i]) {
        continue;
      }
      namespaces = split[i].replace(/\*/g, ".*?");
      if (namespaces[0] === "-") {
        createDebug.skips.push(new RegExp("^" + namespaces.slice(1) + "$"));
      } else {
        createDebug.names.push(new RegExp("^" + namespaces + "$"));
      }
    }
  }
  function disable() {
    const namespaces = [
      ...createDebug.names.map(toNamespace),
      ...createDebug.skips.map(toNamespace).map((namespace) => "-" + namespace)
    ].join(",");
    createDebug.enable("");
    return namespaces;
  }
  function enabled(name) {
    if (name[name.length - 1] === "*") {
      return true;
    }
    let i;
    let len;
    for (i = 0, len = createDebug.skips.length; i < len; i++) {
      if (createDebug.skips[i].test(name)) {
        return false;
      }
    }
    for (i = 0, len = createDebug.names.length; i < len; i++) {
      if (createDebug.names[i].test(name)) {
        return true;
      }
    }
    return false;
  }
  function toNamespace(regexp) {
    return regexp.toString().substring(2, regexp.toString().length - 2).replace(/\.\*\?$/, "*");
  }
  function coerce(val) {
    if (val instanceof Error) {
      return val.stack || val.message;
    }
    return val;
  }
  function destroy() {
    console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
  }
  createDebug.enable(createDebug.load());
  return createDebug;
}
var common = setup;
(function(module, exports) {
  exports.formatArgs = formatArgs;
  exports.save = save;
  exports.load = load;
  exports.useColors = useColors;
  exports.storage = localstorage();
  exports.destroy = (() => {
    let warned = false;
    return () => {
      if (!warned) {
        warned = true;
        console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
      }
    };
  })();
  exports.colors = [
    "#0000CC",
    "#0000FF",
    "#0033CC",
    "#0033FF",
    "#0066CC",
    "#0066FF",
    "#0099CC",
    "#0099FF",
    "#00CC00",
    "#00CC33",
    "#00CC66",
    "#00CC99",
    "#00CCCC",
    "#00CCFF",
    "#3300CC",
    "#3300FF",
    "#3333CC",
    "#3333FF",
    "#3366CC",
    "#3366FF",
    "#3399CC",
    "#3399FF",
    "#33CC00",
    "#33CC33",
    "#33CC66",
    "#33CC99",
    "#33CCCC",
    "#33CCFF",
    "#6600CC",
    "#6600FF",
    "#6633CC",
    "#6633FF",
    "#66CC00",
    "#66CC33",
    "#9900CC",
    "#9900FF",
    "#9933CC",
    "#9933FF",
    "#99CC00",
    "#99CC33",
    "#CC0000",
    "#CC0033",
    "#CC0066",
    "#CC0099",
    "#CC00CC",
    "#CC00FF",
    "#CC3300",
    "#CC3333",
    "#CC3366",
    "#CC3399",
    "#CC33CC",
    "#CC33FF",
    "#CC6600",
    "#CC6633",
    "#CC9900",
    "#CC9933",
    "#CCCC00",
    "#CCCC33",
    "#FF0000",
    "#FF0033",
    "#FF0066",
    "#FF0099",
    "#FF00CC",
    "#FF00FF",
    "#FF3300",
    "#FF3333",
    "#FF3366",
    "#FF3399",
    "#FF33CC",
    "#FF33FF",
    "#FF6600",
    "#FF6633",
    "#FF9900",
    "#FF9933",
    "#FFCC00",
    "#FFCC33"
  ];
  function useColors() {
    if (typeof window !== "undefined" && window.process && (window.process.type === "renderer" || window.process.__nwjs)) {
      return true;
    }
    if (typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
      return false;
    }
    return typeof document !== "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31 || typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
  }
  function formatArgs(args) {
    args[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + args[0] + (this.useColors ? "%c " : " ") + "+" + module.exports.humanize(this.diff);
    if (!this.useColors) {
      return;
    }
    const c = "color: " + this.color;
    args.splice(1, 0, c, "color: inherit");
    let index = 0;
    let lastC = 0;
    args[0].replace(/%[a-zA-Z%]/g, (match2) => {
      if (match2 === "%%") {
        return;
      }
      index++;
      if (match2 === "%c") {
        lastC = index;
      }
    });
    args.splice(lastC, 0, c);
  }
  exports.log = console.debug || console.log || (() => {
  });
  function save(namespaces) {
    try {
      if (namespaces) {
        exports.storage.setItem("debug", namespaces);
      } else {
        exports.storage.removeItem("debug");
      }
    } catch (error2) {
    }
  }
  function load() {
    let r;
    try {
      r = exports.storage.getItem("debug");
    } catch (error2) {
    }
    if (!r && typeof process !== "undefined" && "env" in process) {
      r = {}.DEBUG;
    }
    return r;
  }
  function localstorage() {
    try {
      return localStorage;
    } catch (error2) {
    }
  }
  module.exports = common(exports);
  const { formatters } = module.exports;
  formatters.j = function(v) {
    try {
      return JSON.stringify(v);
    } catch (error2) {
      return "[UnexpectedJSONParseError]: " + error2.message;
    }
  };
})(browser, browser.exports);
var AsyncEventEmitter = {};
var nextTick$1 = {};
Object.defineProperty(nextTick$1, "__esModule", { value: true });
nextTick$1.nextTickAsync = nextTick$1.nextTick = void 0;
function nextTick(callback) {
  setTimeout(callback, 0);
}
nextTick$1.nextTick = nextTick;
function nextTickAsync(callback) {
  return new Promise(function(resolve) {
    setTimeout(function() {
      resolve(callback());
    }, 0);
  });
}
nextTick$1.nextTickAsync = nextTickAsync;
(function(exports) {
  var __extends2 = commonjsGlobal && commonjsGlobal.__extends || function() {
    var extendStatics = function(d, b) {
      extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
        d2.__proto__ = b2;
      } || function(d2, b2) {
        for (var p in b2)
          if (Object.prototype.hasOwnProperty.call(b2, p))
            d2[p] = b2[p];
      };
      return extendStatics(d, b);
    };
    return function(d, b) {
      if (typeof b !== "function" && b !== null)
        throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
  }();
  var __awaiter2 = commonjsGlobal && commonjsGlobal.__awaiter || function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve) {
        resolve(value);
      });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
  var __generator2 = commonjsGlobal && commonjsGlobal.__generator || function(thisArg, body2) {
    var _ = { label: 0, sent: function() {
      if (t[0] & 1)
        throw t[1];
      return t[1];
    }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
      return this;
    }), g;
    function verb(n) {
      return function(v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f)
        throw new TypeError("Generator is already executing.");
      while (_)
        try {
          if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done)
            return t;
          if (y = 0, t)
            op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2])
                _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body2.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5)
        throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
  var __read2 = commonjsGlobal && commonjsGlobal.__read || function(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m)
      return o;
    var i = m.call(o), r, ar = [], e;
    try {
      while ((n === void 0 || n-- > 0) && !(r = i.next()).done)
        ar.push(r.value);
    } catch (error2) {
      e = { error: error2 };
    } finally {
      try {
        if (r && !r.done && (m = i["return"]))
          m.call(i);
      } finally {
        if (e)
          throw e.error;
      }
    }
    return ar;
  };
  var __spreadArray = commonjsGlobal && commonjsGlobal.__spreadArray || function(to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
      to[j] = from[i];
    return to;
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.AsyncEventEmitter = exports.AsyncEventEmitterReadyState = void 0;
  var debug_1 = browser.exports;
  var strict_event_emitter_1 = lib$7;
  var nextTick_1 = nextTick$1;
  var AsyncEventEmitterReadyState;
  (function(AsyncEventEmitterReadyState2) {
    AsyncEventEmitterReadyState2["ACTIVE"] = "ACTIVE";
    AsyncEventEmitterReadyState2["DEACTIVATED"] = "DEACTIVATED";
  })(AsyncEventEmitterReadyState = exports.AsyncEventEmitterReadyState || (exports.AsyncEventEmitterReadyState = {}));
  var AsyncEventEmitter2 = function(_super) {
    __extends2(AsyncEventEmitter3, _super);
    function AsyncEventEmitter3() {
      var _this = _super.call(this) || this;
      _this.log = debug_1.debug("async-event-emitter");
      _this.queue = /* @__PURE__ */ new Map();
      _this.readyState = AsyncEventEmitterReadyState.ACTIVE;
      return _this;
    }
    AsyncEventEmitter3.prototype.on = function(event, listener) {
      var _this = this;
      var log = this.log.extend("on");
      log('adding "%s" listener...', event);
      if (this.readyState === AsyncEventEmitterReadyState.DEACTIVATED) {
        log("the emitter is destroyed, skipping!");
        return this;
      }
      return _super.prototype.on.call(this, event, function() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
          args[_i] = arguments[_i];
        }
        return __awaiter2(_this, void 0, void 0, function() {
          var queue;
          var _this2 = this;
          return __generator2(this, function(_a2) {
            queue = this.openListenerQueue(event);
            log('awaiting the "%s" listener...', event);
            queue.push({
              args,
              done: new Promise(function(resolve, reject) {
                return __awaiter2(_this2, void 0, void 0, function() {
                  var error_1;
                  return __generator2(this, function(_a3) {
                    switch (_a3.label) {
                      case 0:
                        _a3.trys.push([0, 2, , 3]);
                        return [4, listener.apply(void 0, __spreadArray([], __read2(args)))];
                      case 1:
                        _a3.sent();
                        resolve();
                        log('"%s" listener has resolved!', event);
                        return [3, 3];
                      case 2:
                        error_1 = _a3.sent();
                        log('"%s" listener has rejected!', error_1);
                        reject(error_1);
                        return [3, 3];
                      case 3:
                        return [2];
                    }
                  });
                });
              })
            });
            return [2];
          });
        });
      });
    };
    AsyncEventEmitter3.prototype.emit = function(event) {
      var _this = this;
      var args = [];
      for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
      }
      var log = this.log.extend("emit");
      log('emitting "%s" event...', event);
      if (this.readyState === AsyncEventEmitterReadyState.DEACTIVATED) {
        log("the emitter is destroyed, skipping!");
        return false;
      }
      this.openListenerQueue(event);
      log('appending a one-time cleanup "%s" listener...', event);
      this.once(event, function() {
        nextTick_1.nextTick(function() {
          _this.queue.delete(event);
          log('cleaned up "%s" listeners queue!', event);
        });
      });
      return _super.prototype.emit.apply(this, __spreadArray([event], __read2(args)));
    };
    AsyncEventEmitter3.prototype.untilIdle = function(event, filter) {
      if (filter === void 0) {
        filter = function() {
          return true;
        };
      }
      return __awaiter2(this, void 0, void 0, function() {
        var listenersQueue;
        var _this = this;
        return __generator2(this, function(_a2) {
          switch (_a2.label) {
            case 0:
              listenersQueue = this.queue.get(event) || [];
              return [4, Promise.all(listenersQueue.filter(filter).map(function(_a3) {
                var done = _a3.done;
                return done;
              })).finally(function() {
                _this.queue.delete(event);
              })];
            case 1:
              _a2.sent();
              return [2];
          }
        });
      });
    };
    AsyncEventEmitter3.prototype.openListenerQueue = function(event) {
      var log = this.log.extend("openListenerQueue");
      log('opening "%s" listeners queue...', event);
      var queue = this.queue.get(event);
      if (!queue) {
        log("no queue found, creating one...");
        this.queue.set(event, []);
        return [];
      }
      log("returning an exising queue:", queue);
      return queue;
    };
    AsyncEventEmitter3.prototype.removeAllListeners = function(event) {
      var log = this.log.extend("removeAllListeners");
      log("event:", event);
      if (event) {
        this.queue.delete(event);
        log('cleared the "%s" listeners queue!', event, this.queue.get(event));
      } else {
        this.queue.clear();
        log("cleared the listeners queue!", this.queue);
      }
      return _super.prototype.removeAllListeners.call(this, event);
    };
    AsyncEventEmitter3.prototype.activate = function() {
      var log = this.log.extend("activate");
      this.readyState = AsyncEventEmitterReadyState.ACTIVE;
      log("set state to:", this.readyState);
    };
    AsyncEventEmitter3.prototype.deactivate = function() {
      var log = this.log.extend("deactivate");
      log("removing all listeners...");
      this.removeAllListeners();
      this.readyState = AsyncEventEmitterReadyState.DEACTIVATED;
      log("set state to:", this.readyState);
    };
    return AsyncEventEmitter3;
  }(strict_event_emitter_1.StrictEventEmitter);
  exports.AsyncEventEmitter = AsyncEventEmitter2;
})(AsyncEventEmitter);
(function(exports) {
  var __values2 = commonjsGlobal && commonjsGlobal.__values || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m)
      return m.call(o);
    if (o && typeof o.length === "number")
      return {
        next: function() {
          if (o && i >= o.length)
            o = void 0;
          return { value: o && o[i++], done: !o };
        }
      };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.Interceptor = exports.InterceptorReadyState = exports.deleteGlobalSymbol = exports.getGlobalSymbol = void 0;
  var debug_1 = browser.exports;
  var AsyncEventEmitter_1 = AsyncEventEmitter;
  var nextTick_1 = nextTick$1;
  function getGlobalSymbol(symbol) {
    return globalThis[symbol] || void 0;
  }
  exports.getGlobalSymbol = getGlobalSymbol;
  function setGlobalSymbol(symbol, value) {
    globalThis[symbol] = value;
  }
  function deleteGlobalSymbol(symbol) {
    delete globalThis[symbol];
  }
  exports.deleteGlobalSymbol = deleteGlobalSymbol;
  var InterceptorReadyState;
  (function(InterceptorReadyState2) {
    InterceptorReadyState2["IDLE"] = "IDLE";
    InterceptorReadyState2["APPLYING"] = "APPLYING";
    InterceptorReadyState2["APPLIED"] = "APPLIED";
    InterceptorReadyState2["DISPOSING"] = "DISPOSING";
    InterceptorReadyState2["DISPOSED"] = "DISPOSED";
  })(InterceptorReadyState = exports.InterceptorReadyState || (exports.InterceptorReadyState = {}));
  var Interceptor2 = function() {
    function Interceptor3(symbol) {
      this.symbol = symbol;
      this.readyState = InterceptorReadyState.IDLE;
      this.emitter = new AsyncEventEmitter_1.AsyncEventEmitter();
      this.subscriptions = [];
      this.log = debug_1.debug(symbol.description);
      this.emitter.setMaxListeners(0);
      this.log("constructing the interceptor...");
    }
    Interceptor3.prototype.checkEnvironment = function() {
      return true;
    };
    Interceptor3.prototype.apply = function() {
      var _this = this;
      var log = this.log.extend("apply");
      log("applying the interceptor...");
      if (this.readyState === InterceptorReadyState.APPLIED) {
        log("intercepted already applied!");
        return;
      }
      var shouldApply = this.checkEnvironment();
      if (!shouldApply) {
        log("the interceptor cannot be applied in this environment!");
        return;
      }
      this.readyState = InterceptorReadyState.APPLYING;
      this.emitter.activate();
      log("activated the emiter!", this.emitter.readyState);
      var runningInstance = this.getInstance();
      if (runningInstance) {
        log("found a running instance, reusing...");
        this.on = function(event, listener) {
          log('proxying the "%s" listener', event);
          runningInstance.emitter.addListener(event, listener);
          _this.subscriptions.push(function() {
            runningInstance.emitter.removeListener(event, listener);
            log('removed proxied "%s" listener!', event);
          });
        };
        nextTick_1.nextTick(function() {
          _this.readyState = InterceptorReadyState.APPLIED;
        });
        return;
      }
      log("no running instance found, setting up a new instance...");
      this.setup();
      this.setInstance();
      nextTick_1.nextTick(function() {
        _this.readyState = InterceptorReadyState.APPLIED;
      });
    };
    Interceptor3.prototype.setup = function() {
    };
    Interceptor3.prototype.on = function(event, listener) {
      var log = this.log.extend("on");
      if (this.readyState === InterceptorReadyState.DISPOSING || this.readyState === InterceptorReadyState.DISPOSED) {
        log("cannot listen to events, already disposed!");
        return;
      }
      log('adding "%s" event listener:', event, listener.name);
      this.emitter.on(event, listener);
    };
    Interceptor3.prototype.dispose = function() {
      var e_1, _a2;
      var _this = this;
      var log = this.log.extend("dispose");
      if (this.readyState === InterceptorReadyState.DISPOSED) {
        log("cannot dispose, already disposed!");
        return;
      }
      log("disposing the interceptor...");
      this.readyState = InterceptorReadyState.DISPOSING;
      if (!this.getInstance()) {
        log("no interceptors running, skipping dispose...");
        return;
      }
      this.clearInstance();
      log("global symbol deleted:", getGlobalSymbol(this.symbol));
      if (this.subscriptions.length > 0) {
        log("disposing of %d subscriptions...", this.subscriptions.length);
        try {
          for (var _b2 = __values2(this.subscriptions), _c = _b2.next(); !_c.done; _c = _b2.next()) {
            var dispose = _c.value;
            dispose();
          }
        } catch (e_1_1) {
          e_1 = { error: e_1_1 };
        } finally {
          try {
            if (_c && !_c.done && (_a2 = _b2.return))
              _a2.call(_b2);
          } finally {
            if (e_1)
              throw e_1.error;
          }
        }
        this.subscriptions = [];
        log("disposed of all subscriptions!", this.subscriptions.length);
      }
      this.emitter.deactivate();
      log("destroyed the listener!");
      nextTick_1.nextTick(function() {
        _this.readyState = InterceptorReadyState.DISPOSED;
      });
    };
    Interceptor3.prototype.getInstance = function() {
      var _a2;
      var instance2 = getGlobalSymbol(this.symbol);
      this.log("retrieved global instance:", (_a2 = instance2 === null || instance2 === void 0 ? void 0 : instance2.constructor) === null || _a2 === void 0 ? void 0 : _a2.name);
      return instance2;
    };
    Interceptor3.prototype.setInstance = function() {
      setGlobalSymbol(this.symbol, this);
      this.log("set global instance!", this.symbol.description);
    };
    Interceptor3.prototype.clearInstance = function() {
      deleteGlobalSymbol(this.symbol);
      this.log("cleared global instance!", this.symbol.description);
    };
    return Interceptor3;
  }();
  exports.Interceptor = Interceptor2;
})(Interceptor);
var BatchInterceptor$1 = {};
var __extends$1 = commonjsGlobal && commonjsGlobal.__extends || function() {
  var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
      d2.__proto__ = b2;
    } || function(d2, b2) {
      for (var p in b2)
        if (Object.prototype.hasOwnProperty.call(b2, p))
          d2[p] = b2[p];
    };
    return extendStatics(d, b);
  };
  return function(d, b) {
    if (typeof b !== "function" && b !== null)
      throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
}();
var __values = commonjsGlobal && commonjsGlobal.__values || function(o) {
  var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
  if (m)
    return m.call(o);
  if (o && typeof o.length === "number")
    return {
      next: function() {
        if (o && i >= o.length)
          o = void 0;
        return { value: o && o[i++], done: !o };
      }
    };
  throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(BatchInterceptor$1, "__esModule", { value: true });
BatchInterceptor$1.BatchInterceptor = void 0;
var Interceptor_1 = Interceptor;
var BatchInterceptor = function(_super) {
  __extends$1(BatchInterceptor2, _super);
  function BatchInterceptor2(options) {
    var _this = this;
    BatchInterceptor2.symbol = Symbol(options.name);
    _this = _super.call(this, BatchInterceptor2.symbol) || this;
    _this.interceptors = options.interceptors;
    return _this;
  }
  BatchInterceptor2.prototype.setup = function() {
    var e_1, _a2;
    var log = this.log.extend("setup");
    log("applying all %d interceptors...", this.interceptors.length);
    var _loop_1 = function(interceptor2) {
      log('applying "%s" interceptor...', interceptor2.constructor.name);
      interceptor2.apply();
      log("adding interceptor dispose subscription");
      this_1.subscriptions.push(function() {
        return interceptor2.dispose();
      });
    };
    var this_1 = this;
    try {
      for (var _b2 = __values(this.interceptors), _c = _b2.next(); !_c.done; _c = _b2.next()) {
        var interceptor = _c.value;
        _loop_1(interceptor);
      }
    } catch (e_1_1) {
      e_1 = { error: e_1_1 };
    } finally {
      try {
        if (_c && !_c.done && (_a2 = _b2.return))
          _a2.call(_b2);
      } finally {
        if (e_1)
          throw e_1.error;
      }
    }
  };
  BatchInterceptor2.prototype.on = function(event, listener) {
    this.interceptors.forEach(function(interceptor) {
      interceptor.on(event, listener);
    });
  };
  return BatchInterceptor2;
}(Interceptor_1.Interceptor);
BatchInterceptor$1.BatchInterceptor = BatchInterceptor;
var IsomorphicRequest$1 = {};
var bufferUtils = {};
var lib$3 = {};
var util = {};
var types = {};
var shams$1;
var hasRequiredShams$1;
function requireShams$1() {
  if (hasRequiredShams$1)
    return shams$1;
  hasRequiredShams$1 = 1;
  shams$1 = function hasSymbols() {
    if (typeof Symbol !== "function" || typeof Object.getOwnPropertySymbols !== "function") {
      return false;
    }
    if (typeof Symbol.iterator === "symbol") {
      return true;
    }
    var obj = {};
    var sym = Symbol("test");
    var symObj = Object(sym);
    if (typeof sym === "string") {
      return false;
    }
    if (Object.prototype.toString.call(sym) !== "[object Symbol]") {
      return false;
    }
    if (Object.prototype.toString.call(symObj) !== "[object Symbol]") {
      return false;
    }
    var symVal = 42;
    obj[sym] = symVal;
    for (sym in obj) {
      return false;
    }
    if (typeof Object.keys === "function" && Object.keys(obj).length !== 0) {
      return false;
    }
    if (typeof Object.getOwnPropertyNames === "function" && Object.getOwnPropertyNames(obj).length !== 0) {
      return false;
    }
    var syms = Object.getOwnPropertySymbols(obj);
    if (syms.length !== 1 || syms[0] !== sym) {
      return false;
    }
    if (!Object.prototype.propertyIsEnumerable.call(obj, sym)) {
      return false;
    }
    if (typeof Object.getOwnPropertyDescriptor === "function") {
      var descriptor = Object.getOwnPropertyDescriptor(obj, sym);
      if (descriptor.value !== symVal || descriptor.enumerable !== true) {
        return false;
      }
    }
    return true;
  };
  return shams$1;
}
var shams;
var hasRequiredShams;
function requireShams() {
  if (hasRequiredShams)
    return shams;
  hasRequiredShams = 1;
  var hasSymbols = requireShams$1();
  shams = function hasToStringTagShams() {
    return hasSymbols() && !!Symbol.toStringTag;
  };
  return shams;
}
var _hasSymbols_1_0_3_hasSymbols;
var hasRequired_hasSymbols_1_0_3_hasSymbols;
function require_hasSymbols_1_0_3_hasSymbols() {
  if (hasRequired_hasSymbols_1_0_3_hasSymbols)
    return _hasSymbols_1_0_3_hasSymbols;
  hasRequired_hasSymbols_1_0_3_hasSymbols = 1;
  var origSymbol = typeof Symbol !== "undefined" && Symbol;
  var hasSymbolSham = requireShams$1();
  _hasSymbols_1_0_3_hasSymbols = function hasNativeSymbols() {
    if (typeof origSymbol !== "function") {
      return false;
    }
    if (typeof Symbol !== "function") {
      return false;
    }
    if (typeof origSymbol("foo") !== "symbol") {
      return false;
    }
    if (typeof Symbol("bar") !== "symbol") {
      return false;
    }
    return hasSymbolSham();
  };
  return _hasSymbols_1_0_3_hasSymbols;
}
var implementation;
var hasRequiredImplementation;
function requireImplementation() {
  if (hasRequiredImplementation)
    return implementation;
  hasRequiredImplementation = 1;
  var ERROR_MESSAGE = "Function.prototype.bind called on incompatible ";
  var slice = Array.prototype.slice;
  var toStr = Object.prototype.toString;
  var funcType = "[object Function]";
  implementation = function bind(that) {
    var target = this;
    if (typeof target !== "function" || toStr.call(target) !== funcType) {
      throw new TypeError(ERROR_MESSAGE + target);
    }
    var args = slice.call(arguments, 1);
    var bound;
    var binder = function() {
      if (this instanceof bound) {
        var result = target.apply(
          this,
          args.concat(slice.call(arguments))
        );
        if (Object(result) === result) {
          return result;
        }
        return this;
      } else {
        return target.apply(
          that,
          args.concat(slice.call(arguments))
        );
      }
    };
    var boundLength = Math.max(0, target.length - args.length);
    var boundArgs = [];
    for (var i = 0; i < boundLength; i++) {
      boundArgs.push("$" + i);
    }
    bound = Function("binder", "return function (" + boundArgs.join(",") + "){ return binder.apply(this,arguments); }")(binder);
    if (target.prototype) {
      var Empty = function Empty2() {
      };
      Empty.prototype = target.prototype;
      bound.prototype = new Empty();
      Empty.prototype = null;
    }
    return bound;
  };
  return implementation;
}
var _functionBind_1_1_1_functionBind;
var hasRequired_functionBind_1_1_1_functionBind;
function require_functionBind_1_1_1_functionBind() {
  if (hasRequired_functionBind_1_1_1_functionBind)
    return _functionBind_1_1_1_functionBind;
  hasRequired_functionBind_1_1_1_functionBind = 1;
  var implementation2 = requireImplementation();
  _functionBind_1_1_1_functionBind = Function.prototype.bind || implementation2;
  return _functionBind_1_1_1_functionBind;
}
var src;
var hasRequiredSrc;
function requireSrc() {
  if (hasRequiredSrc)
    return src;
  hasRequiredSrc = 1;
  var bind = require_functionBind_1_1_1_functionBind();
  src = bind.call(Function.call, Object.prototype.hasOwnProperty);
  return src;
}
var _getIntrinsic_1_1_3_getIntrinsic;
var hasRequired_getIntrinsic_1_1_3_getIntrinsic;
function require_getIntrinsic_1_1_3_getIntrinsic() {
  if (hasRequired_getIntrinsic_1_1_3_getIntrinsic)
    return _getIntrinsic_1_1_3_getIntrinsic;
  hasRequired_getIntrinsic_1_1_3_getIntrinsic = 1;
  var undefined$1;
  var $SyntaxError = SyntaxError;
  var $Function = Function;
  var $TypeError = TypeError;
  var getEvalledConstructor = function(expressionSyntax) {
    try {
      return $Function('"use strict"; return (' + expressionSyntax + ").constructor;")();
    } catch (e) {
    }
  };
  var $gOPD = Object.getOwnPropertyDescriptor;
  if ($gOPD) {
    try {
      $gOPD({}, "");
    } catch (e) {
      $gOPD = null;
    }
  }
  var throwTypeError = function() {
    throw new $TypeError();
  };
  var ThrowTypeError = $gOPD ? function() {
    try {
      arguments.callee;
      return throwTypeError;
    } catch (calleeThrows) {
      try {
        return $gOPD(arguments, "callee").get;
      } catch (gOPDthrows) {
        return throwTypeError;
      }
    }
  }() : throwTypeError;
  var hasSymbols = require_hasSymbols_1_0_3_hasSymbols()();
  var getProto = Object.getPrototypeOf || function(x) {
    return x.__proto__;
  };
  var needsEval = {};
  var TypedArray = typeof Uint8Array === "undefined" ? undefined$1 : getProto(Uint8Array);
  var INTRINSICS = {
    "%AggregateError%": typeof AggregateError === "undefined" ? undefined$1 : AggregateError,
    "%Array%": Array,
    "%ArrayBuffer%": typeof ArrayBuffer === "undefined" ? undefined$1 : ArrayBuffer,
    "%ArrayIteratorPrototype%": hasSymbols ? getProto([][Symbol.iterator]()) : undefined$1,
    "%AsyncFromSyncIteratorPrototype%": undefined$1,
    "%AsyncFunction%": needsEval,
    "%AsyncGenerator%": needsEval,
    "%AsyncGeneratorFunction%": needsEval,
    "%AsyncIteratorPrototype%": needsEval,
    "%Atomics%": typeof Atomics === "undefined" ? undefined$1 : Atomics,
    "%BigInt%": typeof BigInt === "undefined" ? undefined$1 : BigInt,
    "%Boolean%": Boolean,
    "%DataView%": typeof DataView === "undefined" ? undefined$1 : DataView,
    "%Date%": Date,
    "%decodeURI%": decodeURI,
    "%decodeURIComponent%": decodeURIComponent,
    "%encodeURI%": encodeURI,
    "%encodeURIComponent%": encodeURIComponent,
    "%Error%": Error,
    "%eval%": eval,
    "%EvalError%": EvalError,
    "%Float32Array%": typeof Float32Array === "undefined" ? undefined$1 : Float32Array,
    "%Float64Array%": typeof Float64Array === "undefined" ? undefined$1 : Float64Array,
    "%FinalizationRegistry%": typeof FinalizationRegistry === "undefined" ? undefined$1 : FinalizationRegistry,
    "%Function%": $Function,
    "%GeneratorFunction%": needsEval,
    "%Int8Array%": typeof Int8Array === "undefined" ? undefined$1 : Int8Array,
    "%Int16Array%": typeof Int16Array === "undefined" ? undefined$1 : Int16Array,
    "%Int32Array%": typeof Int32Array === "undefined" ? undefined$1 : Int32Array,
    "%isFinite%": isFinite,
    "%isNaN%": isNaN,
    "%IteratorPrototype%": hasSymbols ? getProto(getProto([][Symbol.iterator]())) : undefined$1,
    "%JSON%": typeof JSON === "object" ? JSON : undefined$1,
    "%Map%": typeof Map === "undefined" ? undefined$1 : Map,
    "%MapIteratorPrototype%": typeof Map === "undefined" || !hasSymbols ? undefined$1 : getProto((/* @__PURE__ */ new Map())[Symbol.iterator]()),
    "%Math%": Math,
    "%Number%": Number,
    "%Object%": Object,
    "%parseFloat%": parseFloat,
    "%parseInt%": parseInt,
    "%Promise%": typeof Promise === "undefined" ? undefined$1 : Promise,
    "%Proxy%": typeof Proxy === "undefined" ? undefined$1 : Proxy,
    "%RangeError%": RangeError,
    "%ReferenceError%": ReferenceError,
    "%Reflect%": typeof Reflect === "undefined" ? undefined$1 : Reflect,
    "%RegExp%": RegExp,
    "%Set%": typeof Set === "undefined" ? undefined$1 : Set,
    "%SetIteratorPrototype%": typeof Set === "undefined" || !hasSymbols ? undefined$1 : getProto((/* @__PURE__ */ new Set())[Symbol.iterator]()),
    "%SharedArrayBuffer%": typeof SharedArrayBuffer === "undefined" ? undefined$1 : SharedArrayBuffer,
    "%String%": String,
    "%StringIteratorPrototype%": hasSymbols ? getProto(""[Symbol.iterator]()) : undefined$1,
    "%Symbol%": hasSymbols ? Symbol : undefined$1,
    "%SyntaxError%": $SyntaxError,
    "%ThrowTypeError%": ThrowTypeError,
    "%TypedArray%": TypedArray,
    "%TypeError%": $TypeError,
    "%Uint8Array%": typeof Uint8Array === "undefined" ? undefined$1 : Uint8Array,
    "%Uint8ClampedArray%": typeof Uint8ClampedArray === "undefined" ? undefined$1 : Uint8ClampedArray,
    "%Uint16Array%": typeof Uint16Array === "undefined" ? undefined$1 : Uint16Array,
    "%Uint32Array%": typeof Uint32Array === "undefined" ? undefined$1 : Uint32Array,
    "%URIError%": URIError,
    "%WeakMap%": typeof WeakMap === "undefined" ? undefined$1 : WeakMap,
    "%WeakRef%": typeof WeakRef === "undefined" ? undefined$1 : WeakRef,
    "%WeakSet%": typeof WeakSet === "undefined" ? undefined$1 : WeakSet
  };
  var doEval = function doEval2(name) {
    var value;
    if (name === "%AsyncFunction%") {
      value = getEvalledConstructor("async function () {}");
    } else if (name === "%GeneratorFunction%") {
      value = getEvalledConstructor("function* () {}");
    } else if (name === "%AsyncGeneratorFunction%") {
      value = getEvalledConstructor("async function* () {}");
    } else if (name === "%AsyncGenerator%") {
      var fn = doEval2("%AsyncGeneratorFunction%");
      if (fn) {
        value = fn.prototype;
      }
    } else if (name === "%AsyncIteratorPrototype%") {
      var gen = doEval2("%AsyncGenerator%");
      if (gen) {
        value = getProto(gen.prototype);
      }
    }
    INTRINSICS[name] = value;
    return value;
  };
  var LEGACY_ALIASES = {
    "%ArrayBufferPrototype%": ["ArrayBuffer", "prototype"],
    "%ArrayPrototype%": ["Array", "prototype"],
    "%ArrayProto_entries%": ["Array", "prototype", "entries"],
    "%ArrayProto_forEach%": ["Array", "prototype", "forEach"],
    "%ArrayProto_keys%": ["Array", "prototype", "keys"],
    "%ArrayProto_values%": ["Array", "prototype", "values"],
    "%AsyncFunctionPrototype%": ["AsyncFunction", "prototype"],
    "%AsyncGenerator%": ["AsyncGeneratorFunction", "prototype"],
    "%AsyncGeneratorPrototype%": ["AsyncGeneratorFunction", "prototype", "prototype"],
    "%BooleanPrototype%": ["Boolean", "prototype"],
    "%DataViewPrototype%": ["DataView", "prototype"],
    "%DatePrototype%": ["Date", "prototype"],
    "%ErrorPrototype%": ["Error", "prototype"],
    "%EvalErrorPrototype%": ["EvalError", "prototype"],
    "%Float32ArrayPrototype%": ["Float32Array", "prototype"],
    "%Float64ArrayPrototype%": ["Float64Array", "prototype"],
    "%FunctionPrototype%": ["Function", "prototype"],
    "%Generator%": ["GeneratorFunction", "prototype"],
    "%GeneratorPrototype%": ["GeneratorFunction", "prototype", "prototype"],
    "%Int8ArrayPrototype%": ["Int8Array", "prototype"],
    "%Int16ArrayPrototype%": ["Int16Array", "prototype"],
    "%Int32ArrayPrototype%": ["Int32Array", "prototype"],
    "%JSONParse%": ["JSON", "parse"],
    "%JSONStringify%": ["JSON", "stringify"],
    "%MapPrototype%": ["Map", "prototype"],
    "%NumberPrototype%": ["Number", "prototype"],
    "%ObjectPrototype%": ["Object", "prototype"],
    "%ObjProto_toString%": ["Object", "prototype", "toString"],
    "%ObjProto_valueOf%": ["Object", "prototype", "valueOf"],
    "%PromisePrototype%": ["Promise", "prototype"],
    "%PromiseProto_then%": ["Promise", "prototype", "then"],
    "%Promise_all%": ["Promise", "all"],
    "%Promise_reject%": ["Promise", "reject"],
    "%Promise_resolve%": ["Promise", "resolve"],
    "%RangeErrorPrototype%": ["RangeError", "prototype"],
    "%ReferenceErrorPrototype%": ["ReferenceError", "prototype"],
    "%RegExpPrototype%": ["RegExp", "prototype"],
    "%SetPrototype%": ["Set", "prototype"],
    "%SharedArrayBufferPrototype%": ["SharedArrayBuffer", "prototype"],
    "%StringPrototype%": ["String", "prototype"],
    "%SymbolPrototype%": ["Symbol", "prototype"],
    "%SyntaxErrorPrototype%": ["SyntaxError", "prototype"],
    "%TypedArrayPrototype%": ["TypedArray", "prototype"],
    "%TypeErrorPrototype%": ["TypeError", "prototype"],
    "%Uint8ArrayPrototype%": ["Uint8Array", "prototype"],
    "%Uint8ClampedArrayPrototype%": ["Uint8ClampedArray", "prototype"],
    "%Uint16ArrayPrototype%": ["Uint16Array", "prototype"],
    "%Uint32ArrayPrototype%": ["Uint32Array", "prototype"],
    "%URIErrorPrototype%": ["URIError", "prototype"],
    "%WeakMapPrototype%": ["WeakMap", "prototype"],
    "%WeakSetPrototype%": ["WeakSet", "prototype"]
  };
  var bind = require_functionBind_1_1_1_functionBind();
  var hasOwn = requireSrc();
  var $concat = bind.call(Function.call, Array.prototype.concat);
  var $spliceApply = bind.call(Function.apply, Array.prototype.splice);
  var $replace = bind.call(Function.call, String.prototype.replace);
  var $strSlice = bind.call(Function.call, String.prototype.slice);
  var $exec = bind.call(Function.call, RegExp.prototype.exec);
  var rePropName = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g;
  var reEscapeChar = /\\(\\)?/g;
  var stringToPath = function stringToPath2(string) {
    var first = $strSlice(string, 0, 1);
    var last = $strSlice(string, -1);
    if (first === "%" && last !== "%") {
      throw new $SyntaxError("invalid intrinsic syntax, expected closing `%`");
    } else if (last === "%" && first !== "%") {
      throw new $SyntaxError("invalid intrinsic syntax, expected opening `%`");
    }
    var result = [];
    $replace(string, rePropName, function(match2, number, quote, subString) {
      result[result.length] = quote ? $replace(subString, reEscapeChar, "$1") : number || match2;
    });
    return result;
  };
  var getBaseIntrinsic = function getBaseIntrinsic2(name, allowMissing) {
    var intrinsicName = name;
    var alias;
    if (hasOwn(LEGACY_ALIASES, intrinsicName)) {
      alias = LEGACY_ALIASES[intrinsicName];
      intrinsicName = "%" + alias[0] + "%";
    }
    if (hasOwn(INTRINSICS, intrinsicName)) {
      var value = INTRINSICS[intrinsicName];
      if (value === needsEval) {
        value = doEval(intrinsicName);
      }
      if (typeof value === "undefined" && !allowMissing) {
        throw new $TypeError("intrinsic " + name + " exists, but is not available. Please file an issue!");
      }
      return {
        alias,
        name: intrinsicName,
        value
      };
    }
    throw new $SyntaxError("intrinsic " + name + " does not exist!");
  };
  _getIntrinsic_1_1_3_getIntrinsic = function GetIntrinsic(name, allowMissing) {
    if (typeof name !== "string" || name.length === 0) {
      throw new $TypeError("intrinsic name must be a non-empty string");
    }
    if (arguments.length > 1 && typeof allowMissing !== "boolean") {
      throw new $TypeError('"allowMissing" argument must be a boolean');
    }
    if ($exec(/^%?[^%]*%?$/, name) === null) {
      throw new $SyntaxError("`%` may not be present anywhere but at the beginning and end of the intrinsic name");
    }
    var parts = stringToPath(name);
    var intrinsicBaseName = parts.length > 0 ? parts[0] : "";
    var intrinsic = getBaseIntrinsic("%" + intrinsicBaseName + "%", allowMissing);
    var intrinsicRealName = intrinsic.name;
    var value = intrinsic.value;
    var skipFurtherCaching = false;
    var alias = intrinsic.alias;
    if (alias) {
      intrinsicBaseName = alias[0];
      $spliceApply(parts, $concat([0, 1], alias));
    }
    for (var i = 1, isOwn = true; i < parts.length; i += 1) {
      var part = parts[i];
      var first = $strSlice(part, 0, 1);
      var last = $strSlice(part, -1);
      if ((first === '"' || first === "'" || first === "`" || (last === '"' || last === "'" || last === "`")) && first !== last) {
        throw new $SyntaxError("property names with quotes must have matching quotes");
      }
      if (part === "constructor" || !isOwn) {
        skipFurtherCaching = true;
      }
      intrinsicBaseName += "." + part;
      intrinsicRealName = "%" + intrinsicBaseName + "%";
      if (hasOwn(INTRINSICS, intrinsicRealName)) {
        value = INTRINSICS[intrinsicRealName];
      } else if (value != null) {
        if (!(part in value)) {
          if (!allowMissing) {
            throw new $TypeError("base intrinsic for " + name + " exists, but the property is not available.");
          }
          return void 0;
        }
        if ($gOPD && i + 1 >= parts.length) {
          var desc = $gOPD(value, part);
          isOwn = !!desc;
          if (isOwn && "get" in desc && !("originalValue" in desc.get)) {
            value = desc.get;
          } else {
            value = value[part];
          }
        } else {
          isOwn = hasOwn(value, part);
          value = value[part];
        }
        if (isOwn && !skipFurtherCaching) {
          INTRINSICS[intrinsicRealName] = value;
        }
      }
    }
    return value;
  };
  return _getIntrinsic_1_1_3_getIntrinsic;
}
var _callBind_1_0_2_callBind = { exports: {} };
var hasRequired_callBind_1_0_2_callBind;
function require_callBind_1_0_2_callBind() {
  if (hasRequired_callBind_1_0_2_callBind)
    return _callBind_1_0_2_callBind.exports;
  hasRequired_callBind_1_0_2_callBind = 1;
  (function(module) {
    var bind = require_functionBind_1_1_1_functionBind();
    var GetIntrinsic = require_getIntrinsic_1_1_3_getIntrinsic();
    var $apply = GetIntrinsic("%Function.prototype.apply%");
    var $call = GetIntrinsic("%Function.prototype.call%");
    var $reflectApply = GetIntrinsic("%Reflect.apply%", true) || bind.call($call, $apply);
    var $gOPD = GetIntrinsic("%Object.getOwnPropertyDescriptor%", true);
    var $defineProperty = GetIntrinsic("%Object.defineProperty%", true);
    var $max = GetIntrinsic("%Math.max%");
    if ($defineProperty) {
      try {
        $defineProperty({}, "a", { value: 1 });
      } catch (e) {
        $defineProperty = null;
      }
    }
    module.exports = function callBind(originalFunction) {
      var func = $reflectApply(bind, $call, arguments);
      if ($gOPD && $defineProperty) {
        var desc = $gOPD(func, "length");
        if (desc.configurable) {
          $defineProperty(
            func,
            "length",
            { value: 1 + $max(0, originalFunction.length - (arguments.length - 1)) }
          );
        }
      }
      return func;
    };
    var applyBind = function applyBind2() {
      return $reflectApply(bind, $apply, arguments);
    };
    if ($defineProperty) {
      $defineProperty(module.exports, "apply", { value: applyBind });
    } else {
      module.exports.apply = applyBind;
    }
  })(_callBind_1_0_2_callBind);
  return _callBind_1_0_2_callBind.exports;
}
var callBound;
var hasRequiredCallBound;
function requireCallBound() {
  if (hasRequiredCallBound)
    return callBound;
  hasRequiredCallBound = 1;
  var GetIntrinsic = require_getIntrinsic_1_1_3_getIntrinsic();
  var callBind = require_callBind_1_0_2_callBind();
  var $indexOf = callBind(GetIntrinsic("String.prototype.indexOf"));
  callBound = function callBoundIntrinsic(name, allowMissing) {
    var intrinsic = GetIntrinsic(name, !!allowMissing);
    if (typeof intrinsic === "function" && $indexOf(name, ".prototype.") > -1) {
      return callBind(intrinsic);
    }
    return intrinsic;
  };
  return callBound;
}
var _isArguments_1_1_1_isArguments;
var hasRequired_isArguments_1_1_1_isArguments;
function require_isArguments_1_1_1_isArguments() {
  if (hasRequired_isArguments_1_1_1_isArguments)
    return _isArguments_1_1_1_isArguments;
  hasRequired_isArguments_1_1_1_isArguments = 1;
  var hasToStringTag = requireShams()();
  var callBound2 = requireCallBound();
  var $toString = callBound2("Object.prototype.toString");
  var isStandardArguments = function isArguments(value) {
    if (hasToStringTag && value && typeof value === "object" && Symbol.toStringTag in value) {
      return false;
    }
    return $toString(value) === "[object Arguments]";
  };
  var isLegacyArguments = function isArguments(value) {
    if (isStandardArguments(value)) {
      return true;
    }
    return value !== null && typeof value === "object" && typeof value.length === "number" && value.length >= 0 && $toString(value) !== "[object Array]" && $toString(value.callee) === "[object Function]";
  };
  var supportsStandardArguments = function() {
    return isStandardArguments(arguments);
  }();
  isStandardArguments.isLegacyArguments = isLegacyArguments;
  _isArguments_1_1_1_isArguments = supportsStandardArguments ? isStandardArguments : isLegacyArguments;
  return _isArguments_1_1_1_isArguments;
}
var _isGeneratorFunction_1_0_10_isGeneratorFunction;
var hasRequired_isGeneratorFunction_1_0_10_isGeneratorFunction;
function require_isGeneratorFunction_1_0_10_isGeneratorFunction() {
  if (hasRequired_isGeneratorFunction_1_0_10_isGeneratorFunction)
    return _isGeneratorFunction_1_0_10_isGeneratorFunction;
  hasRequired_isGeneratorFunction_1_0_10_isGeneratorFunction = 1;
  var toStr = Object.prototype.toString;
  var fnToStr = Function.prototype.toString;
  var isFnRegex = /^\s*(?:function)?\*/;
  var hasToStringTag = requireShams()();
  var getProto = Object.getPrototypeOf;
  var getGeneratorFunc = function() {
    if (!hasToStringTag) {
      return false;
    }
    try {
      return Function("return function*() {}")();
    } catch (e) {
    }
  };
  var GeneratorFunction;
  _isGeneratorFunction_1_0_10_isGeneratorFunction = function isGeneratorFunction(fn) {
    if (typeof fn !== "function") {
      return false;
    }
    if (isFnRegex.test(fnToStr.call(fn))) {
      return true;
    }
    if (!hasToStringTag) {
      var str = toStr.call(fn);
      return str === "[object GeneratorFunction]";
    }
    if (!getProto) {
      return false;
    }
    if (typeof GeneratorFunction === "undefined") {
      var generatorFunc = getGeneratorFunc();
      GeneratorFunction = generatorFunc ? getProto(generatorFunc) : false;
    }
    return getProto(fn) === GeneratorFunction;
  };
  return _isGeneratorFunction_1_0_10_isGeneratorFunction;
}
var _isCallable_1_2_5_isCallable;
var hasRequired_isCallable_1_2_5_isCallable;
function require_isCallable_1_2_5_isCallable() {
  if (hasRequired_isCallable_1_2_5_isCallable)
    return _isCallable_1_2_5_isCallable;
  hasRequired_isCallable_1_2_5_isCallable = 1;
  var fnToStr = Function.prototype.toString;
  var reflectApply = typeof Reflect === "object" && Reflect !== null && Reflect.apply;
  var badArrayLike;
  var isCallableMarker;
  if (typeof reflectApply === "function" && typeof Object.defineProperty === "function") {
    try {
      badArrayLike = Object.defineProperty({}, "length", {
        get: function() {
          throw isCallableMarker;
        }
      });
      isCallableMarker = {};
      reflectApply(function() {
        throw 42;
      }, null, badArrayLike);
    } catch (_) {
      if (_ !== isCallableMarker) {
        reflectApply = null;
      }
    }
  } else {
    reflectApply = null;
  }
  var constructorRegex = /^\s*class\b/;
  var isES6ClassFn = function isES6ClassFunction(value) {
    try {
      var fnStr = fnToStr.call(value);
      return constructorRegex.test(fnStr);
    } catch (e) {
      return false;
    }
  };
  var tryFunctionObject = function tryFunctionToStr(value) {
    try {
      if (isES6ClassFn(value)) {
        return false;
      }
      fnToStr.call(value);
      return true;
    } catch (e) {
      return false;
    }
  };
  var toStr = Object.prototype.toString;
  var fnClass = "[object Function]";
  var genClass = "[object GeneratorFunction]";
  var hasToStringTag = typeof Symbol === "function" && !!Symbol.toStringTag;
  var isDDA = typeof document === "object" ? function isDocumentDotAll(value) {
    if (typeof value === "undefined" || typeof value === "object") {
      try {
        return value("") === null;
      } catch (e) {
      }
    }
    return false;
  } : function() {
    return false;
  };
  _isCallable_1_2_5_isCallable = reflectApply ? function isCallable(value) {
    if (isDDA(value)) {
      return true;
    }
    if (!value) {
      return false;
    }
    if (typeof value !== "function" && typeof value !== "object") {
      return false;
    }
    if (typeof value === "function" && !value.prototype) {
      return true;
    }
    try {
      reflectApply(value, null, badArrayLike);
    } catch (e) {
      if (e !== isCallableMarker) {
        return false;
      }
    }
    return !isES6ClassFn(value);
  } : function isCallable(value) {
    if (isDDA(value)) {
      return true;
    }
    if (!value) {
      return false;
    }
    if (typeof value !== "function" && typeof value !== "object") {
      return false;
    }
    if (typeof value === "function" && !value.prototype) {
      return true;
    }
    if (hasToStringTag) {
      return tryFunctionObject(value);
    }
    if (isES6ClassFn(value)) {
      return false;
    }
    var strClass = toStr.call(value);
    return strClass === fnClass || strClass === genClass || tryFunctionObject(value);
  };
  return _isCallable_1_2_5_isCallable;
}
var _forEach_0_3_3_forEach;
var hasRequired_forEach_0_3_3_forEach;
function require_forEach_0_3_3_forEach() {
  if (hasRequired_forEach_0_3_3_forEach)
    return _forEach_0_3_3_forEach;
  hasRequired_forEach_0_3_3_forEach = 1;
  var isCallable = require_isCallable_1_2_5_isCallable();
  var toStr = Object.prototype.toString;
  var hasOwnProperty2 = Object.prototype.hasOwnProperty;
  var forEachArray = function forEachArray2(array, iterator, receiver) {
    for (var i = 0, len = array.length; i < len; i++) {
      if (hasOwnProperty2.call(array, i)) {
        if (receiver == null) {
          iterator(array[i], i, array);
        } else {
          iterator.call(receiver, array[i], i, array);
        }
      }
    }
  };
  var forEachString = function forEachString2(string, iterator, receiver) {
    for (var i = 0, len = string.length; i < len; i++) {
      if (receiver == null) {
        iterator(string.charAt(i), i, string);
      } else {
        iterator.call(receiver, string.charAt(i), i, string);
      }
    }
  };
  var forEachObject = function forEachObject2(object, iterator, receiver) {
    for (var k in object) {
      if (hasOwnProperty2.call(object, k)) {
        if (receiver == null) {
          iterator(object[k], k, object);
        } else {
          iterator.call(receiver, object[k], k, object);
        }
      }
    }
  };
  var forEach = function forEach2(list, iterator, thisArg) {
    if (!isCallable(iterator)) {
      throw new TypeError("iterator must be a function");
    }
    var receiver;
    if (arguments.length >= 3) {
      receiver = thisArg;
    }
    if (toStr.call(list) === "[object Array]") {
      forEachArray(list, iterator, receiver);
    } else if (typeof list === "string") {
      forEachString(list, iterator, receiver);
    } else {
      forEachObject(list, iterator, receiver);
    }
  };
  _forEach_0_3_3_forEach = forEach;
  return _forEach_0_3_3_forEach;
}
var _availableTypedArrays_1_0_5_availableTypedArrays;
var hasRequired_availableTypedArrays_1_0_5_availableTypedArrays;
function require_availableTypedArrays_1_0_5_availableTypedArrays() {
  if (hasRequired_availableTypedArrays_1_0_5_availableTypedArrays)
    return _availableTypedArrays_1_0_5_availableTypedArrays;
  hasRequired_availableTypedArrays_1_0_5_availableTypedArrays = 1;
  var possibleNames = [
    "BigInt64Array",
    "BigUint64Array",
    "Float32Array",
    "Float64Array",
    "Int16Array",
    "Int32Array",
    "Int8Array",
    "Uint16Array",
    "Uint32Array",
    "Uint8Array",
    "Uint8ClampedArray"
  ];
  var g = typeof globalThis === "undefined" ? commonjsGlobal : globalThis;
  _availableTypedArrays_1_0_5_availableTypedArrays = function availableTypedArrays() {
    var out = [];
    for (var i = 0; i < possibleNames.length; i++) {
      if (typeof g[possibleNames[i]] === "function") {
        out[out.length] = possibleNames[i];
      }
    }
    return out;
  };
  return _availableTypedArrays_1_0_5_availableTypedArrays;
}
var getOwnPropertyDescriptor;
var hasRequiredGetOwnPropertyDescriptor;
function requireGetOwnPropertyDescriptor() {
  if (hasRequiredGetOwnPropertyDescriptor)
    return getOwnPropertyDescriptor;
  hasRequiredGetOwnPropertyDescriptor = 1;
  var GetIntrinsic = require_getIntrinsic_1_1_3_getIntrinsic();
  var $gOPD = GetIntrinsic("%Object.getOwnPropertyDescriptor%", true);
  if ($gOPD) {
    try {
      $gOPD([], "length");
    } catch (e) {
      $gOPD = null;
    }
  }
  getOwnPropertyDescriptor = $gOPD;
  return getOwnPropertyDescriptor;
}
var _isTypedArray_1_1_9_isTypedArray;
var hasRequired_isTypedArray_1_1_9_isTypedArray;
function require_isTypedArray_1_1_9_isTypedArray() {
  if (hasRequired_isTypedArray_1_1_9_isTypedArray)
    return _isTypedArray_1_1_9_isTypedArray;
  hasRequired_isTypedArray_1_1_9_isTypedArray = 1;
  var forEach = require_forEach_0_3_3_forEach();
  var availableTypedArrays = require_availableTypedArrays_1_0_5_availableTypedArrays();
  var callBound2 = requireCallBound();
  var $toString = callBound2("Object.prototype.toString");
  var hasToStringTag = requireShams()();
  var g = typeof globalThis === "undefined" ? commonjsGlobal : globalThis;
  var typedArrays = availableTypedArrays();
  var $indexOf = callBound2("Array.prototype.indexOf", true) || function indexOf(array, value) {
    for (var i = 0; i < array.length; i += 1) {
      if (array[i] === value) {
        return i;
      }
    }
    return -1;
  };
  var $slice = callBound2("String.prototype.slice");
  var toStrTags = {};
  var gOPD = requireGetOwnPropertyDescriptor();
  var getPrototypeOf = Object.getPrototypeOf;
  if (hasToStringTag && gOPD && getPrototypeOf) {
    forEach(typedArrays, function(typedArray) {
      var arr = new g[typedArray]();
      if (Symbol.toStringTag in arr) {
        var proto = getPrototypeOf(arr);
        var descriptor = gOPD(proto, Symbol.toStringTag);
        if (!descriptor) {
          var superProto = getPrototypeOf(proto);
          descriptor = gOPD(superProto, Symbol.toStringTag);
        }
        toStrTags[typedArray] = descriptor.get;
      }
    });
  }
  var tryTypedArrays = function tryAllTypedArrays(value) {
    var anyTrue = false;
    forEach(toStrTags, function(getter, typedArray) {
      if (!anyTrue) {
        try {
          anyTrue = getter.call(value) === typedArray;
        } catch (e) {
        }
      }
    });
    return anyTrue;
  };
  _isTypedArray_1_1_9_isTypedArray = function isTypedArray(value) {
    if (!value || typeof value !== "object") {
      return false;
    }
    if (!hasToStringTag || !(Symbol.toStringTag in value)) {
      var tag = $slice($toString(value), 8, -1);
      return $indexOf(typedArrays, tag) > -1;
    }
    if (!gOPD) {
      return false;
    }
    return tryTypedArrays(value);
  };
  return _isTypedArray_1_1_9_isTypedArray;
}
var _whichTypedArray_1_1_8_whichTypedArray;
var hasRequired_whichTypedArray_1_1_8_whichTypedArray;
function require_whichTypedArray_1_1_8_whichTypedArray() {
  if (hasRequired_whichTypedArray_1_1_8_whichTypedArray)
    return _whichTypedArray_1_1_8_whichTypedArray;
  hasRequired_whichTypedArray_1_1_8_whichTypedArray = 1;
  var forEach = require_forEach_0_3_3_forEach();
  var availableTypedArrays = require_availableTypedArrays_1_0_5_availableTypedArrays();
  var callBound2 = requireCallBound();
  var $toString = callBound2("Object.prototype.toString");
  var hasToStringTag = requireShams()();
  var g = typeof globalThis === "undefined" ? commonjsGlobal : globalThis;
  var typedArrays = availableTypedArrays();
  var $slice = callBound2("String.prototype.slice");
  var toStrTags = {};
  var gOPD = requireGetOwnPropertyDescriptor();
  var getPrototypeOf = Object.getPrototypeOf;
  if (hasToStringTag && gOPD && getPrototypeOf) {
    forEach(typedArrays, function(typedArray) {
      if (typeof g[typedArray] === "function") {
        var arr = new g[typedArray]();
        if (Symbol.toStringTag in arr) {
          var proto = getPrototypeOf(arr);
          var descriptor = gOPD(proto, Symbol.toStringTag);
          if (!descriptor) {
            var superProto = getPrototypeOf(proto);
            descriptor = gOPD(superProto, Symbol.toStringTag);
          }
          toStrTags[typedArray] = descriptor.get;
        }
      }
    });
  }
  var tryTypedArrays = function tryAllTypedArrays(value) {
    var foundName = false;
    forEach(toStrTags, function(getter, typedArray) {
      if (!foundName) {
        try {
          var name = getter.call(value);
          if (name === typedArray) {
            foundName = name;
          }
        } catch (e) {
        }
      }
    });
    return foundName;
  };
  var isTypedArray = require_isTypedArray_1_1_9_isTypedArray();
  _whichTypedArray_1_1_8_whichTypedArray = function whichTypedArray(value) {
    if (!isTypedArray(value)) {
      return false;
    }
    if (!hasToStringTag || !(Symbol.toStringTag in value)) {
      return $slice($toString(value), 8, -1);
    }
    return tryTypedArrays(value);
  };
  return _whichTypedArray_1_1_8_whichTypedArray;
}
var hasRequiredTypes;
function requireTypes() {
  if (hasRequiredTypes)
    return types;
  hasRequiredTypes = 1;
  (function(exports) {
    var isArgumentsObject = require_isArguments_1_1_1_isArguments();
    var isGeneratorFunction = require_isGeneratorFunction_1_0_10_isGeneratorFunction();
    var whichTypedArray = require_whichTypedArray_1_1_8_whichTypedArray();
    var isTypedArray = require_isTypedArray_1_1_9_isTypedArray();
    function uncurryThis(f) {
      return f.call.bind(f);
    }
    var BigIntSupported = typeof BigInt !== "undefined";
    var SymbolSupported = typeof Symbol !== "undefined";
    var ObjectToString = uncurryThis(Object.prototype.toString);
    var numberValue = uncurryThis(Number.prototype.valueOf);
    var stringValue = uncurryThis(String.prototype.valueOf);
    var booleanValue = uncurryThis(Boolean.prototype.valueOf);
    if (BigIntSupported) {
      var bigIntValue = uncurryThis(BigInt.prototype.valueOf);
    }
    if (SymbolSupported) {
      var symbolValue = uncurryThis(Symbol.prototype.valueOf);
    }
    function checkBoxedPrimitive(value, prototypeValueOf) {
      if (typeof value !== "object") {
        return false;
      }
      try {
        prototypeValueOf(value);
        return true;
      } catch (e) {
        return false;
      }
    }
    exports.isArgumentsObject = isArgumentsObject;
    exports.isGeneratorFunction = isGeneratorFunction;
    exports.isTypedArray = isTypedArray;
    function isPromise2(input) {
      return typeof Promise !== "undefined" && input instanceof Promise || input !== null && typeof input === "object" && typeof input.then === "function" && typeof input.catch === "function";
    }
    exports.isPromise = isPromise2;
    function isArrayBufferView(value) {
      if (typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView) {
        return ArrayBuffer.isView(value);
      }
      return isTypedArray(value) || isDataView(value);
    }
    exports.isArrayBufferView = isArrayBufferView;
    function isUint8Array(value) {
      return whichTypedArray(value) === "Uint8Array";
    }
    exports.isUint8Array = isUint8Array;
    function isUint8ClampedArray(value) {
      return whichTypedArray(value) === "Uint8ClampedArray";
    }
    exports.isUint8ClampedArray = isUint8ClampedArray;
    function isUint16Array(value) {
      return whichTypedArray(value) === "Uint16Array";
    }
    exports.isUint16Array = isUint16Array;
    function isUint32Array(value) {
      return whichTypedArray(value) === "Uint32Array";
    }
    exports.isUint32Array = isUint32Array;
    function isInt8Array(value) {
      return whichTypedArray(value) === "Int8Array";
    }
    exports.isInt8Array = isInt8Array;
    function isInt16Array(value) {
      return whichTypedArray(value) === "Int16Array";
    }
    exports.isInt16Array = isInt16Array;
    function isInt32Array(value) {
      return whichTypedArray(value) === "Int32Array";
    }
    exports.isInt32Array = isInt32Array;
    function isFloat32Array(value) {
      return whichTypedArray(value) === "Float32Array";
    }
    exports.isFloat32Array = isFloat32Array;
    function isFloat64Array(value) {
      return whichTypedArray(value) === "Float64Array";
    }
    exports.isFloat64Array = isFloat64Array;
    function isBigInt64Array(value) {
      return whichTypedArray(value) === "BigInt64Array";
    }
    exports.isBigInt64Array = isBigInt64Array;
    function isBigUint64Array(value) {
      return whichTypedArray(value) === "BigUint64Array";
    }
    exports.isBigUint64Array = isBigUint64Array;
    function isMapToString(value) {
      return ObjectToString(value) === "[object Map]";
    }
    isMapToString.working = typeof Map !== "undefined" && isMapToString(/* @__PURE__ */ new Map());
    function isMap(value) {
      if (typeof Map === "undefined") {
        return false;
      }
      return isMapToString.working ? isMapToString(value) : value instanceof Map;
    }
    exports.isMap = isMap;
    function isSetToString(value) {
      return ObjectToString(value) === "[object Set]";
    }
    isSetToString.working = typeof Set !== "undefined" && isSetToString(/* @__PURE__ */ new Set());
    function isSet(value) {
      if (typeof Set === "undefined") {
        return false;
      }
      return isSetToString.working ? isSetToString(value) : value instanceof Set;
    }
    exports.isSet = isSet;
    function isWeakMapToString(value) {
      return ObjectToString(value) === "[object WeakMap]";
    }
    isWeakMapToString.working = typeof WeakMap !== "undefined" && isWeakMapToString(/* @__PURE__ */ new WeakMap());
    function isWeakMap(value) {
      if (typeof WeakMap === "undefined") {
        return false;
      }
      return isWeakMapToString.working ? isWeakMapToString(value) : value instanceof WeakMap;
    }
    exports.isWeakMap = isWeakMap;
    function isWeakSetToString(value) {
      return ObjectToString(value) === "[object WeakSet]";
    }
    isWeakSetToString.working = typeof WeakSet !== "undefined" && isWeakSetToString(/* @__PURE__ */ new WeakSet());
    function isWeakSet(value) {
      return isWeakSetToString(value);
    }
    exports.isWeakSet = isWeakSet;
    function isArrayBufferToString(value) {
      return ObjectToString(value) === "[object ArrayBuffer]";
    }
    isArrayBufferToString.working = typeof ArrayBuffer !== "undefined" && isArrayBufferToString(new ArrayBuffer());
    function isArrayBuffer(value) {
      if (typeof ArrayBuffer === "undefined") {
        return false;
      }
      return isArrayBufferToString.working ? isArrayBufferToString(value) : value instanceof ArrayBuffer;
    }
    exports.isArrayBuffer = isArrayBuffer;
    function isDataViewToString(value) {
      return ObjectToString(value) === "[object DataView]";
    }
    isDataViewToString.working = typeof ArrayBuffer !== "undefined" && typeof DataView !== "undefined" && isDataViewToString(new DataView(new ArrayBuffer(1), 0, 1));
    function isDataView(value) {
      if (typeof DataView === "undefined") {
        return false;
      }
      return isDataViewToString.working ? isDataViewToString(value) : value instanceof DataView;
    }
    exports.isDataView = isDataView;
    var SharedArrayBufferCopy = typeof SharedArrayBuffer !== "undefined" ? SharedArrayBuffer : void 0;
    function isSharedArrayBufferToString(value) {
      return ObjectToString(value) === "[object SharedArrayBuffer]";
    }
    function isSharedArrayBuffer(value) {
      if (typeof SharedArrayBufferCopy === "undefined") {
        return false;
      }
      if (typeof isSharedArrayBufferToString.working === "undefined") {
        isSharedArrayBufferToString.working = isSharedArrayBufferToString(new SharedArrayBufferCopy());
      }
      return isSharedArrayBufferToString.working ? isSharedArrayBufferToString(value) : value instanceof SharedArrayBufferCopy;
    }
    exports.isSharedArrayBuffer = isSharedArrayBuffer;
    function isAsyncFunction(value) {
      return ObjectToString(value) === "[object AsyncFunction]";
    }
    exports.isAsyncFunction = isAsyncFunction;
    function isMapIterator(value) {
      return ObjectToString(value) === "[object Map Iterator]";
    }
    exports.isMapIterator = isMapIterator;
    function isSetIterator(value) {
      return ObjectToString(value) === "[object Set Iterator]";
    }
    exports.isSetIterator = isSetIterator;
    function isGeneratorObject(value) {
      return ObjectToString(value) === "[object Generator]";
    }
    exports.isGeneratorObject = isGeneratorObject;
    function isWebAssemblyCompiledModule(value) {
      return ObjectToString(value) === "[object WebAssembly.Module]";
    }
    exports.isWebAssemblyCompiledModule = isWebAssemblyCompiledModule;
    function isNumberObject(value) {
      return checkBoxedPrimitive(value, numberValue);
    }
    exports.isNumberObject = isNumberObject;
    function isStringObject(value) {
      return checkBoxedPrimitive(value, stringValue);
    }
    exports.isStringObject = isStringObject;
    function isBooleanObject(value) {
      return checkBoxedPrimitive(value, booleanValue);
    }
    exports.isBooleanObject = isBooleanObject;
    function isBigIntObject(value) {
      return BigIntSupported && checkBoxedPrimitive(value, bigIntValue);
    }
    exports.isBigIntObject = isBigIntObject;
    function isSymbolObject(value) {
      return SymbolSupported && checkBoxedPrimitive(value, symbolValue);
    }
    exports.isSymbolObject = isSymbolObject;
    function isBoxedPrimitive(value) {
      return isNumberObject(value) || isStringObject(value) || isBooleanObject(value) || isBigIntObject(value) || isSymbolObject(value);
    }
    exports.isBoxedPrimitive = isBoxedPrimitive;
    function isAnyArrayBuffer(value) {
      return typeof Uint8Array !== "undefined" && (isArrayBuffer(value) || isSharedArrayBuffer(value));
    }
    exports.isAnyArrayBuffer = isAnyArrayBuffer;
    ["isProxy", "isExternal", "isModuleNamespaceObject"].forEach(function(method) {
      Object.defineProperty(exports, method, {
        enumerable: false,
        value: function() {
          throw new Error(method + " is not supported in userland");
        }
      });
    });
  })(types);
  return types;
}
var isBufferBrowser;
var hasRequiredIsBufferBrowser;
function requireIsBufferBrowser() {
  if (hasRequiredIsBufferBrowser)
    return isBufferBrowser;
  hasRequiredIsBufferBrowser = 1;
  isBufferBrowser = function isBuffer(arg) {
    return arg && typeof arg === "object" && typeof arg.copy === "function" && typeof arg.fill === "function" && typeof arg.readUInt8 === "function";
  };
  return isBufferBrowser;
}
var inherits_browser = { exports: {} };
var hasRequiredInherits_browser;
function requireInherits_browser() {
  if (hasRequiredInherits_browser)
    return inherits_browser.exports;
  hasRequiredInherits_browser = 1;
  if (typeof Object.create === "function") {
    inherits_browser.exports = function inherits(ctor, superCtor) {
      if (superCtor) {
        ctor.super_ = superCtor;
        ctor.prototype = Object.create(superCtor.prototype, {
          constructor: {
            value: ctor,
            enumerable: false,
            writable: true,
            configurable: true
          }
        });
      }
    };
  } else {
    inherits_browser.exports = function inherits(ctor, superCtor) {
      if (superCtor) {
        ctor.super_ = superCtor;
        var TempCtor = function() {
        };
        TempCtor.prototype = superCtor.prototype;
        ctor.prototype = new TempCtor();
        ctor.prototype.constructor = ctor;
      }
    };
  }
  return inherits_browser.exports;
}
var hasRequiredUtil;
function requireUtil() {
  if (hasRequiredUtil)
    return util;
  hasRequiredUtil = 1;
  (function(exports) {
    var getOwnPropertyDescriptors = Object.getOwnPropertyDescriptors || function getOwnPropertyDescriptors2(obj) {
      var keys = Object.keys(obj);
      var descriptors = {};
      for (var i = 0; i < keys.length; i++) {
        descriptors[keys[i]] = Object.getOwnPropertyDescriptor(obj, keys[i]);
      }
      return descriptors;
    };
    var formatRegExp = /%[sdj%]/g;
    exports.format = function(f) {
      if (!isString(f)) {
        var objects = [];
        for (var i = 0; i < arguments.length; i++) {
          objects.push(inspect2(arguments[i]));
        }
        return objects.join(" ");
      }
      var i = 1;
      var args = arguments;
      var len = args.length;
      var str = String(f).replace(formatRegExp, function(x2) {
        if (x2 === "%%")
          return "%";
        if (i >= len)
          return x2;
        switch (x2) {
          case "%s":
            return String(args[i++]);
          case "%d":
            return Number(args[i++]);
          case "%j":
            try {
              return JSON.stringify(args[i++]);
            } catch (_) {
              return "[Circular]";
            }
          default:
            return x2;
        }
      });
      for (var x = args[i]; i < len; x = args[++i]) {
        if (isNull(x) || !isObject2(x)) {
          str += " " + x;
        } else {
          str += " " + inspect2(x);
        }
      }
      return str;
    };
    exports.deprecate = function(fn, msg) {
      if (typeof process !== "undefined" && process.noDeprecation === true) {
        return fn;
      }
      if (typeof process === "undefined") {
        return function() {
          return exports.deprecate(fn, msg).apply(this, arguments);
        };
      }
      var warned = false;
      function deprecated() {
        if (!warned) {
          if (process.throwDeprecation) {
            throw new Error(msg);
          } else if (process.traceDeprecation) {
            console.trace(msg);
          } else {
            console.error(msg);
          }
          warned = true;
        }
        return fn.apply(this, arguments);
      }
      return deprecated;
    };
    var debugs = {};
    var debugEnvRegex = /^$/;
    if ({}.NODE_DEBUG) {
      var debugEnv = {}.NODE_DEBUG;
      debugEnv = debugEnv.replace(/[|\\{}()[\]^$+?.]/g, "\\$&").replace(/\*/g, ".*").replace(/,/g, "$|^").toUpperCase();
      debugEnvRegex = new RegExp("^" + debugEnv + "$", "i");
    }
    exports.debuglog = function(set2) {
      set2 = set2.toUpperCase();
      if (!debugs[set2]) {
        if (debugEnvRegex.test(set2)) {
          var pid = process.pid;
          debugs[set2] = function() {
            var msg = exports.format.apply(exports, arguments);
            console.error("%s %d: %s", set2, pid, msg);
          };
        } else {
          debugs[set2] = function() {
          };
        }
      }
      return debugs[set2];
    };
    function inspect2(obj, opts) {
      var ctx = {
        seen: [],
        stylize: stylizeNoColor
      };
      if (arguments.length >= 3)
        ctx.depth = arguments[2];
      if (arguments.length >= 4)
        ctx.colors = arguments[3];
      if (isBoolean(opts)) {
        ctx.showHidden = opts;
      } else if (opts) {
        exports._extend(ctx, opts);
      }
      if (isUndefined(ctx.showHidden))
        ctx.showHidden = false;
      if (isUndefined(ctx.depth))
        ctx.depth = 2;
      if (isUndefined(ctx.colors))
        ctx.colors = false;
      if (isUndefined(ctx.customInspect))
        ctx.customInspect = true;
      if (ctx.colors)
        ctx.stylize = stylizeWithColor;
      return formatValue2(ctx, obj, ctx.depth);
    }
    exports.inspect = inspect2;
    inspect2.colors = {
      "bold": [1, 22],
      "italic": [3, 23],
      "underline": [4, 24],
      "inverse": [7, 27],
      "white": [37, 39],
      "grey": [90, 39],
      "black": [30, 39],
      "blue": [34, 39],
      "cyan": [36, 39],
      "green": [32, 39],
      "magenta": [35, 39],
      "red": [31, 39],
      "yellow": [33, 39]
    };
    inspect2.styles = {
      "special": "cyan",
      "number": "yellow",
      "boolean": "yellow",
      "undefined": "grey",
      "null": "bold",
      "string": "green",
      "date": "magenta",
      "regexp": "red"
    };
    function stylizeWithColor(str, styleType) {
      var style = inspect2.styles[styleType];
      if (style) {
        return "\x1B[" + inspect2.colors[style][0] + "m" + str + "\x1B[" + inspect2.colors[style][1] + "m";
      } else {
        return str;
      }
    }
    function stylizeNoColor(str, styleType) {
      return str;
    }
    function arrayToHash(array) {
      var hash2 = {};
      array.forEach(function(val, idx) {
        hash2[val] = true;
      });
      return hash2;
    }
    function formatValue2(ctx, value, recurseTimes) {
      if (ctx.customInspect && value && isFunction(value.inspect) && value.inspect !== exports.inspect && !(value.constructor && value.constructor.prototype === value)) {
        var ret = value.inspect(recurseTimes, ctx);
        if (!isString(ret)) {
          ret = formatValue2(ctx, ret, recurseTimes);
        }
        return ret;
      }
      var primitive = formatPrimitive(ctx, value);
      if (primitive) {
        return primitive;
      }
      var keys = Object.keys(value);
      var visibleKeys = arrayToHash(keys);
      if (ctx.showHidden) {
        keys = Object.getOwnPropertyNames(value);
      }
      if (isError(value) && (keys.indexOf("message") >= 0 || keys.indexOf("description") >= 0)) {
        return formatError2(value);
      }
      if (keys.length === 0) {
        if (isFunction(value)) {
          var name = value.name ? ": " + value.name : "";
          return ctx.stylize("[Function" + name + "]", "special");
        }
        if (isRegExp(value)) {
          return ctx.stylize(RegExp.prototype.toString.call(value), "regexp");
        }
        if (isDate(value)) {
          return ctx.stylize(Date.prototype.toString.call(value), "date");
        }
        if (isError(value)) {
          return formatError2(value);
        }
      }
      var base = "", array = false, braces = ["{", "}"];
      if (isArray(value)) {
        array = true;
        braces = ["[", "]"];
      }
      if (isFunction(value)) {
        var n = value.name ? ": " + value.name : "";
        base = " [Function" + n + "]";
      }
      if (isRegExp(value)) {
        base = " " + RegExp.prototype.toString.call(value);
      }
      if (isDate(value)) {
        base = " " + Date.prototype.toUTCString.call(value);
      }
      if (isError(value)) {
        base = " " + formatError2(value);
      }
      if (keys.length === 0 && (!array || value.length == 0)) {
        return braces[0] + base + braces[1];
      }
      if (recurseTimes < 0) {
        if (isRegExp(value)) {
          return ctx.stylize(RegExp.prototype.toString.call(value), "regexp");
        } else {
          return ctx.stylize("[Object]", "special");
        }
      }
      ctx.seen.push(value);
      var output;
      if (array) {
        output = formatArray2(ctx, value, recurseTimes, visibleKeys, keys);
      } else {
        output = keys.map(function(key) {
          return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
        });
      }
      ctx.seen.pop();
      return reduceToSingleString(output, base, braces);
    }
    function formatPrimitive(ctx, value) {
      if (isUndefined(value))
        return ctx.stylize("undefined", "undefined");
      if (isString(value)) {
        var simple = "'" + JSON.stringify(value).replace(/^"|"$/g, "").replace(/'/g, "\\'").replace(/\\"/g, '"') + "'";
        return ctx.stylize(simple, "string");
      }
      if (isNumber(value))
        return ctx.stylize("" + value, "number");
      if (isBoolean(value))
        return ctx.stylize("" + value, "boolean");
      if (isNull(value))
        return ctx.stylize("null", "null");
    }
    function formatError2(value) {
      return "[" + Error.prototype.toString.call(value) + "]";
    }
    function formatArray2(ctx, value, recurseTimes, visibleKeys, keys) {
      var output = [];
      for (var i = 0, l = value.length; i < l; ++i) {
        if (hasOwnProperty2(value, String(i))) {
          output.push(formatProperty(
            ctx,
            value,
            recurseTimes,
            visibleKeys,
            String(i),
            true
          ));
        } else {
          output.push("");
        }
      }
      keys.forEach(function(key) {
        if (!key.match(/^\d+$/)) {
          output.push(formatProperty(
            ctx,
            value,
            recurseTimes,
            visibleKeys,
            key,
            true
          ));
        }
      });
      return output;
    }
    function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
      var name, str, desc;
      desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
      if (desc.get) {
        if (desc.set) {
          str = ctx.stylize("[Getter/Setter]", "special");
        } else {
          str = ctx.stylize("[Getter]", "special");
        }
      } else {
        if (desc.set) {
          str = ctx.stylize("[Setter]", "special");
        }
      }
      if (!hasOwnProperty2(visibleKeys, key)) {
        name = "[" + key + "]";
      }
      if (!str) {
        if (ctx.seen.indexOf(desc.value) < 0) {
          if (isNull(recurseTimes)) {
            str = formatValue2(ctx, desc.value, null);
          } else {
            str = formatValue2(ctx, desc.value, recurseTimes - 1);
          }
          if (str.indexOf("\n") > -1) {
            if (array) {
              str = str.split("\n").map(function(line) {
                return "  " + line;
              }).join("\n").substr(2);
            } else {
              str = "\n" + str.split("\n").map(function(line) {
                return "   " + line;
              }).join("\n");
            }
          }
        } else {
          str = ctx.stylize("[Circular]", "special");
        }
      }
      if (isUndefined(name)) {
        if (array && key.match(/^\d+$/)) {
          return str;
        }
        name = JSON.stringify("" + key);
        if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
          name = name.substr(1, name.length - 2);
          name = ctx.stylize(name, "name");
        } else {
          name = name.replace(/'/g, "\\'").replace(/\\"/g, '"').replace(/(^"|"$)/g, "'");
          name = ctx.stylize(name, "string");
        }
      }
      return name + ": " + str;
    }
    function reduceToSingleString(output, base, braces) {
      var length = output.reduce(function(prev, cur) {
        if (cur.indexOf("\n") >= 0)
          ;
        return prev + cur.replace(/\u001b\[\d\d?m/g, "").length + 1;
      }, 0);
      if (length > 60) {
        return braces[0] + (base === "" ? "" : base + "\n ") + " " + output.join(",\n  ") + " " + braces[1];
      }
      return braces[0] + base + " " + output.join(", ") + " " + braces[1];
    }
    exports.types = requireTypes();
    function isArray(ar) {
      return Array.isArray(ar);
    }
    exports.isArray = isArray;
    function isBoolean(arg) {
      return typeof arg === "boolean";
    }
    exports.isBoolean = isBoolean;
    function isNull(arg) {
      return arg === null;
    }
    exports.isNull = isNull;
    function isNullOrUndefined(arg) {
      return arg == null;
    }
    exports.isNullOrUndefined = isNullOrUndefined;
    function isNumber(arg) {
      return typeof arg === "number";
    }
    exports.isNumber = isNumber;
    function isString(arg) {
      return typeof arg === "string";
    }
    exports.isString = isString;
    function isSymbol(arg) {
      return typeof arg === "symbol";
    }
    exports.isSymbol = isSymbol;
    function isUndefined(arg) {
      return arg === void 0;
    }
    exports.isUndefined = isUndefined;
    function isRegExp(re) {
      return isObject2(re) && objectToString(re) === "[object RegExp]";
    }
    exports.isRegExp = isRegExp;
    exports.types.isRegExp = isRegExp;
    function isObject2(arg) {
      return typeof arg === "object" && arg !== null;
    }
    exports.isObject = isObject2;
    function isDate(d) {
      return isObject2(d) && objectToString(d) === "[object Date]";
    }
    exports.isDate = isDate;
    exports.types.isDate = isDate;
    function isError(e) {
      return isObject2(e) && (objectToString(e) === "[object Error]" || e instanceof Error);
    }
    exports.isError = isError;
    exports.types.isNativeError = isError;
    function isFunction(arg) {
      return typeof arg === "function";
    }
    exports.isFunction = isFunction;
    function isPrimitive(arg) {
      return arg === null || typeof arg === "boolean" || typeof arg === "number" || typeof arg === "string" || typeof arg === "symbol" || typeof arg === "undefined";
    }
    exports.isPrimitive = isPrimitive;
    exports.isBuffer = requireIsBufferBrowser();
    function objectToString(o) {
      return Object.prototype.toString.call(o);
    }
    function pad(n) {
      return n < 10 ? "0" + n.toString(10) : n.toString(10);
    }
    var months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec"
    ];
    function timestamp() {
      var d = new Date();
      var time = [
        pad(d.getHours()),
        pad(d.getMinutes()),
        pad(d.getSeconds())
      ].join(":");
      return [d.getDate(), months[d.getMonth()], time].join(" ");
    }
    exports.log = function() {
      console.log("%s - %s", timestamp(), exports.format.apply(exports, arguments));
    };
    exports.inherits = requireInherits_browser();
    exports._extend = function(origin, add) {
      if (!add || !isObject2(add))
        return origin;
      var keys = Object.keys(add);
      var i = keys.length;
      while (i--) {
        origin[keys[i]] = add[keys[i]];
      }
      return origin;
    };
    function hasOwnProperty2(obj, prop) {
      return Object.prototype.hasOwnProperty.call(obj, prop);
    }
    var kCustomPromisifiedSymbol = typeof Symbol !== "undefined" ? Symbol("util.promisify.custom") : void 0;
    exports.promisify = function promisify(original) {
      if (typeof original !== "function")
        throw new TypeError('The "original" argument must be of type Function');
      if (kCustomPromisifiedSymbol && original[kCustomPromisifiedSymbol]) {
        var fn = original[kCustomPromisifiedSymbol];
        if (typeof fn !== "function") {
          throw new TypeError('The "util.promisify.custom" argument must be of type Function');
        }
        Object.defineProperty(fn, kCustomPromisifiedSymbol, {
          value: fn,
          enumerable: false,
          writable: false,
          configurable: true
        });
        return fn;
      }
      function fn() {
        var promiseResolve, promiseReject;
        var promise2 = new Promise(function(resolve, reject) {
          promiseResolve = resolve;
          promiseReject = reject;
        });
        var args = [];
        for (var i = 0; i < arguments.length; i++) {
          args.push(arguments[i]);
        }
        args.push(function(err, value) {
          if (err) {
            promiseReject(err);
          } else {
            promiseResolve(value);
          }
        });
        try {
          original.apply(this, args);
        } catch (err) {
          promiseReject(err);
        }
        return promise2;
      }
      Object.setPrototypeOf(fn, Object.getPrototypeOf(original));
      if (kCustomPromisifiedSymbol)
        Object.defineProperty(fn, kCustomPromisifiedSymbol, {
          value: fn,
          enumerable: false,
          writable: false,
          configurable: true
        });
      return Object.defineProperties(
        fn,
        getOwnPropertyDescriptors(original)
      );
    };
    exports.promisify.custom = kCustomPromisifiedSymbol;
    function callbackifyOnRejected(reason, cb) {
      if (!reason) {
        var newReason = new Error("Promise was rejected with a falsy value");
        newReason.reason = reason;
        reason = newReason;
      }
      return cb(reason);
    }
    function callbackify(original) {
      if (typeof original !== "function") {
        throw new TypeError('The "original" argument must be of type Function');
      }
      function callbackified() {
        var args = [];
        for (var i = 0; i < arguments.length; i++) {
          args.push(arguments[i]);
        }
        var maybeCb = args.pop();
        if (typeof maybeCb !== "function") {
          throw new TypeError("The last argument must be of type Function");
        }
        var self2 = this;
        var cb = function() {
          return maybeCb.apply(self2, arguments);
        };
        original.apply(this, args).then(
          function(ret) {
            process.nextTick(cb.bind(null, null, ret));
          },
          function(rej) {
            process.nextTick(callbackifyOnRejected.bind(null, rej, cb));
          }
        );
      }
      Object.setPrototypeOf(callbackified, Object.getPrototypeOf(original));
      Object.defineProperties(
        callbackified,
        getOwnPropertyDescriptors(original)
      );
      return callbackified;
    }
    exports.callbackify = callbackify;
  })(util);
  return util;
}
lib$3.TextEncoder = typeof TextEncoder !== "undefined" ? TextEncoder : requireUtil().TextEncoder;
lib$3.TextDecoder = typeof TextDecoder !== "undefined" ? TextDecoder : requireUtil().TextDecoder;
Object.defineProperty(bufferUtils, "__esModule", { value: true });
bufferUtils.getArrayBuffer = bufferUtils.decodeBuffer = bufferUtils.encodeBuffer = void 0;
var web_encoding_1 = lib$3;
function encodeBuffer(text2) {
  var encoder = new web_encoding_1.TextEncoder();
  var encoded = encoder.encode(text2);
  return getArrayBuffer(encoded);
}
bufferUtils.encodeBuffer = encodeBuffer;
function decodeBuffer(buffer, encoding) {
  var decoder = new web_encoding_1.TextDecoder(encoding);
  return decoder.decode(buffer);
}
bufferUtils.decodeBuffer = decodeBuffer;
function getArrayBuffer(array) {
  return array.buffer.slice(array.byteOffset, array.byteOffset + array.byteLength);
}
bufferUtils.getArrayBuffer = getArrayBuffer;
var uuid$1 = {};
Object.defineProperty(uuid$1, "__esModule", { value: true });
uuid$1.uuidv4 = void 0;
function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0;
    var v = c == "x" ? r : r & 3 | 8;
    return v.toString(16);
  });
}
uuid$1.uuidv4 = uuidv4;
var __awaiter$1 = commonjsGlobal && commonjsGlobal.__awaiter || function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
var __generator$1 = commonjsGlobal && commonjsGlobal.__generator || function(thisArg, body2) {
  var _ = { label: 0, sent: function() {
    if (t[0] & 1)
      throw t[1];
    return t[1];
  }, trys: [], ops: [] }, f, y, t, g;
  return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
    return this;
  }), g;
  function verb(n) {
    return function(v) {
      return step([n, v]);
    };
  }
  function step(op) {
    if (f)
      throw new TypeError("Generator is already executing.");
    while (_)
      try {
        if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done)
          return t;
        if (y = 0, t)
          op = [op[0] & 2, t.value];
        switch (op[0]) {
          case 0:
          case 1:
            t = op;
            break;
          case 4:
            _.label++;
            return { value: op[1], done: false };
          case 5:
            _.label++;
            y = op[1];
            op = [0];
            continue;
          case 7:
            op = _.ops.pop();
            _.trys.pop();
            continue;
          default:
            if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
              _ = 0;
              continue;
            }
            if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
              _.label = op[1];
              break;
            }
            if (op[0] === 6 && _.label < t[1]) {
              _.label = t[1];
              t = op;
              break;
            }
            if (t && _.label < t[2]) {
              _.label = t[2];
              _.ops.push(op);
              break;
            }
            if (t[2])
              _.ops.pop();
            _.trys.pop();
            continue;
        }
        op = body2.call(thisArg, _);
      } catch (e) {
        op = [6, e];
        y = 0;
      } finally {
        f = t = 0;
      }
    if (op[0] & 5)
      throw op[1];
    return { value: op[0] ? op[1] : void 0, done: true };
  }
};
Object.defineProperty(IsomorphicRequest$1, "__esModule", { value: true });
IsomorphicRequest$1.IsomorphicRequest = void 0;
var lib_1 = lib$9;
var outvariant_1$1 = lib$5;
var bufferUtils_1 = bufferUtils;
var uuid_1 = uuid$1;
var IsomorphicRequest = function() {
  function IsomorphicRequest2(input, init2) {
    if (init2 === void 0) {
      init2 = {};
    }
    var defaultBody = new ArrayBuffer(0);
    this._bodyUsed = false;
    if (input instanceof IsomorphicRequest2) {
      this.id = input.id;
      this.url = input.url;
      this.method = input.method;
      this.headers = input.headers;
      this.credentials = input.credentials;
      this._body = input._body || defaultBody;
      return;
    }
    this.id = uuid_1.uuidv4();
    this.url = input;
    this.method = init2.method || "GET";
    this.headers = new lib_1.Headers(init2.headers);
    this.credentials = init2.credentials || "same-origin";
    this._body = init2.body || defaultBody;
  }
  Object.defineProperty(IsomorphicRequest2.prototype, "bodyUsed", {
    get: function() {
      return this._bodyUsed;
    },
    enumerable: false,
    configurable: true
  });
  IsomorphicRequest2.prototype.text = function() {
    return __awaiter$1(this, void 0, void 0, function() {
      return __generator$1(this, function(_a2) {
        outvariant_1$1.invariant(!this.bodyUsed, 'Failed to execute "text" on "IsomorphicRequest": body buffer already read');
        this._bodyUsed = true;
        return [2, bufferUtils_1.decodeBuffer(this._body)];
      });
    });
  };
  IsomorphicRequest2.prototype.json = function() {
    return __awaiter$1(this, void 0, void 0, function() {
      var text2;
      return __generator$1(this, function(_a2) {
        outvariant_1$1.invariant(!this.bodyUsed, 'Failed to execute "json" on "IsomorphicRequest": body buffer already read');
        this._bodyUsed = true;
        text2 = bufferUtils_1.decodeBuffer(this._body);
        return [2, JSON.parse(text2)];
      });
    });
  };
  IsomorphicRequest2.prototype.arrayBuffer = function() {
    return __awaiter$1(this, void 0, void 0, function() {
      return __generator$1(this, function(_a2) {
        outvariant_1$1.invariant(!this.bodyUsed, 'Failed to execute "arrayBuffer" on "IsomorphicRequest": body buffer already read');
        this._bodyUsed = true;
        return [2, this._body];
      });
    });
  };
  IsomorphicRequest2.prototype.clone = function() {
    return new IsomorphicRequest2(this);
  };
  return IsomorphicRequest2;
}();
IsomorphicRequest$1.IsomorphicRequest = IsomorphicRequest;
var InteractiveIsomorphicRequest$1 = {};
var createLazyCallback$1 = {};
var __awaiter = commonjsGlobal && commonjsGlobal.__awaiter || function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
var __generator = commonjsGlobal && commonjsGlobal.__generator || function(thisArg, body2) {
  var _ = { label: 0, sent: function() {
    if (t[0] & 1)
      throw t[1];
    return t[1];
  }, trys: [], ops: [] }, f, y, t, g;
  return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
    return this;
  }), g;
  function verb(n) {
    return function(v) {
      return step([n, v]);
    };
  }
  function step(op) {
    if (f)
      throw new TypeError("Generator is already executing.");
    while (_)
      try {
        if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done)
          return t;
        if (y = 0, t)
          op = [op[0] & 2, t.value];
        switch (op[0]) {
          case 0:
          case 1:
            t = op;
            break;
          case 4:
            _.label++;
            return { value: op[1], done: false };
          case 5:
            _.label++;
            y = op[1];
            op = [0];
            continue;
          case 7:
            op = _.ops.pop();
            _.trys.pop();
            continue;
          default:
            if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
              _ = 0;
              continue;
            }
            if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
              _.label = op[1];
              break;
            }
            if (op[0] === 6 && _.label < t[1]) {
              _.label = t[1];
              t = op;
              break;
            }
            if (t && _.label < t[2]) {
              _.label = t[2];
              _.ops.push(op);
              break;
            }
            if (t[2])
              _.ops.pop();
            _.trys.pop();
            continue;
        }
        op = body2.call(thisArg, _);
      } catch (e) {
        op = [6, e];
        y = 0;
      } finally {
        f = t = 0;
      }
    if (op[0] & 5)
      throw op[1];
    return { value: op[0] ? op[1] : void 0, done: true };
  }
};
Object.defineProperty(createLazyCallback$1, "__esModule", { value: true });
createLazyCallback$1.createLazyCallback = void 0;
function createLazyCallback(options) {
  var _this = this;
  if (options === void 0) {
    options = {};
  }
  var calledTimes = 0;
  var autoResolveTimeout;
  var remoteResolve;
  var callPromise = new Promise(function(resolve) {
    remoteResolve = resolve;
  }).finally(function() {
    clearTimeout(autoResolveTimeout);
  });
  var fn = function() {
    var _a2;
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
      args[_i] = arguments[_i];
    }
    if (options.maxCalls && calledTimes >= options.maxCalls) {
      (_a2 = options.maxCallsCallback) === null || _a2 === void 0 ? void 0 : _a2.call(options);
    }
    remoteResolve(args);
    calledTimes++;
  };
  fn.invoked = function() {
    return __awaiter(_this, void 0, void 0, function() {
      return __generator(this, function(_a2) {
        autoResolveTimeout = setTimeout(function() {
          remoteResolve([]);
        }, 0);
        return [2, callPromise];
      });
    });
  };
  return fn;
}
createLazyCallback$1.createLazyCallback = createLazyCallback;
var __extends = commonjsGlobal && commonjsGlobal.__extends || function() {
  var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
      d2.__proto__ = b2;
    } || function(d2, b2) {
      for (var p in b2)
        if (Object.prototype.hasOwnProperty.call(b2, p))
          d2[p] = b2[p];
    };
    return extendStatics(d, b);
  };
  return function(d, b) {
    if (typeof b !== "function" && b !== null)
      throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
}();
Object.defineProperty(InteractiveIsomorphicRequest$1, "__esModule", { value: true });
InteractiveIsomorphicRequest$1.InteractiveIsomorphicRequest = void 0;
var outvariant_1 = lib$5;
var IsomorphicRequest_1 = IsomorphicRequest$1;
var createLazyCallback_1 = createLazyCallback$1;
var InteractiveIsomorphicRequest = function(_super) {
  __extends(InteractiveIsomorphicRequest2, _super);
  function InteractiveIsomorphicRequest2(request) {
    var _this = _super.call(this, request) || this;
    _this.respondWith = createLazyCallback_1.createLazyCallback({
      maxCalls: 1,
      maxCallsCallback: function() {
        outvariant_1.invariant(false, 'Failed to respond to "%s %s" request: the "request" event has already been responded to.', _this.method, _this.url.href);
      }
    });
    return _this;
  }
  return InteractiveIsomorphicRequest2;
}(IsomorphicRequest_1.IsomorphicRequest);
InteractiveIsomorphicRequest$1.InteractiveIsomorphicRequest = InteractiveIsomorphicRequest;
var getCleanUrl$1 = {};
Object.defineProperty(getCleanUrl$1, "__esModule", { value: true });
getCleanUrl$1.getCleanUrl = void 0;
function getCleanUrl(url, isAbsolute) {
  if (isAbsolute === void 0) {
    isAbsolute = true;
  }
  return [isAbsolute && url.origin, url.pathname].filter(Boolean).join("");
}
getCleanUrl$1.getCleanUrl = getCleanUrl;
(function(exports) {
  var __createBinding = commonjsGlobal && commonjsGlobal.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === void 0)
      k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() {
      return m[k];
    } });
  } : function(o, m, k, k2) {
    if (k2 === void 0)
      k2 = k;
    o[k2] = m[k];
  });
  var __exportStar = commonjsGlobal && commonjsGlobal.__exportStar || function(m, exports2) {
    for (var p in m)
      if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p))
        __createBinding(exports2, m, p);
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.decodeBuffer = exports.encodeBuffer = exports.getCleanUrl = void 0;
  __exportStar(glossary, exports);
  __exportStar(Interceptor, exports);
  __exportStar(BatchInterceptor$1, exports);
  __exportStar(IsomorphicRequest$1, exports);
  __exportStar(InteractiveIsomorphicRequest$1, exports);
  var getCleanUrl_1 = getCleanUrl$1;
  Object.defineProperty(exports, "getCleanUrl", { enumerable: true, get: function() {
    return getCleanUrl_1.getCleanUrl;
  } });
  var bufferUtils_12 = bufferUtils;
  Object.defineProperty(exports, "encodeBuffer", { enumerable: true, get: function() {
    return bufferUtils_12.encodeBuffer;
  } });
  Object.defineProperty(exports, "decodeBuffer", { enumerable: true, get: function() {
    return bufferUtils_12.decodeBuffer;
  } });
})(lib$4);
var lib$2 = {};
var store = {};
var setCookie = { exports: {} };
var defaultParseOptions = {
  decodeValues: true,
  map: false,
  silent: false
};
function isNonEmptyString(str) {
  return typeof str === "string" && !!str.trim();
}
function parseString(setCookieValue, options) {
  var parts = setCookieValue.split(";").filter(isNonEmptyString);
  var nameValuePairStr = parts.shift();
  var parsed = parseNameValuePair(nameValuePairStr);
  var name = parsed.name;
  var value = parsed.value;
  options = options ? Object.assign({}, defaultParseOptions, options) : defaultParseOptions;
  try {
    value = options.decodeValues ? decodeURIComponent(value) : value;
  } catch (e) {
    console.error(
      "set-cookie-parser encountered an error while decoding a cookie with value '" + value + "'. Set options.decodeValues to false to disable this feature.",
      e
    );
  }
  var cookie2 = {
    name,
    value
  };
  parts.forEach(function(part) {
    var sides = part.split("=");
    var key = sides.shift().trimLeft().toLowerCase();
    var value2 = sides.join("=");
    if (key === "expires") {
      cookie2.expires = new Date(value2);
    } else if (key === "max-age") {
      cookie2.maxAge = parseInt(value2, 10);
    } else if (key === "secure") {
      cookie2.secure = true;
    } else if (key === "httponly") {
      cookie2.httpOnly = true;
    } else if (key === "samesite") {
      cookie2.sameSite = value2;
    } else {
      cookie2[key] = value2;
    }
  });
  return cookie2;
}
function parseNameValuePair(nameValuePairStr) {
  var name = "";
  var value = "";
  var nameValueArr = nameValuePairStr.split("=");
  if (nameValueArr.length > 1) {
    name = nameValueArr.shift();
    value = nameValueArr.join("=");
  } else {
    value = nameValuePairStr;
  }
  return { name, value };
}
function parse$2(input, options) {
  options = options ? Object.assign({}, defaultParseOptions, options) : defaultParseOptions;
  if (!input) {
    if (!options.map) {
      return [];
    } else {
      return {};
    }
  }
  if (input.headers && input.headers["set-cookie"]) {
    input = input.headers["set-cookie"];
  } else if (input.headers) {
    var sch = input.headers[Object.keys(input.headers).find(function(key) {
      return key.toLowerCase() === "set-cookie";
    })];
    if (!sch && input.headers.cookie && !options.silent) {
      console.warn(
        "Warning: set-cookie-parser appears to have been called on a request object. It is designed to parse Set-Cookie headers from responses, not Cookie headers from requests. Set the option {silent: true} to suppress this warning."
      );
    }
    input = sch;
  }
  if (!Array.isArray(input)) {
    input = [input];
  }
  options = options ? Object.assign({}, defaultParseOptions, options) : defaultParseOptions;
  if (!options.map) {
    return input.filter(isNonEmptyString).map(function(str) {
      return parseString(str, options);
    });
  } else {
    var cookies = {};
    return input.filter(isNonEmptyString).reduce(function(cookies2, str) {
      var cookie2 = parseString(str, options);
      cookies2[cookie2.name] = cookie2;
      return cookies2;
    }, cookies);
  }
}
function splitCookiesString(cookiesString) {
  if (Array.isArray(cookiesString)) {
    return cookiesString;
  }
  if (typeof cookiesString !== "string") {
    return [];
  }
  var cookiesStrings = [];
  var pos = 0;
  var start;
  var ch;
  var lastComma;
  var nextStart;
  var cookiesSeparatorFound;
  function skipWhitespace() {
    while (pos < cookiesString.length && /\s/.test(cookiesString.charAt(pos))) {
      pos += 1;
    }
    return pos < cookiesString.length;
  }
  function notSpecialChar() {
    ch = cookiesString.charAt(pos);
    return ch !== "=" && ch !== ";" && ch !== ",";
  }
  while (pos < cookiesString.length) {
    start = pos;
    cookiesSeparatorFound = false;
    while (skipWhitespace()) {
      ch = cookiesString.charAt(pos);
      if (ch === ",") {
        lastComma = pos;
        pos += 1;
        skipWhitespace();
        nextStart = pos;
        while (pos < cookiesString.length && notSpecialChar()) {
          pos += 1;
        }
        if (pos < cookiesString.length && cookiesString.charAt(pos) === "=") {
          cookiesSeparatorFound = true;
          pos = nextStart;
          cookiesStrings.push(cookiesString.substring(start, lastComma));
          start = pos;
        } else {
          pos = lastComma + 1;
        }
      } else {
        pos += 1;
      }
    }
    if (!cookiesSeparatorFound || pos >= cookiesString.length) {
      cookiesStrings.push(cookiesString.substring(start, cookiesString.length));
    }
  }
  return cookiesStrings;
}
setCookie.exports = parse$2;
setCookie.exports.parse = parse$2;
setCookie.exports.parseString = parseString;
setCookie.exports.splitCookiesString = splitCookiesString;
(function(exports) {
  var __rest = commonjsGlobal && commonjsGlobal.__rest || function(s, e) {
    var t = {};
    for (var p in s)
      if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
      for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
        if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
          t[p[i]] = s[p[i]];
      }
    return t;
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.store = exports.PERSISTENCY_KEY = void 0;
  const set_cookie_parser_1 = setCookie.exports;
  exports.PERSISTENCY_KEY = "MSW_COOKIE_STORE";
  function supportsLocalStorage() {
    try {
      if (localStorage == null) {
        return false;
      }
      const testKey = exports.PERSISTENCY_KEY + "_test";
      localStorage.setItem(testKey, "test");
      localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch (error2) {
      return false;
    }
  }
  class CookieStore {
    constructor() {
      this.store = /* @__PURE__ */ new Map();
    }
    add(request, response2) {
      if (request.credentials === "omit") {
        return;
      }
      const requestUrl = new URL(request.url);
      const responseCookies = response2.headers.get("set-cookie");
      if (!responseCookies) {
        return;
      }
      const now2 = Date.now();
      const parsedResponseCookies = set_cookie_parser_1.parse(responseCookies).map((_a2) => {
        var { maxAge } = _a2, cookie2 = __rest(_a2, ["maxAge"]);
        return Object.assign(Object.assign({}, cookie2), { expires: maxAge === void 0 ? cookie2.expires : new Date(now2 + maxAge * 1e3), maxAge });
      });
      const prevCookies = this.store.get(requestUrl.origin) || /* @__PURE__ */ new Map();
      parsedResponseCookies.forEach((cookie2) => {
        this.store.set(requestUrl.origin, prevCookies.set(cookie2.name, cookie2));
      });
    }
    get(request) {
      this.deleteExpiredCookies();
      const requestUrl = new URL(request.url);
      const originCookies = this.store.get(requestUrl.origin) || /* @__PURE__ */ new Map();
      switch (request.credentials) {
        case "include": {
          if (typeof document === "undefined") {
            return originCookies;
          }
          const documentCookies = set_cookie_parser_1.parse(document.cookie);
          documentCookies.forEach((cookie2) => {
            originCookies.set(cookie2.name, cookie2);
          });
          return originCookies;
        }
        case "same-origin": {
          return originCookies;
        }
        default:
          return /* @__PURE__ */ new Map();
      }
    }
    getAll() {
      this.deleteExpiredCookies();
      return this.store;
    }
    deleteAll(request) {
      const requestUrl = new URL(request.url);
      this.store.delete(requestUrl.origin);
    }
    clear() {
      this.store.clear();
    }
    hydrate() {
      if (!supportsLocalStorage()) {
        return;
      }
      const persistedCookies = localStorage.getItem(exports.PERSISTENCY_KEY);
      if (!persistedCookies) {
        return;
      }
      try {
        const parsedCookies = JSON.parse(persistedCookies);
        parsedCookies.forEach(([origin, cookies]) => {
          this.store.set(origin, new Map(cookies.map((_a2) => {
            var [token, _b2] = _a2, { expires } = _b2, cookie2 = __rest(_b2, ["expires"]);
            return [
              token,
              expires === void 0 ? cookie2 : Object.assign(Object.assign({}, cookie2), { expires: new Date(expires) })
            ];
          })));
        });
      } catch (error2) {
        console.warn(`
[virtual-cookie] Failed to parse a stored cookie from the localStorage (key "${exports.PERSISTENCY_KEY}").

Stored value:
${localStorage.getItem(exports.PERSISTENCY_KEY)}

Thrown exception:
${error2}

Invalid value has been removed from localStorage to prevent subsequent failed parsing attempts.`);
        localStorage.removeItem(exports.PERSISTENCY_KEY);
      }
    }
    persist() {
      if (!supportsLocalStorage()) {
        return;
      }
      const serializedCookies = Array.from(this.store.entries()).map(([origin, cookies]) => {
        return [origin, Array.from(cookies.entries())];
      });
      localStorage.setItem(exports.PERSISTENCY_KEY, JSON.stringify(serializedCookies));
    }
    deleteExpiredCookies() {
      const now2 = Date.now();
      this.store.forEach((originCookies, origin) => {
        originCookies.forEach(({ expires, name }) => {
          if (expires !== void 0 && expires.getTime() <= now2) {
            originCookies.delete(name);
          }
        });
        if (originCookies.size === 0) {
          this.store.delete(origin);
        }
      });
    }
  }
  exports.store = new CookieStore();
})(store);
(function(exports) {
  var __createBinding = commonjsGlobal && commonjsGlobal.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === void 0)
      k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() {
      return m[k];
    } });
  } : function(o, m, k, k2) {
    if (k2 === void 0)
      k2 = k;
    o[k2] = m[k];
  });
  var __exportStar = commonjsGlobal && commonjsGlobal.__exportStar || function(m, exports2) {
    for (var p in m)
      if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p))
        __createBinding(exports2, m, p);
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  __exportStar(store, exports);
})(lib$2);
var _jsLevenshtein_1_1_6_jsLevenshtein;
var hasRequired_jsLevenshtein_1_1_6_jsLevenshtein;
function require_jsLevenshtein_1_1_6_jsLevenshtein() {
  if (hasRequired_jsLevenshtein_1_1_6_jsLevenshtein)
    return _jsLevenshtein_1_1_6_jsLevenshtein;
  hasRequired_jsLevenshtein_1_1_6_jsLevenshtein = 1;
  _jsLevenshtein_1_1_6_jsLevenshtein = function() {
    function _min(d0, d1, d2, bx, ay) {
      return d0 < d1 || d2 < d1 ? d0 > d2 ? d2 + 1 : d0 + 1 : bx === ay ? d1 : d1 + 1;
    }
    return function(a, b) {
      if (a === b) {
        return 0;
      }
      if (a.length > b.length) {
        var tmp = a;
        a = b;
        b = tmp;
      }
      var la = a.length;
      var lb = b.length;
      while (la > 0 && a.charCodeAt(la - 1) === b.charCodeAt(lb - 1)) {
        la--;
        lb--;
      }
      var offset = 0;
      while (offset < la && a.charCodeAt(offset) === b.charCodeAt(offset)) {
        offset++;
      }
      la -= offset;
      lb -= offset;
      if (la === 0 || lb < 3) {
        return lb;
      }
      var x = 0;
      var y;
      var d0;
      var d1;
      var d2;
      var d3;
      var dd;
      var dy;
      var ay;
      var bx0;
      var bx1;
      var bx2;
      var bx3;
      var vector = [];
      for (y = 0; y < la; y++) {
        vector.push(y + 1);
        vector.push(a.charCodeAt(offset + y));
      }
      var len = vector.length - 1;
      for (; x < lb - 3; ) {
        bx0 = b.charCodeAt(offset + (d0 = x));
        bx1 = b.charCodeAt(offset + (d1 = x + 1));
        bx2 = b.charCodeAt(offset + (d2 = x + 2));
        bx3 = b.charCodeAt(offset + (d3 = x + 3));
        dd = x += 4;
        for (y = 0; y < len; y += 2) {
          dy = vector[y];
          ay = vector[y + 1];
          d0 = _min(dy, d0, d1, bx0, ay);
          d1 = _min(d0, d1, d2, bx1, ay);
          d2 = _min(d1, d2, d3, bx2, ay);
          dd = _min(d2, d3, dd, bx3, ay);
          vector[y] = dd;
          d3 = d2;
          d2 = d1;
          d1 = d0;
          d0 = dy;
        }
      }
      for (; x < lb; ) {
        bx0 = b.charCodeAt(offset + (d0 = x));
        dd = ++x;
        for (y = 0; y < len; y += 2) {
          dy = vector[y];
          vector[y] = dd = _min(dy, d0, dd, bx0, vector[y + 1]);
          d0 = dy;
        }
      }
      return dd;
    };
  }();
  return _jsLevenshtein_1_1_6_jsLevenshtein;
}
const version = "16.6.0";
const versionInfo = Object.freeze({
  major: 16,
  minor: 6,
  patch: 0,
  preReleaseTag: null
});
function devAssert(condition, message) {
  const booleanCondition = Boolean(condition);
  if (!booleanCondition) {
    throw new Error(message);
  }
}
function isPromise(value) {
  return typeof (value === null || value === void 0 ? void 0 : value.then) === "function";
}
function isObjectLike(value) {
  return typeof value == "object" && value !== null;
}
function invariant(condition, message) {
  const booleanCondition = Boolean(condition);
  if (!booleanCondition) {
    throw new Error(
      message != null ? message : "Unexpected invariant triggered."
    );
  }
}
const LineRegExp = /\r\n|[\n\r]/g;
function getLocation(source, position) {
  let lastLineStart = 0;
  let line = 1;
  for (const match2 of source.body.matchAll(LineRegExp)) {
    typeof match2.index === "number" || invariant(false);
    if (match2.index >= position) {
      break;
    }
    lastLineStart = match2.index + match2[0].length;
    line += 1;
  }
  return {
    line,
    column: position + 1 - lastLineStart
  };
}
function printLocation(location2) {
  return printSourceLocation(
    location2.source,
    getLocation(location2.source, location2.start)
  );
}
function printSourceLocation(source, sourceLocation) {
  const firstLineColumnOffset = source.locationOffset.column - 1;
  const body2 = "".padStart(firstLineColumnOffset) + source.body;
  const lineIndex = sourceLocation.line - 1;
  const lineOffset = source.locationOffset.line - 1;
  const lineNum = sourceLocation.line + lineOffset;
  const columnOffset = sourceLocation.line === 1 ? firstLineColumnOffset : 0;
  const columnNum = sourceLocation.column + columnOffset;
  const locationStr = `${source.name}:${lineNum}:${columnNum}
`;
  const lines = body2.split(/\r\n|[\n\r]/g);
  const locationLine = lines[lineIndex];
  if (locationLine.length > 120) {
    const subLineIndex = Math.floor(columnNum / 80);
    const subLineColumnNum = columnNum % 80;
    const subLines = [];
    for (let i = 0; i < locationLine.length; i += 80) {
      subLines.push(locationLine.slice(i, i + 80));
    }
    return locationStr + printPrefixedLines([
      [`${lineNum} |`, subLines[0]],
      ...subLines.slice(1, subLineIndex + 1).map((subLine) => ["|", subLine]),
      ["|", "^".padStart(subLineColumnNum)],
      ["|", subLines[subLineIndex + 1]]
    ]);
  }
  return locationStr + printPrefixedLines([
    [`${lineNum - 1} |`, lines[lineIndex - 1]],
    [`${lineNum} |`, locationLine],
    ["|", "^".padStart(columnNum)],
    [`${lineNum + 1} |`, lines[lineIndex + 1]]
  ]);
}
function printPrefixedLines(lines) {
  const existingLines = lines.filter(([_, line]) => line !== void 0);
  const padLen = Math.max(...existingLines.map(([prefix]) => prefix.length));
  return existingLines.map(([prefix, line]) => prefix.padStart(padLen) + (line ? " " + line : "")).join("\n");
}
function toNormalizedOptions(args) {
  const firstArg = args[0];
  if (firstArg == null || "kind" in firstArg || "length" in firstArg) {
    return {
      nodes: firstArg,
      source: args[1],
      positions: args[2],
      path: args[3],
      originalError: args[4],
      extensions: args[5]
    };
  }
  return firstArg;
}
class GraphQLError extends Error {
  constructor(message, ...rawArgs) {
    var _this$nodes, _nodeLocations$, _ref;
    const { nodes, source, positions, path, originalError, extensions: extensions2 } = toNormalizedOptions(rawArgs);
    super(message);
    this.name = "GraphQLError";
    this.path = path !== null && path !== void 0 ? path : void 0;
    this.originalError = originalError !== null && originalError !== void 0 ? originalError : void 0;
    this.nodes = undefinedIfEmpty(
      Array.isArray(nodes) ? nodes : nodes ? [nodes] : void 0
    );
    const nodeLocations = undefinedIfEmpty(
      (_this$nodes = this.nodes) === null || _this$nodes === void 0 ? void 0 : _this$nodes.map((node) => node.loc).filter((loc) => loc != null)
    );
    this.source = source !== null && source !== void 0 ? source : nodeLocations === null || nodeLocations === void 0 ? void 0 : (_nodeLocations$ = nodeLocations[0]) === null || _nodeLocations$ === void 0 ? void 0 : _nodeLocations$.source;
    this.positions = positions !== null && positions !== void 0 ? positions : nodeLocations === null || nodeLocations === void 0 ? void 0 : nodeLocations.map((loc) => loc.start);
    this.locations = positions && source ? positions.map((pos) => getLocation(source, pos)) : nodeLocations === null || nodeLocations === void 0 ? void 0 : nodeLocations.map((loc) => getLocation(loc.source, loc.start));
    const originalExtensions = isObjectLike(
      originalError === null || originalError === void 0 ? void 0 : originalError.extensions
    ) ? originalError === null || originalError === void 0 ? void 0 : originalError.extensions : void 0;
    this.extensions = (_ref = extensions2 !== null && extensions2 !== void 0 ? extensions2 : originalExtensions) !== null && _ref !== void 0 ? _ref : /* @__PURE__ */ Object.create(null);
    Object.defineProperties(this, {
      message: {
        writable: true,
        enumerable: true
      },
      name: {
        enumerable: false
      },
      nodes: {
        enumerable: false
      },
      source: {
        enumerable: false
      },
      positions: {
        enumerable: false
      },
      originalError: {
        enumerable: false
      }
    });
    if (originalError !== null && originalError !== void 0 && originalError.stack) {
      Object.defineProperty(this, "stack", {
        value: originalError.stack,
        writable: true,
        configurable: true
      });
    } else if (Error.captureStackTrace) {
      Error.captureStackTrace(this, GraphQLError);
    } else {
      Object.defineProperty(this, "stack", {
        value: Error().stack,
        writable: true,
        configurable: true
      });
    }
  }
  get [Symbol.toStringTag]() {
    return "GraphQLError";
  }
  toString() {
    let output = this.message;
    if (this.nodes) {
      for (const node of this.nodes) {
        if (node.loc) {
          output += "\n\n" + printLocation(node.loc);
        }
      }
    } else if (this.source && this.locations) {
      for (const location2 of this.locations) {
        output += "\n\n" + printSourceLocation(this.source, location2);
      }
    }
    return output;
  }
  toJSON() {
    const formattedError = {
      message: this.message
    };
    if (this.locations != null) {
      formattedError.locations = this.locations;
    }
    if (this.path != null) {
      formattedError.path = this.path;
    }
    if (this.extensions != null && Object.keys(this.extensions).length > 0) {
      formattedError.extensions = this.extensions;
    }
    return formattedError;
  }
}
function undefinedIfEmpty(array) {
  return array === void 0 || array.length === 0 ? void 0 : array;
}
function printError(error2) {
  return error2.toString();
}
function formatError(error2) {
  return error2.toJSON();
}
function syntaxError(source, position, description) {
  return new GraphQLError(`Syntax Error: ${description}`, {
    source,
    positions: [position]
  });
}
class Location {
  constructor(startToken, endToken, source) {
    this.start = startToken.start;
    this.end = endToken.end;
    this.startToken = startToken;
    this.endToken = endToken;
    this.source = source;
  }
  get [Symbol.toStringTag]() {
    return "Location";
  }
  toJSON() {
    return {
      start: this.start,
      end: this.end
    };
  }
}
class Token {
  constructor(kind, start, end, line, column, value) {
    this.kind = kind;
    this.start = start;
    this.end = end;
    this.line = line;
    this.column = column;
    this.value = value;
    this.prev = null;
    this.next = null;
  }
  get [Symbol.toStringTag]() {
    return "Token";
  }
  toJSON() {
    return {
      kind: this.kind,
      value: this.value,
      line: this.line,
      column: this.column
    };
  }
}
const QueryDocumentKeys = {
  Name: [],
  Document: ["definitions"],
  OperationDefinition: [
    "name",
    "variableDefinitions",
    "directives",
    "selectionSet"
  ],
  VariableDefinition: ["variable", "type", "defaultValue", "directives"],
  Variable: ["name"],
  SelectionSet: ["selections"],
  Field: ["alias", "name", "arguments", "directives", "selectionSet"],
  Argument: ["name", "value"],
  FragmentSpread: ["name", "directives"],
  InlineFragment: ["typeCondition", "directives", "selectionSet"],
  FragmentDefinition: [
    "name",
    "variableDefinitions",
    "typeCondition",
    "directives",
    "selectionSet"
  ],
  IntValue: [],
  FloatValue: [],
  StringValue: [],
  BooleanValue: [],
  NullValue: [],
  EnumValue: [],
  ListValue: ["values"],
  ObjectValue: ["fields"],
  ObjectField: ["name", "value"],
  Directive: ["name", "arguments"],
  NamedType: ["name"],
  ListType: ["type"],
  NonNullType: ["type"],
  SchemaDefinition: ["description", "directives", "operationTypes"],
  OperationTypeDefinition: ["type"],
  ScalarTypeDefinition: ["description", "name", "directives"],
  ObjectTypeDefinition: [
    "description",
    "name",
    "interfaces",
    "directives",
    "fields"
  ],
  FieldDefinition: ["description", "name", "arguments", "type", "directives"],
  InputValueDefinition: [
    "description",
    "name",
    "type",
    "defaultValue",
    "directives"
  ],
  InterfaceTypeDefinition: [
    "description",
    "name",
    "interfaces",
    "directives",
    "fields"
  ],
  UnionTypeDefinition: ["description", "name", "directives", "types"],
  EnumTypeDefinition: ["description", "name", "directives", "values"],
  EnumValueDefinition: ["description", "name", "directives"],
  InputObjectTypeDefinition: ["description", "name", "directives", "fields"],
  DirectiveDefinition: ["description", "name", "arguments", "locations"],
  SchemaExtension: ["directives", "operationTypes"],
  ScalarTypeExtension: ["name", "directives"],
  ObjectTypeExtension: ["name", "interfaces", "directives", "fields"],
  InterfaceTypeExtension: ["name", "interfaces", "directives", "fields"],
  UnionTypeExtension: ["name", "directives", "types"],
  EnumTypeExtension: ["name", "directives", "values"],
  InputObjectTypeExtension: ["name", "directives", "fields"]
};
const kindValues = new Set(Object.keys(QueryDocumentKeys));
function isNode(maybeNode) {
  const maybeKind = maybeNode === null || maybeNode === void 0 ? void 0 : maybeNode.kind;
  return typeof maybeKind === "string" && kindValues.has(maybeKind);
}
var OperationTypeNode;
(function(OperationTypeNode2) {
  OperationTypeNode2["QUERY"] = "query";
  OperationTypeNode2["MUTATION"] = "mutation";
  OperationTypeNode2["SUBSCRIPTION"] = "subscription";
})(OperationTypeNode || (OperationTypeNode = {}));
var DirectiveLocation;
(function(DirectiveLocation2) {
  DirectiveLocation2["QUERY"] = "QUERY";
  DirectiveLocation2["MUTATION"] = "MUTATION";
  DirectiveLocation2["SUBSCRIPTION"] = "SUBSCRIPTION";
  DirectiveLocation2["FIELD"] = "FIELD";
  DirectiveLocation2["FRAGMENT_DEFINITION"] = "FRAGMENT_DEFINITION";
  DirectiveLocation2["FRAGMENT_SPREAD"] = "FRAGMENT_SPREAD";
  DirectiveLocation2["INLINE_FRAGMENT"] = "INLINE_FRAGMENT";
  DirectiveLocation2["VARIABLE_DEFINITION"] = "VARIABLE_DEFINITION";
  DirectiveLocation2["SCHEMA"] = "SCHEMA";
  DirectiveLocation2["SCALAR"] = "SCALAR";
  DirectiveLocation2["OBJECT"] = "OBJECT";
  DirectiveLocation2["FIELD_DEFINITION"] = "FIELD_DEFINITION";
  DirectiveLocation2["ARGUMENT_DEFINITION"] = "ARGUMENT_DEFINITION";
  DirectiveLocation2["INTERFACE"] = "INTERFACE";
  DirectiveLocation2["UNION"] = "UNION";
  DirectiveLocation2["ENUM"] = "ENUM";
  DirectiveLocation2["ENUM_VALUE"] = "ENUM_VALUE";
  DirectiveLocation2["INPUT_OBJECT"] = "INPUT_OBJECT";
  DirectiveLocation2["INPUT_FIELD_DEFINITION"] = "INPUT_FIELD_DEFINITION";
})(DirectiveLocation || (DirectiveLocation = {}));
var Kind;
(function(Kind2) {
  Kind2["NAME"] = "Name";
  Kind2["DOCUMENT"] = "Document";
  Kind2["OPERATION_DEFINITION"] = "OperationDefinition";
  Kind2["VARIABLE_DEFINITION"] = "VariableDefinition";
  Kind2["SELECTION_SET"] = "SelectionSet";
  Kind2["FIELD"] = "Field";
  Kind2["ARGUMENT"] = "Argument";
  Kind2["FRAGMENT_SPREAD"] = "FragmentSpread";
  Kind2["INLINE_FRAGMENT"] = "InlineFragment";
  Kind2["FRAGMENT_DEFINITION"] = "FragmentDefinition";
  Kind2["VARIABLE"] = "Variable";
  Kind2["INT"] = "IntValue";
  Kind2["FLOAT"] = "FloatValue";
  Kind2["STRING"] = "StringValue";
  Kind2["BOOLEAN"] = "BooleanValue";
  Kind2["NULL"] = "NullValue";
  Kind2["ENUM"] = "EnumValue";
  Kind2["LIST"] = "ListValue";
  Kind2["OBJECT"] = "ObjectValue";
  Kind2["OBJECT_FIELD"] = "ObjectField";
  Kind2["DIRECTIVE"] = "Directive";
  Kind2["NAMED_TYPE"] = "NamedType";
  Kind2["LIST_TYPE"] = "ListType";
  Kind2["NON_NULL_TYPE"] = "NonNullType";
  Kind2["SCHEMA_DEFINITION"] = "SchemaDefinition";
  Kind2["OPERATION_TYPE_DEFINITION"] = "OperationTypeDefinition";
  Kind2["SCALAR_TYPE_DEFINITION"] = "ScalarTypeDefinition";
  Kind2["OBJECT_TYPE_DEFINITION"] = "ObjectTypeDefinition";
  Kind2["FIELD_DEFINITION"] = "FieldDefinition";
  Kind2["INPUT_VALUE_DEFINITION"] = "InputValueDefinition";
  Kind2["INTERFACE_TYPE_DEFINITION"] = "InterfaceTypeDefinition";
  Kind2["UNION_TYPE_DEFINITION"] = "UnionTypeDefinition";
  Kind2["ENUM_TYPE_DEFINITION"] = "EnumTypeDefinition";
  Kind2["ENUM_VALUE_DEFINITION"] = "EnumValueDefinition";
  Kind2["INPUT_OBJECT_TYPE_DEFINITION"] = "InputObjectTypeDefinition";
  Kind2["DIRECTIVE_DEFINITION"] = "DirectiveDefinition";
  Kind2["SCHEMA_EXTENSION"] = "SchemaExtension";
  Kind2["SCALAR_TYPE_EXTENSION"] = "ScalarTypeExtension";
  Kind2["OBJECT_TYPE_EXTENSION"] = "ObjectTypeExtension";
  Kind2["INTERFACE_TYPE_EXTENSION"] = "InterfaceTypeExtension";
  Kind2["UNION_TYPE_EXTENSION"] = "UnionTypeExtension";
  Kind2["ENUM_TYPE_EXTENSION"] = "EnumTypeExtension";
  Kind2["INPUT_OBJECT_TYPE_EXTENSION"] = "InputObjectTypeExtension";
})(Kind || (Kind = {}));
function isWhiteSpace(code) {
  return code === 9 || code === 32;
}
function isDigit$1(code) {
  return code >= 48 && code <= 57;
}
function isLetter(code) {
  return code >= 97 && code <= 122 || code >= 65 && code <= 90;
}
function isNameStart(code) {
  return isLetter(code) || code === 95;
}
function isNameContinue(code) {
  return isLetter(code) || isDigit$1(code) || code === 95;
}
function dedentBlockStringLines(lines) {
  var _firstNonEmptyLine2;
  let commonIndent = Number.MAX_SAFE_INTEGER;
  let firstNonEmptyLine = null;
  let lastNonEmptyLine = -1;
  for (let i = 0; i < lines.length; ++i) {
    var _firstNonEmptyLine;
    const line = lines[i];
    const indent2 = leadingWhitespace(line);
    if (indent2 === line.length) {
      continue;
    }
    firstNonEmptyLine = (_firstNonEmptyLine = firstNonEmptyLine) !== null && _firstNonEmptyLine !== void 0 ? _firstNonEmptyLine : i;
    lastNonEmptyLine = i;
    if (i !== 0 && indent2 < commonIndent) {
      commonIndent = indent2;
    }
  }
  return lines.map((line, i) => i === 0 ? line : line.slice(commonIndent)).slice(
    (_firstNonEmptyLine2 = firstNonEmptyLine) !== null && _firstNonEmptyLine2 !== void 0 ? _firstNonEmptyLine2 : 0,
    lastNonEmptyLine + 1
  );
}
function leadingWhitespace(str) {
  let i = 0;
  while (i < str.length && isWhiteSpace(str.charCodeAt(i))) {
    ++i;
  }
  return i;
}
function isPrintableAsBlockString(value) {
  if (value === "") {
    return true;
  }
  let isEmptyLine = true;
  let hasIndent = false;
  let hasCommonIndent = true;
  let seenNonEmptyLine = false;
  for (let i = 0; i < value.length; ++i) {
    switch (value.codePointAt(i)) {
      case 0:
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
      case 6:
      case 7:
      case 8:
      case 11:
      case 12:
      case 14:
      case 15:
        return false;
      case 13:
        return false;
      case 10:
        if (isEmptyLine && !seenNonEmptyLine) {
          return false;
        }
        seenNonEmptyLine = true;
        isEmptyLine = true;
        hasIndent = false;
        break;
      case 9:
      case 32:
        hasIndent || (hasIndent = isEmptyLine);
        break;
      default:
        hasCommonIndent && (hasCommonIndent = hasIndent);
        isEmptyLine = false;
    }
  }
  if (isEmptyLine) {
    return false;
  }
  if (hasCommonIndent && seenNonEmptyLine) {
    return false;
  }
  return true;
}
function printBlockString(value, options) {
  const escapedValue = value.replace(/"""/g, '\\"""');
  const lines = escapedValue.split(/\r\n|[\n\r]/g);
  const isSingleLine = lines.length === 1;
  const forceLeadingNewLine = lines.length > 1 && lines.slice(1).every((line) => line.length === 0 || isWhiteSpace(line.charCodeAt(0)));
  const hasTrailingTripleQuotes = escapedValue.endsWith('\\"""');
  const hasTrailingQuote = value.endsWith('"') && !hasTrailingTripleQuotes;
  const hasTrailingSlash = value.endsWith("\\");
  const forceTrailingNewline = hasTrailingQuote || hasTrailingSlash;
  const printAsMultipleLines = !(options !== null && options !== void 0 && options.minimize) && (!isSingleLine || value.length > 70 || forceTrailingNewline || forceLeadingNewLine || hasTrailingTripleQuotes);
  let result = "";
  const skipLeadingNewLine = isSingleLine && isWhiteSpace(value.charCodeAt(0));
  if (printAsMultipleLines && !skipLeadingNewLine || forceLeadingNewLine) {
    result += "\n";
  }
  result += escapedValue;
  if (printAsMultipleLines || forceTrailingNewline) {
    result += "\n";
  }
  return '"""' + result + '"""';
}
var TokenKind;
(function(TokenKind2) {
  TokenKind2["SOF"] = "<SOF>";
  TokenKind2["EOF"] = "<EOF>";
  TokenKind2["BANG"] = "!";
  TokenKind2["DOLLAR"] = "$";
  TokenKind2["AMP"] = "&";
  TokenKind2["PAREN_L"] = "(";
  TokenKind2["PAREN_R"] = ")";
  TokenKind2["SPREAD"] = "...";
  TokenKind2["COLON"] = ":";
  TokenKind2["EQUALS"] = "=";
  TokenKind2["AT"] = "@";
  TokenKind2["BRACKET_L"] = "[";
  TokenKind2["BRACKET_R"] = "]";
  TokenKind2["BRACE_L"] = "{";
  TokenKind2["PIPE"] = "|";
  TokenKind2["BRACE_R"] = "}";
  TokenKind2["NAME"] = "Name";
  TokenKind2["INT"] = "Int";
  TokenKind2["FLOAT"] = "Float";
  TokenKind2["STRING"] = "String";
  TokenKind2["BLOCK_STRING"] = "BlockString";
  TokenKind2["COMMENT"] = "Comment";
})(TokenKind || (TokenKind = {}));
class Lexer {
  constructor(source) {
    const startOfFileToken = new Token(TokenKind.SOF, 0, 0, 0, 0);
    this.source = source;
    this.lastToken = startOfFileToken;
    this.token = startOfFileToken;
    this.line = 1;
    this.lineStart = 0;
  }
  get [Symbol.toStringTag]() {
    return "Lexer";
  }
  advance() {
    this.lastToken = this.token;
    const token = this.token = this.lookahead();
    return token;
  }
  lookahead() {
    let token = this.token;
    if (token.kind !== TokenKind.EOF) {
      do {
        if (token.next) {
          token = token.next;
        } else {
          const nextToken = readNextToken(this, token.end);
          token.next = nextToken;
          nextToken.prev = token;
          token = nextToken;
        }
      } while (token.kind === TokenKind.COMMENT);
    }
    return token;
  }
}
function isPunctuatorTokenKind(kind) {
  return kind === TokenKind.BANG || kind === TokenKind.DOLLAR || kind === TokenKind.AMP || kind === TokenKind.PAREN_L || kind === TokenKind.PAREN_R || kind === TokenKind.SPREAD || kind === TokenKind.COLON || kind === TokenKind.EQUALS || kind === TokenKind.AT || kind === TokenKind.BRACKET_L || kind === TokenKind.BRACKET_R || kind === TokenKind.BRACE_L || kind === TokenKind.PIPE || kind === TokenKind.BRACE_R;
}
function isUnicodeScalarValue(code) {
  return code >= 0 && code <= 55295 || code >= 57344 && code <= 1114111;
}
function isSupplementaryCodePoint(body2, location2) {
  return isLeadingSurrogate(body2.charCodeAt(location2)) && isTrailingSurrogate(body2.charCodeAt(location2 + 1));
}
function isLeadingSurrogate(code) {
  return code >= 55296 && code <= 56319;
}
function isTrailingSurrogate(code) {
  return code >= 56320 && code <= 57343;
}
function printCodePointAt(lexer2, location2) {
  const code = lexer2.source.body.codePointAt(location2);
  if (code === void 0) {
    return TokenKind.EOF;
  } else if (code >= 32 && code <= 126) {
    const char = String.fromCodePoint(code);
    return char === '"' ? `'"'` : `"${char}"`;
  }
  return "U+" + code.toString(16).toUpperCase().padStart(4, "0");
}
function createToken(lexer2, kind, start, end, value) {
  const line = lexer2.line;
  const col = 1 + start - lexer2.lineStart;
  return new Token(kind, start, end, line, col, value);
}
function readNextToken(lexer2, start) {
  const body2 = lexer2.source.body;
  const bodyLength = body2.length;
  let position = start;
  while (position < bodyLength) {
    const code = body2.charCodeAt(position);
    switch (code) {
      case 65279:
      case 9:
      case 32:
      case 44:
        ++position;
        continue;
      case 10:
        ++position;
        ++lexer2.line;
        lexer2.lineStart = position;
        continue;
      case 13:
        if (body2.charCodeAt(position + 1) === 10) {
          position += 2;
        } else {
          ++position;
        }
        ++lexer2.line;
        lexer2.lineStart = position;
        continue;
      case 35:
        return readComment(lexer2, position);
      case 33:
        return createToken(lexer2, TokenKind.BANG, position, position + 1);
      case 36:
        return createToken(lexer2, TokenKind.DOLLAR, position, position + 1);
      case 38:
        return createToken(lexer2, TokenKind.AMP, position, position + 1);
      case 40:
        return createToken(lexer2, TokenKind.PAREN_L, position, position + 1);
      case 41:
        return createToken(lexer2, TokenKind.PAREN_R, position, position + 1);
      case 46:
        if (body2.charCodeAt(position + 1) === 46 && body2.charCodeAt(position + 2) === 46) {
          return createToken(lexer2, TokenKind.SPREAD, position, position + 3);
        }
        break;
      case 58:
        return createToken(lexer2, TokenKind.COLON, position, position + 1);
      case 61:
        return createToken(lexer2, TokenKind.EQUALS, position, position + 1);
      case 64:
        return createToken(lexer2, TokenKind.AT, position, position + 1);
      case 91:
        return createToken(lexer2, TokenKind.BRACKET_L, position, position + 1);
      case 93:
        return createToken(lexer2, TokenKind.BRACKET_R, position, position + 1);
      case 123:
        return createToken(lexer2, TokenKind.BRACE_L, position, position + 1);
      case 124:
        return createToken(lexer2, TokenKind.PIPE, position, position + 1);
      case 125:
        return createToken(lexer2, TokenKind.BRACE_R, position, position + 1);
      case 34:
        if (body2.charCodeAt(position + 1) === 34 && body2.charCodeAt(position + 2) === 34) {
          return readBlockString(lexer2, position);
        }
        return readString(lexer2, position);
    }
    if (isDigit$1(code) || code === 45) {
      return readNumber(lexer2, position, code);
    }
    if (isNameStart(code)) {
      return readName(lexer2, position);
    }
    throw syntaxError(
      lexer2.source,
      position,
      code === 39 ? `Unexpected single quote character ('), did you mean to use a double quote (")?` : isUnicodeScalarValue(code) || isSupplementaryCodePoint(body2, position) ? `Unexpected character: ${printCodePointAt(lexer2, position)}.` : `Invalid character: ${printCodePointAt(lexer2, position)}.`
    );
  }
  return createToken(lexer2, TokenKind.EOF, bodyLength, bodyLength);
}
function readComment(lexer2, start) {
  const body2 = lexer2.source.body;
  const bodyLength = body2.length;
  let position = start + 1;
  while (position < bodyLength) {
    const code = body2.charCodeAt(position);
    if (code === 10 || code === 13) {
      break;
    }
    if (isUnicodeScalarValue(code)) {
      ++position;
    } else if (isSupplementaryCodePoint(body2, position)) {
      position += 2;
    } else {
      break;
    }
  }
  return createToken(
    lexer2,
    TokenKind.COMMENT,
    start,
    position,
    body2.slice(start + 1, position)
  );
}
function readNumber(lexer2, start, firstCode) {
  const body2 = lexer2.source.body;
  let position = start;
  let code = firstCode;
  let isFloat = false;
  if (code === 45) {
    code = body2.charCodeAt(++position);
  }
  if (code === 48) {
    code = body2.charCodeAt(++position);
    if (isDigit$1(code)) {
      throw syntaxError(
        lexer2.source,
        position,
        `Invalid number, unexpected digit after 0: ${printCodePointAt(
          lexer2,
          position
        )}.`
      );
    }
  } else {
    position = readDigits(lexer2, position, code);
    code = body2.charCodeAt(position);
  }
  if (code === 46) {
    isFloat = true;
    code = body2.charCodeAt(++position);
    position = readDigits(lexer2, position, code);
    code = body2.charCodeAt(position);
  }
  if (code === 69 || code === 101) {
    isFloat = true;
    code = body2.charCodeAt(++position);
    if (code === 43 || code === 45) {
      code = body2.charCodeAt(++position);
    }
    position = readDigits(lexer2, position, code);
    code = body2.charCodeAt(position);
  }
  if (code === 46 || isNameStart(code)) {
    throw syntaxError(
      lexer2.source,
      position,
      `Invalid number, expected digit but got: ${printCodePointAt(
        lexer2,
        position
      )}.`
    );
  }
  return createToken(
    lexer2,
    isFloat ? TokenKind.FLOAT : TokenKind.INT,
    start,
    position,
    body2.slice(start, position)
  );
}
function readDigits(lexer2, start, firstCode) {
  if (!isDigit$1(firstCode)) {
    throw syntaxError(
      lexer2.source,
      start,
      `Invalid number, expected digit but got: ${printCodePointAt(
        lexer2,
        start
      )}.`
    );
  }
  const body2 = lexer2.source.body;
  let position = start + 1;
  while (isDigit$1(body2.charCodeAt(position))) {
    ++position;
  }
  return position;
}
function readString(lexer2, start) {
  const body2 = lexer2.source.body;
  const bodyLength = body2.length;
  let position = start + 1;
  let chunkStart = position;
  let value = "";
  while (position < bodyLength) {
    const code = body2.charCodeAt(position);
    if (code === 34) {
      value += body2.slice(chunkStart, position);
      return createToken(lexer2, TokenKind.STRING, start, position + 1, value);
    }
    if (code === 92) {
      value += body2.slice(chunkStart, position);
      const escape = body2.charCodeAt(position + 1) === 117 ? body2.charCodeAt(position + 2) === 123 ? readEscapedUnicodeVariableWidth(lexer2, position) : readEscapedUnicodeFixedWidth(lexer2, position) : readEscapedCharacter(lexer2, position);
      value += escape.value;
      position += escape.size;
      chunkStart = position;
      continue;
    }
    if (code === 10 || code === 13) {
      break;
    }
    if (isUnicodeScalarValue(code)) {
      ++position;
    } else if (isSupplementaryCodePoint(body2, position)) {
      position += 2;
    } else {
      throw syntaxError(
        lexer2.source,
        position,
        `Invalid character within String: ${printCodePointAt(
          lexer2,
          position
        )}.`
      );
    }
  }
  throw syntaxError(lexer2.source, position, "Unterminated string.");
}
function readEscapedUnicodeVariableWidth(lexer2, position) {
  const body2 = lexer2.source.body;
  let point = 0;
  let size = 3;
  while (size < 12) {
    const code = body2.charCodeAt(position + size++);
    if (code === 125) {
      if (size < 5 || !isUnicodeScalarValue(point)) {
        break;
      }
      return {
        value: String.fromCodePoint(point),
        size
      };
    }
    point = point << 4 | readHexDigit(code);
    if (point < 0) {
      break;
    }
  }
  throw syntaxError(
    lexer2.source,
    position,
    `Invalid Unicode escape sequence: "${body2.slice(
      position,
      position + size
    )}".`
  );
}
function readEscapedUnicodeFixedWidth(lexer2, position) {
  const body2 = lexer2.source.body;
  const code = read16BitHexCode(body2, position + 2);
  if (isUnicodeScalarValue(code)) {
    return {
      value: String.fromCodePoint(code),
      size: 6
    };
  }
  if (isLeadingSurrogate(code)) {
    if (body2.charCodeAt(position + 6) === 92 && body2.charCodeAt(position + 7) === 117) {
      const trailingCode = read16BitHexCode(body2, position + 8);
      if (isTrailingSurrogate(trailingCode)) {
        return {
          value: String.fromCodePoint(code, trailingCode),
          size: 12
        };
      }
    }
  }
  throw syntaxError(
    lexer2.source,
    position,
    `Invalid Unicode escape sequence: "${body2.slice(position, position + 6)}".`
  );
}
function read16BitHexCode(body2, position) {
  return readHexDigit(body2.charCodeAt(position)) << 12 | readHexDigit(body2.charCodeAt(position + 1)) << 8 | readHexDigit(body2.charCodeAt(position + 2)) << 4 | readHexDigit(body2.charCodeAt(position + 3));
}
function readHexDigit(code) {
  return code >= 48 && code <= 57 ? code - 48 : code >= 65 && code <= 70 ? code - 55 : code >= 97 && code <= 102 ? code - 87 : -1;
}
function readEscapedCharacter(lexer2, position) {
  const body2 = lexer2.source.body;
  const code = body2.charCodeAt(position + 1);
  switch (code) {
    case 34:
      return {
        value: '"',
        size: 2
      };
    case 92:
      return {
        value: "\\",
        size: 2
      };
    case 47:
      return {
        value: "/",
        size: 2
      };
    case 98:
      return {
        value: "\b",
        size: 2
      };
    case 102:
      return {
        value: "\f",
        size: 2
      };
    case 110:
      return {
        value: "\n",
        size: 2
      };
    case 114:
      return {
        value: "\r",
        size: 2
      };
    case 116:
      return {
        value: "	",
        size: 2
      };
  }
  throw syntaxError(
    lexer2.source,
    position,
    `Invalid character escape sequence: "${body2.slice(
      position,
      position + 2
    )}".`
  );
}
function readBlockString(lexer2, start) {
  const body2 = lexer2.source.body;
  const bodyLength = body2.length;
  let lineStart = lexer2.lineStart;
  let position = start + 3;
  let chunkStart = position;
  let currentLine = "";
  const blockLines = [];
  while (position < bodyLength) {
    const code = body2.charCodeAt(position);
    if (code === 34 && body2.charCodeAt(position + 1) === 34 && body2.charCodeAt(position + 2) === 34) {
      currentLine += body2.slice(chunkStart, position);
      blockLines.push(currentLine);
      const token = createToken(
        lexer2,
        TokenKind.BLOCK_STRING,
        start,
        position + 3,
        dedentBlockStringLines(blockLines).join("\n")
      );
      lexer2.line += blockLines.length - 1;
      lexer2.lineStart = lineStart;
      return token;
    }
    if (code === 92 && body2.charCodeAt(position + 1) === 34 && body2.charCodeAt(position + 2) === 34 && body2.charCodeAt(position + 3) === 34) {
      currentLine += body2.slice(chunkStart, position);
      chunkStart = position + 1;
      position += 4;
      continue;
    }
    if (code === 10 || code === 13) {
      currentLine += body2.slice(chunkStart, position);
      blockLines.push(currentLine);
      if (code === 13 && body2.charCodeAt(position + 1) === 10) {
        position += 2;
      } else {
        ++position;
      }
      currentLine = "";
      chunkStart = position;
      lineStart = position;
      continue;
    }
    if (isUnicodeScalarValue(code)) {
      ++position;
    } else if (isSupplementaryCodePoint(body2, position)) {
      position += 2;
    } else {
      throw syntaxError(
        lexer2.source,
        position,
        `Invalid character within String: ${printCodePointAt(
          lexer2,
          position
        )}.`
      );
    }
  }
  throw syntaxError(lexer2.source, position, "Unterminated string.");
}
function readName(lexer2, start) {
  const body2 = lexer2.source.body;
  const bodyLength = body2.length;
  let position = start + 1;
  while (position < bodyLength) {
    const code = body2.charCodeAt(position);
    if (isNameContinue(code)) {
      ++position;
    } else {
      break;
    }
  }
  return createToken(
    lexer2,
    TokenKind.NAME,
    start,
    position,
    body2.slice(start, position)
  );
}
const MAX_ARRAY_LENGTH = 10;
const MAX_RECURSIVE_DEPTH = 2;
function inspect(value) {
  return formatValue(value, []);
}
function formatValue(value, seenValues) {
  switch (typeof value) {
    case "string":
      return JSON.stringify(value);
    case "function":
      return value.name ? `[function ${value.name}]` : "[function]";
    case "object":
      return formatObjectValue(value, seenValues);
    default:
      return String(value);
  }
}
function formatObjectValue(value, previouslySeenValues) {
  if (value === null) {
    return "null";
  }
  if (previouslySeenValues.includes(value)) {
    return "[Circular]";
  }
  const seenValues = [...previouslySeenValues, value];
  if (isJSONable(value)) {
    const jsonValue = value.toJSON();
    if (jsonValue !== value) {
      return typeof jsonValue === "string" ? jsonValue : formatValue(jsonValue, seenValues);
    }
  } else if (Array.isArray(value)) {
    return formatArray(value, seenValues);
  }
  return formatObject(value, seenValues);
}
function isJSONable(value) {
  return typeof value.toJSON === "function";
}
function formatObject(object, seenValues) {
  const entries = Object.entries(object);
  if (entries.length === 0) {
    return "{}";
  }
  if (seenValues.length > MAX_RECURSIVE_DEPTH) {
    return "[" + getObjectTag(object) + "]";
  }
  const properties = entries.map(
    ([key, value]) => key + ": " + formatValue(value, seenValues)
  );
  return "{ " + properties.join(", ") + " }";
}
function formatArray(array, seenValues) {
  if (array.length === 0) {
    return "[]";
  }
  if (seenValues.length > MAX_RECURSIVE_DEPTH) {
    return "[Array]";
  }
  const len = Math.min(MAX_ARRAY_LENGTH, array.length);
  const remaining = array.length - len;
  const items = [];
  for (let i = 0; i < len; ++i) {
    items.push(formatValue(array[i], seenValues));
  }
  if (remaining === 1) {
    items.push("... 1 more item");
  } else if (remaining > 1) {
    items.push(`... ${remaining} more items`);
  }
  return "[" + items.join(", ") + "]";
}
function getObjectTag(object) {
  const tag = Object.prototype.toString.call(object).replace(/^\[object /, "").replace(/]$/, "");
  if (tag === "Object" && typeof object.constructor === "function") {
    const name = object.constructor.name;
    if (typeof name === "string" && name !== "") {
      return name;
    }
  }
  return tag;
}
const instanceOf = {}.NODE_ENV === "production" ? function instanceOf2(value, constructor) {
  return value instanceof constructor;
} : function instanceOf3(value, constructor) {
  if (value instanceof constructor) {
    return true;
  }
  if (typeof value === "object" && value !== null) {
    var _value$constructor;
    const className = constructor.prototype[Symbol.toStringTag];
    const valueClassName = Symbol.toStringTag in value ? value[Symbol.toStringTag] : (_value$constructor = value.constructor) === null || _value$constructor === void 0 ? void 0 : _value$constructor.name;
    if (className === valueClassName) {
      const stringifiedValue = inspect(value);
      throw new Error(`Cannot use ${className} "${stringifiedValue}" from another module or realm.

Ensure that there is only one instance of "graphql" in the node_modules
directory. If different versions of "graphql" are the dependencies of other
relied on modules, use "resolutions" to ensure only one version is installed.

https://yarnpkg.com/en/docs/selective-version-resolutions

Duplicate "graphql" modules cannot be used at the same time since different
versions may have different capabilities and behavior. The data from one
version used in the function from another could produce confusing and
spurious results.`);
    }
  }
  return false;
};
class Source {
  constructor(body2, name = "GraphQL request", locationOffset = {
    line: 1,
    column: 1
  }) {
    typeof body2 === "string" || devAssert(false, `Body must be a string. Received: ${inspect(body2)}.`);
    this.body = body2;
    this.name = name;
    this.locationOffset = locationOffset;
    this.locationOffset.line > 0 || devAssert(
      false,
      "line in locationOffset is 1-indexed and must be positive."
    );
    this.locationOffset.column > 0 || devAssert(
      false,
      "column in locationOffset is 1-indexed and must be positive."
    );
  }
  get [Symbol.toStringTag]() {
    return "Source";
  }
}
function isSource(source) {
  return instanceOf(source, Source);
}
function parse$1(source, options) {
  const parser = new Parser(source, options);
  return parser.parseDocument();
}
function parseValue(source, options) {
  const parser = new Parser(source, options);
  parser.expectToken(TokenKind.SOF);
  const value = parser.parseValueLiteral(false);
  parser.expectToken(TokenKind.EOF);
  return value;
}
function parseConstValue(source, options) {
  const parser = new Parser(source, options);
  parser.expectToken(TokenKind.SOF);
  const value = parser.parseConstValueLiteral();
  parser.expectToken(TokenKind.EOF);
  return value;
}
function parseType(source, options) {
  const parser = new Parser(source, options);
  parser.expectToken(TokenKind.SOF);
  const type = parser.parseTypeReference();
  parser.expectToken(TokenKind.EOF);
  return type;
}
class Parser {
  constructor(source, options = {}) {
    const sourceObj = isSource(source) ? source : new Source(source);
    this._lexer = new Lexer(sourceObj);
    this._options = options;
    this._tokenCounter = 0;
  }
  parseName() {
    const token = this.expectToken(TokenKind.NAME);
    return this.node(token, {
      kind: Kind.NAME,
      value: token.value
    });
  }
  parseDocument() {
    return this.node(this._lexer.token, {
      kind: Kind.DOCUMENT,
      definitions: this.many(
        TokenKind.SOF,
        this.parseDefinition,
        TokenKind.EOF
      )
    });
  }
  parseDefinition() {
    if (this.peek(TokenKind.BRACE_L)) {
      return this.parseOperationDefinition();
    }
    const hasDescription = this.peekDescription();
    const keywordToken = hasDescription ? this._lexer.lookahead() : this._lexer.token;
    if (keywordToken.kind === TokenKind.NAME) {
      switch (keywordToken.value) {
        case "schema":
          return this.parseSchemaDefinition();
        case "scalar":
          return this.parseScalarTypeDefinition();
        case "type":
          return this.parseObjectTypeDefinition();
        case "interface":
          return this.parseInterfaceTypeDefinition();
        case "union":
          return this.parseUnionTypeDefinition();
        case "enum":
          return this.parseEnumTypeDefinition();
        case "input":
          return this.parseInputObjectTypeDefinition();
        case "directive":
          return this.parseDirectiveDefinition();
      }
      if (hasDescription) {
        throw syntaxError(
          this._lexer.source,
          this._lexer.token.start,
          "Unexpected description, descriptions are supported only on type definitions."
        );
      }
      switch (keywordToken.value) {
        case "query":
        case "mutation":
        case "subscription":
          return this.parseOperationDefinition();
        case "fragment":
          return this.parseFragmentDefinition();
        case "extend":
          return this.parseTypeSystemExtension();
      }
    }
    throw this.unexpected(keywordToken);
  }
  parseOperationDefinition() {
    const start = this._lexer.token;
    if (this.peek(TokenKind.BRACE_L)) {
      return this.node(start, {
        kind: Kind.OPERATION_DEFINITION,
        operation: OperationTypeNode.QUERY,
        name: void 0,
        variableDefinitions: [],
        directives: [],
        selectionSet: this.parseSelectionSet()
      });
    }
    const operation = this.parseOperationType();
    let name;
    if (this.peek(TokenKind.NAME)) {
      name = this.parseName();
    }
    return this.node(start, {
      kind: Kind.OPERATION_DEFINITION,
      operation,
      name,
      variableDefinitions: this.parseVariableDefinitions(),
      directives: this.parseDirectives(false),
      selectionSet: this.parseSelectionSet()
    });
  }
  parseOperationType() {
    const operationToken = this.expectToken(TokenKind.NAME);
    switch (operationToken.value) {
      case "query":
        return OperationTypeNode.QUERY;
      case "mutation":
        return OperationTypeNode.MUTATION;
      case "subscription":
        return OperationTypeNode.SUBSCRIPTION;
    }
    throw this.unexpected(operationToken);
  }
  parseVariableDefinitions() {
    return this.optionalMany(
      TokenKind.PAREN_L,
      this.parseVariableDefinition,
      TokenKind.PAREN_R
    );
  }
  parseVariableDefinition() {
    return this.node(this._lexer.token, {
      kind: Kind.VARIABLE_DEFINITION,
      variable: this.parseVariable(),
      type: (this.expectToken(TokenKind.COLON), this.parseTypeReference()),
      defaultValue: this.expectOptionalToken(TokenKind.EQUALS) ? this.parseConstValueLiteral() : void 0,
      directives: this.parseConstDirectives()
    });
  }
  parseVariable() {
    const start = this._lexer.token;
    this.expectToken(TokenKind.DOLLAR);
    return this.node(start, {
      kind: Kind.VARIABLE,
      name: this.parseName()
    });
  }
  parseSelectionSet() {
    return this.node(this._lexer.token, {
      kind: Kind.SELECTION_SET,
      selections: this.many(
        TokenKind.BRACE_L,
        this.parseSelection,
        TokenKind.BRACE_R
      )
    });
  }
  parseSelection() {
    return this.peek(TokenKind.SPREAD) ? this.parseFragment() : this.parseField();
  }
  parseField() {
    const start = this._lexer.token;
    const nameOrAlias = this.parseName();
    let alias;
    let name;
    if (this.expectOptionalToken(TokenKind.COLON)) {
      alias = nameOrAlias;
      name = this.parseName();
    } else {
      name = nameOrAlias;
    }
    return this.node(start, {
      kind: Kind.FIELD,
      alias,
      name,
      arguments: this.parseArguments(false),
      directives: this.parseDirectives(false),
      selectionSet: this.peek(TokenKind.BRACE_L) ? this.parseSelectionSet() : void 0
    });
  }
  parseArguments(isConst) {
    const item = isConst ? this.parseConstArgument : this.parseArgument;
    return this.optionalMany(TokenKind.PAREN_L, item, TokenKind.PAREN_R);
  }
  parseArgument(isConst = false) {
    const start = this._lexer.token;
    const name = this.parseName();
    this.expectToken(TokenKind.COLON);
    return this.node(start, {
      kind: Kind.ARGUMENT,
      name,
      value: this.parseValueLiteral(isConst)
    });
  }
  parseConstArgument() {
    return this.parseArgument(true);
  }
  parseFragment() {
    const start = this._lexer.token;
    this.expectToken(TokenKind.SPREAD);
    const hasTypeCondition = this.expectOptionalKeyword("on");
    if (!hasTypeCondition && this.peek(TokenKind.NAME)) {
      return this.node(start, {
        kind: Kind.FRAGMENT_SPREAD,
        name: this.parseFragmentName(),
        directives: this.parseDirectives(false)
      });
    }
    return this.node(start, {
      kind: Kind.INLINE_FRAGMENT,
      typeCondition: hasTypeCondition ? this.parseNamedType() : void 0,
      directives: this.parseDirectives(false),
      selectionSet: this.parseSelectionSet()
    });
  }
  parseFragmentDefinition() {
    const start = this._lexer.token;
    this.expectKeyword("fragment");
    if (this._options.allowLegacyFragmentVariables === true) {
      return this.node(start, {
        kind: Kind.FRAGMENT_DEFINITION,
        name: this.parseFragmentName(),
        variableDefinitions: this.parseVariableDefinitions(),
        typeCondition: (this.expectKeyword("on"), this.parseNamedType()),
        directives: this.parseDirectives(false),
        selectionSet: this.parseSelectionSet()
      });
    }
    return this.node(start, {
      kind: Kind.FRAGMENT_DEFINITION,
      name: this.parseFragmentName(),
      typeCondition: (this.expectKeyword("on"), this.parseNamedType()),
      directives: this.parseDirectives(false),
      selectionSet: this.parseSelectionSet()
    });
  }
  parseFragmentName() {
    if (this._lexer.token.value === "on") {
      throw this.unexpected();
    }
    return this.parseName();
  }
  parseValueLiteral(isConst) {
    const token = this._lexer.token;
    switch (token.kind) {
      case TokenKind.BRACKET_L:
        return this.parseList(isConst);
      case TokenKind.BRACE_L:
        return this.parseObject(isConst);
      case TokenKind.INT:
        this.advanceLexer();
        return this.node(token, {
          kind: Kind.INT,
          value: token.value
        });
      case TokenKind.FLOAT:
        this.advanceLexer();
        return this.node(token, {
          kind: Kind.FLOAT,
          value: token.value
        });
      case TokenKind.STRING:
      case TokenKind.BLOCK_STRING:
        return this.parseStringLiteral();
      case TokenKind.NAME:
        this.advanceLexer();
        switch (token.value) {
          case "true":
            return this.node(token, {
              kind: Kind.BOOLEAN,
              value: true
            });
          case "false":
            return this.node(token, {
              kind: Kind.BOOLEAN,
              value: false
            });
          case "null":
            return this.node(token, {
              kind: Kind.NULL
            });
          default:
            return this.node(token, {
              kind: Kind.ENUM,
              value: token.value
            });
        }
      case TokenKind.DOLLAR:
        if (isConst) {
          this.expectToken(TokenKind.DOLLAR);
          if (this._lexer.token.kind === TokenKind.NAME) {
            const varName = this._lexer.token.value;
            throw syntaxError(
              this._lexer.source,
              token.start,
              `Unexpected variable "$${varName}" in constant value.`
            );
          } else {
            throw this.unexpected(token);
          }
        }
        return this.parseVariable();
      default:
        throw this.unexpected();
    }
  }
  parseConstValueLiteral() {
    return this.parseValueLiteral(true);
  }
  parseStringLiteral() {
    const token = this._lexer.token;
    this.advanceLexer();
    return this.node(token, {
      kind: Kind.STRING,
      value: token.value,
      block: token.kind === TokenKind.BLOCK_STRING
    });
  }
  parseList(isConst) {
    const item = () => this.parseValueLiteral(isConst);
    return this.node(this._lexer.token, {
      kind: Kind.LIST,
      values: this.any(TokenKind.BRACKET_L, item, TokenKind.BRACKET_R)
    });
  }
  parseObject(isConst) {
    const item = () => this.parseObjectField(isConst);
    return this.node(this._lexer.token, {
      kind: Kind.OBJECT,
      fields: this.any(TokenKind.BRACE_L, item, TokenKind.BRACE_R)
    });
  }
  parseObjectField(isConst) {
    const start = this._lexer.token;
    const name = this.parseName();
    this.expectToken(TokenKind.COLON);
    return this.node(start, {
      kind: Kind.OBJECT_FIELD,
      name,
      value: this.parseValueLiteral(isConst)
    });
  }
  parseDirectives(isConst) {
    const directives = [];
    while (this.peek(TokenKind.AT)) {
      directives.push(this.parseDirective(isConst));
    }
    return directives;
  }
  parseConstDirectives() {
    return this.parseDirectives(true);
  }
  parseDirective(isConst) {
    const start = this._lexer.token;
    this.expectToken(TokenKind.AT);
    return this.node(start, {
      kind: Kind.DIRECTIVE,
      name: this.parseName(),
      arguments: this.parseArguments(isConst)
    });
  }
  parseTypeReference() {
    const start = this._lexer.token;
    let type;
    if (this.expectOptionalToken(TokenKind.BRACKET_L)) {
      const innerType = this.parseTypeReference();
      this.expectToken(TokenKind.BRACKET_R);
      type = this.node(start, {
        kind: Kind.LIST_TYPE,
        type: innerType
      });
    } else {
      type = this.parseNamedType();
    }
    if (this.expectOptionalToken(TokenKind.BANG)) {
      return this.node(start, {
        kind: Kind.NON_NULL_TYPE,
        type
      });
    }
    return type;
  }
  parseNamedType() {
    return this.node(this._lexer.token, {
      kind: Kind.NAMED_TYPE,
      name: this.parseName()
    });
  }
  peekDescription() {
    return this.peek(TokenKind.STRING) || this.peek(TokenKind.BLOCK_STRING);
  }
  parseDescription() {
    if (this.peekDescription()) {
      return this.parseStringLiteral();
    }
  }
  parseSchemaDefinition() {
    const start = this._lexer.token;
    const description = this.parseDescription();
    this.expectKeyword("schema");
    const directives = this.parseConstDirectives();
    const operationTypes = this.many(
      TokenKind.BRACE_L,
      this.parseOperationTypeDefinition,
      TokenKind.BRACE_R
    );
    return this.node(start, {
      kind: Kind.SCHEMA_DEFINITION,
      description,
      directives,
      operationTypes
    });
  }
  parseOperationTypeDefinition() {
    const start = this._lexer.token;
    const operation = this.parseOperationType();
    this.expectToken(TokenKind.COLON);
    const type = this.parseNamedType();
    return this.node(start, {
      kind: Kind.OPERATION_TYPE_DEFINITION,
      operation,
      type
    });
  }
  parseScalarTypeDefinition() {
    const start = this._lexer.token;
    const description = this.parseDescription();
    this.expectKeyword("scalar");
    const name = this.parseName();
    const directives = this.parseConstDirectives();
    return this.node(start, {
      kind: Kind.SCALAR_TYPE_DEFINITION,
      description,
      name,
      directives
    });
  }
  parseObjectTypeDefinition() {
    const start = this._lexer.token;
    const description = this.parseDescription();
    this.expectKeyword("type");
    const name = this.parseName();
    const interfaces = this.parseImplementsInterfaces();
    const directives = this.parseConstDirectives();
    const fields = this.parseFieldsDefinition();
    return this.node(start, {
      kind: Kind.OBJECT_TYPE_DEFINITION,
      description,
      name,
      interfaces,
      directives,
      fields
    });
  }
  parseImplementsInterfaces() {
    return this.expectOptionalKeyword("implements") ? this.delimitedMany(TokenKind.AMP, this.parseNamedType) : [];
  }
  parseFieldsDefinition() {
    return this.optionalMany(
      TokenKind.BRACE_L,
      this.parseFieldDefinition,
      TokenKind.BRACE_R
    );
  }
  parseFieldDefinition() {
    const start = this._lexer.token;
    const description = this.parseDescription();
    const name = this.parseName();
    const args = this.parseArgumentDefs();
    this.expectToken(TokenKind.COLON);
    const type = this.parseTypeReference();
    const directives = this.parseConstDirectives();
    return this.node(start, {
      kind: Kind.FIELD_DEFINITION,
      description,
      name,
      arguments: args,
      type,
      directives
    });
  }
  parseArgumentDefs() {
    return this.optionalMany(
      TokenKind.PAREN_L,
      this.parseInputValueDef,
      TokenKind.PAREN_R
    );
  }
  parseInputValueDef() {
    const start = this._lexer.token;
    const description = this.parseDescription();
    const name = this.parseName();
    this.expectToken(TokenKind.COLON);
    const type = this.parseTypeReference();
    let defaultValue;
    if (this.expectOptionalToken(TokenKind.EQUALS)) {
      defaultValue = this.parseConstValueLiteral();
    }
    const directives = this.parseConstDirectives();
    return this.node(start, {
      kind: Kind.INPUT_VALUE_DEFINITION,
      description,
      name,
      type,
      defaultValue,
      directives
    });
  }
  parseInterfaceTypeDefinition() {
    const start = this._lexer.token;
    const description = this.parseDescription();
    this.expectKeyword("interface");
    const name = this.parseName();
    const interfaces = this.parseImplementsInterfaces();
    const directives = this.parseConstDirectives();
    const fields = this.parseFieldsDefinition();
    return this.node(start, {
      kind: Kind.INTERFACE_TYPE_DEFINITION,
      description,
      name,
      interfaces,
      directives,
      fields
    });
  }
  parseUnionTypeDefinition() {
    const start = this._lexer.token;
    const description = this.parseDescription();
    this.expectKeyword("union");
    const name = this.parseName();
    const directives = this.parseConstDirectives();
    const types2 = this.parseUnionMemberTypes();
    return this.node(start, {
      kind: Kind.UNION_TYPE_DEFINITION,
      description,
      name,
      directives,
      types: types2
    });
  }
  parseUnionMemberTypes() {
    return this.expectOptionalToken(TokenKind.EQUALS) ? this.delimitedMany(TokenKind.PIPE, this.parseNamedType) : [];
  }
  parseEnumTypeDefinition() {
    const start = this._lexer.token;
    const description = this.parseDescription();
    this.expectKeyword("enum");
    const name = this.parseName();
    const directives = this.parseConstDirectives();
    const values = this.parseEnumValuesDefinition();
    return this.node(start, {
      kind: Kind.ENUM_TYPE_DEFINITION,
      description,
      name,
      directives,
      values
    });
  }
  parseEnumValuesDefinition() {
    return this.optionalMany(
      TokenKind.BRACE_L,
      this.parseEnumValueDefinition,
      TokenKind.BRACE_R
    );
  }
  parseEnumValueDefinition() {
    const start = this._lexer.token;
    const description = this.parseDescription();
    const name = this.parseEnumValueName();
    const directives = this.parseConstDirectives();
    return this.node(start, {
      kind: Kind.ENUM_VALUE_DEFINITION,
      description,
      name,
      directives
    });
  }
  parseEnumValueName() {
    if (this._lexer.token.value === "true" || this._lexer.token.value === "false" || this._lexer.token.value === "null") {
      throw syntaxError(
        this._lexer.source,
        this._lexer.token.start,
        `${getTokenDesc(
          this._lexer.token
        )} is reserved and cannot be used for an enum value.`
      );
    }
    return this.parseName();
  }
  parseInputObjectTypeDefinition() {
    const start = this._lexer.token;
    const description = this.parseDescription();
    this.expectKeyword("input");
    const name = this.parseName();
    const directives = this.parseConstDirectives();
    const fields = this.parseInputFieldsDefinition();
    return this.node(start, {
      kind: Kind.INPUT_OBJECT_TYPE_DEFINITION,
      description,
      name,
      directives,
      fields
    });
  }
  parseInputFieldsDefinition() {
    return this.optionalMany(
      TokenKind.BRACE_L,
      this.parseInputValueDef,
      TokenKind.BRACE_R
    );
  }
  parseTypeSystemExtension() {
    const keywordToken = this._lexer.lookahead();
    if (keywordToken.kind === TokenKind.NAME) {
      switch (keywordToken.value) {
        case "schema":
          return this.parseSchemaExtension();
        case "scalar":
          return this.parseScalarTypeExtension();
        case "type":
          return this.parseObjectTypeExtension();
        case "interface":
          return this.parseInterfaceTypeExtension();
        case "union":
          return this.parseUnionTypeExtension();
        case "enum":
          return this.parseEnumTypeExtension();
        case "input":
          return this.parseInputObjectTypeExtension();
      }
    }
    throw this.unexpected(keywordToken);
  }
  parseSchemaExtension() {
    const start = this._lexer.token;
    this.expectKeyword("extend");
    this.expectKeyword("schema");
    const directives = this.parseConstDirectives();
    const operationTypes = this.optionalMany(
      TokenKind.BRACE_L,
      this.parseOperationTypeDefinition,
      TokenKind.BRACE_R
    );
    if (directives.length === 0 && operationTypes.length === 0) {
      throw this.unexpected();
    }
    return this.node(start, {
      kind: Kind.SCHEMA_EXTENSION,
      directives,
      operationTypes
    });
  }
  parseScalarTypeExtension() {
    const start = this._lexer.token;
    this.expectKeyword("extend");
    this.expectKeyword("scalar");
    const name = this.parseName();
    const directives = this.parseConstDirectives();
    if (directives.length === 0) {
      throw this.unexpected();
    }
    return this.node(start, {
      kind: Kind.SCALAR_TYPE_EXTENSION,
      name,
      directives
    });
  }
  parseObjectTypeExtension() {
    const start = this._lexer.token;
    this.expectKeyword("extend");
    this.expectKeyword("type");
    const name = this.parseName();
    const interfaces = this.parseImplementsInterfaces();
    const directives = this.parseConstDirectives();
    const fields = this.parseFieldsDefinition();
    if (interfaces.length === 0 && directives.length === 0 && fields.length === 0) {
      throw this.unexpected();
    }
    return this.node(start, {
      kind: Kind.OBJECT_TYPE_EXTENSION,
      name,
      interfaces,
      directives,
      fields
    });
  }
  parseInterfaceTypeExtension() {
    const start = this._lexer.token;
    this.expectKeyword("extend");
    this.expectKeyword("interface");
    const name = this.parseName();
    const interfaces = this.parseImplementsInterfaces();
    const directives = this.parseConstDirectives();
    const fields = this.parseFieldsDefinition();
    if (interfaces.length === 0 && directives.length === 0 && fields.length === 0) {
      throw this.unexpected();
    }
    return this.node(start, {
      kind: Kind.INTERFACE_TYPE_EXTENSION,
      name,
      interfaces,
      directives,
      fields
    });
  }
  parseUnionTypeExtension() {
    const start = this._lexer.token;
    this.expectKeyword("extend");
    this.expectKeyword("union");
    const name = this.parseName();
    const directives = this.parseConstDirectives();
    const types2 = this.parseUnionMemberTypes();
    if (directives.length === 0 && types2.length === 0) {
      throw this.unexpected();
    }
    return this.node(start, {
      kind: Kind.UNION_TYPE_EXTENSION,
      name,
      directives,
      types: types2
    });
  }
  parseEnumTypeExtension() {
    const start = this._lexer.token;
    this.expectKeyword("extend");
    this.expectKeyword("enum");
    const name = this.parseName();
    const directives = this.parseConstDirectives();
    const values = this.parseEnumValuesDefinition();
    if (directives.length === 0 && values.length === 0) {
      throw this.unexpected();
    }
    return this.node(start, {
      kind: Kind.ENUM_TYPE_EXTENSION,
      name,
      directives,
      values
    });
  }
  parseInputObjectTypeExtension() {
    const start = this._lexer.token;
    this.expectKeyword("extend");
    this.expectKeyword("input");
    const name = this.parseName();
    const directives = this.parseConstDirectives();
    const fields = this.parseInputFieldsDefinition();
    if (directives.length === 0 && fields.length === 0) {
      throw this.unexpected();
    }
    return this.node(start, {
      kind: Kind.INPUT_OBJECT_TYPE_EXTENSION,
      name,
      directives,
      fields
    });
  }
  parseDirectiveDefinition() {
    const start = this._lexer.token;
    const description = this.parseDescription();
    this.expectKeyword("directive");
    this.expectToken(TokenKind.AT);
    const name = this.parseName();
    const args = this.parseArgumentDefs();
    const repeatable = this.expectOptionalKeyword("repeatable");
    this.expectKeyword("on");
    const locations = this.parseDirectiveLocations();
    return this.node(start, {
      kind: Kind.DIRECTIVE_DEFINITION,
      description,
      name,
      arguments: args,
      repeatable,
      locations
    });
  }
  parseDirectiveLocations() {
    return this.delimitedMany(TokenKind.PIPE, this.parseDirectiveLocation);
  }
  parseDirectiveLocation() {
    const start = this._lexer.token;
    const name = this.parseName();
    if (Object.prototype.hasOwnProperty.call(DirectiveLocation, name.value)) {
      return name;
    }
    throw this.unexpected(start);
  }
  node(startToken, node) {
    if (this._options.noLocation !== true) {
      node.loc = new Location(
        startToken,
        this._lexer.lastToken,
        this._lexer.source
      );
    }
    return node;
  }
  peek(kind) {
    return this._lexer.token.kind === kind;
  }
  expectToken(kind) {
    const token = this._lexer.token;
    if (token.kind === kind) {
      this.advanceLexer();
      return token;
    }
    throw syntaxError(
      this._lexer.source,
      token.start,
      `Expected ${getTokenKindDesc(kind)}, found ${getTokenDesc(token)}.`
    );
  }
  expectOptionalToken(kind) {
    const token = this._lexer.token;
    if (token.kind === kind) {
      this.advanceLexer();
      return true;
    }
    return false;
  }
  expectKeyword(value) {
    const token = this._lexer.token;
    if (token.kind === TokenKind.NAME && token.value === value) {
      this.advanceLexer();
    } else {
      throw syntaxError(
        this._lexer.source,
        token.start,
        `Expected "${value}", found ${getTokenDesc(token)}.`
      );
    }
  }
  expectOptionalKeyword(value) {
    const token = this._lexer.token;
    if (token.kind === TokenKind.NAME && token.value === value) {
      this.advanceLexer();
      return true;
    }
    return false;
  }
  unexpected(atToken) {
    const token = atToken !== null && atToken !== void 0 ? atToken : this._lexer.token;
    return syntaxError(
      this._lexer.source,
      token.start,
      `Unexpected ${getTokenDesc(token)}.`
    );
  }
  any(openKind, parseFn, closeKind) {
    this.expectToken(openKind);
    const nodes = [];
    while (!this.expectOptionalToken(closeKind)) {
      nodes.push(parseFn.call(this));
    }
    return nodes;
  }
  optionalMany(openKind, parseFn, closeKind) {
    if (this.expectOptionalToken(openKind)) {
      const nodes = [];
      do {
        nodes.push(parseFn.call(this));
      } while (!this.expectOptionalToken(closeKind));
      return nodes;
    }
    return [];
  }
  many(openKind, parseFn, closeKind) {
    this.expectToken(openKind);
    const nodes = [];
    do {
      nodes.push(parseFn.call(this));
    } while (!this.expectOptionalToken(closeKind));
    return nodes;
  }
  delimitedMany(delimiterKind, parseFn) {
    this.expectOptionalToken(delimiterKind);
    const nodes = [];
    do {
      nodes.push(parseFn.call(this));
    } while (this.expectOptionalToken(delimiterKind));
    return nodes;
  }
  advanceLexer() {
    const { maxTokens } = this._options;
    const token = this._lexer.advance();
    if (maxTokens !== void 0 && token.kind !== TokenKind.EOF) {
      ++this._tokenCounter;
      if (this._tokenCounter > maxTokens) {
        throw syntaxError(
          this._lexer.source,
          token.start,
          `Document contains more that ${maxTokens} tokens. Parsing aborted.`
        );
      }
    }
  }
}
function getTokenDesc(token) {
  const value = token.value;
  return getTokenKindDesc(token.kind) + (value != null ? ` "${value}"` : "");
}
function getTokenKindDesc(kind) {
  return isPunctuatorTokenKind(kind) ? `"${kind}"` : kind;
}
const MAX_SUGGESTIONS = 5;
function didYouMean(firstArg, secondArg) {
  const [subMessage, suggestionsArg] = secondArg ? [firstArg, secondArg] : [void 0, firstArg];
  let message = " Did you mean ";
  if (subMessage) {
    message += subMessage + " ";
  }
  const suggestions = suggestionsArg.map((x) => `"${x}"`);
  switch (suggestions.length) {
    case 0:
      return "";
    case 1:
      return message + suggestions[0] + "?";
    case 2:
      return message + suggestions[0] + " or " + suggestions[1] + "?";
  }
  const selected = suggestions.slice(0, MAX_SUGGESTIONS);
  const lastItem = selected.pop();
  return message + selected.join(", ") + ", or " + lastItem + "?";
}
function identityFunc(x) {
  return x;
}
function keyMap(list, keyFn) {
  const result = /* @__PURE__ */ Object.create(null);
  for (const item of list) {
    result[keyFn(item)] = item;
  }
  return result;
}
function keyValMap(list, keyFn, valFn) {
  const result = /* @__PURE__ */ Object.create(null);
  for (const item of list) {
    result[keyFn(item)] = valFn(item);
  }
  return result;
}
function mapValue(map, fn) {
  const result = /* @__PURE__ */ Object.create(null);
  for (const key of Object.keys(map)) {
    result[key] = fn(map[key], key);
  }
  return result;
}
function naturalCompare(aStr, bStr) {
  let aIndex = 0;
  let bIndex = 0;
  while (aIndex < aStr.length && bIndex < bStr.length) {
    let aChar = aStr.charCodeAt(aIndex);
    let bChar = bStr.charCodeAt(bIndex);
    if (isDigit(aChar) && isDigit(bChar)) {
      let aNum = 0;
      do {
        ++aIndex;
        aNum = aNum * 10 + aChar - DIGIT_0;
        aChar = aStr.charCodeAt(aIndex);
      } while (isDigit(aChar) && aNum > 0);
      let bNum = 0;
      do {
        ++bIndex;
        bNum = bNum * 10 + bChar - DIGIT_0;
        bChar = bStr.charCodeAt(bIndex);
      } while (isDigit(bChar) && bNum > 0);
      if (aNum < bNum) {
        return -1;
      }
      if (aNum > bNum) {
        return 1;
      }
    } else {
      if (aChar < bChar) {
        return -1;
      }
      if (aChar > bChar) {
        return 1;
      }
      ++aIndex;
      ++bIndex;
    }
  }
  return aStr.length - bStr.length;
}
const DIGIT_0 = 48;
const DIGIT_9 = 57;
function isDigit(code) {
  return !isNaN(code) && DIGIT_0 <= code && code <= DIGIT_9;
}
function suggestionList(input, options) {
  const optionsByDistance = /* @__PURE__ */ Object.create(null);
  const lexicalDistance = new LexicalDistance(input);
  const threshold = Math.floor(input.length * 0.4) + 1;
  for (const option of options) {
    const distance = lexicalDistance.measure(option, threshold);
    if (distance !== void 0) {
      optionsByDistance[option] = distance;
    }
  }
  return Object.keys(optionsByDistance).sort((a, b) => {
    const distanceDiff = optionsByDistance[a] - optionsByDistance[b];
    return distanceDiff !== 0 ? distanceDiff : naturalCompare(a, b);
  });
}
class LexicalDistance {
  constructor(input) {
    this._input = input;
    this._inputLowerCase = input.toLowerCase();
    this._inputArray = stringToArray(this._inputLowerCase);
    this._rows = [
      new Array(input.length + 1).fill(0),
      new Array(input.length + 1).fill(0),
      new Array(input.length + 1).fill(0)
    ];
  }
  measure(option, threshold) {
    if (this._input === option) {
      return 0;
    }
    const optionLowerCase = option.toLowerCase();
    if (this._inputLowerCase === optionLowerCase) {
      return 1;
    }
    let a = stringToArray(optionLowerCase);
    let b = this._inputArray;
    if (a.length < b.length) {
      const tmp = a;
      a = b;
      b = tmp;
    }
    const aLength = a.length;
    const bLength = b.length;
    if (aLength - bLength > threshold) {
      return void 0;
    }
    const rows = this._rows;
    for (let j = 0; j <= bLength; j++) {
      rows[0][j] = j;
    }
    for (let i = 1; i <= aLength; i++) {
      const upRow = rows[(i - 1) % 3];
      const currentRow = rows[i % 3];
      let smallestCell = currentRow[0] = i;
      for (let j = 1; j <= bLength; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        let currentCell = Math.min(
          upRow[j] + 1,
          currentRow[j - 1] + 1,
          upRow[j - 1] + cost
        );
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
          const doubleDiagonalCell = rows[(i - 2) % 3][j - 2];
          currentCell = Math.min(currentCell, doubleDiagonalCell + 1);
        }
        if (currentCell < smallestCell) {
          smallestCell = currentCell;
        }
        currentRow[j] = currentCell;
      }
      if (smallestCell > threshold) {
        return void 0;
      }
    }
    const distance = rows[aLength % 3][bLength];
    return distance <= threshold ? distance : void 0;
  }
}
function stringToArray(str) {
  const strLength = str.length;
  const array = new Array(strLength);
  for (let i = 0; i < strLength; ++i) {
    array[i] = str.charCodeAt(i);
  }
  return array;
}
function toObjMap(obj) {
  if (obj == null) {
    return /* @__PURE__ */ Object.create(null);
  }
  if (Object.getPrototypeOf(obj) === null) {
    return obj;
  }
  const map = /* @__PURE__ */ Object.create(null);
  for (const [key, value] of Object.entries(obj)) {
    map[key] = value;
  }
  return map;
}
function printString(str) {
  return `"${str.replace(escapedRegExp, escapedReplacer)}"`;
}
const escapedRegExp = /[\x00-\x1f\x22\x5c\x7f-\x9f]/g;
function escapedReplacer(str) {
  return escapeSequences[str.charCodeAt(0)];
}
const escapeSequences = [
  "\\u0000",
  "\\u0001",
  "\\u0002",
  "\\u0003",
  "\\u0004",
  "\\u0005",
  "\\u0006",
  "\\u0007",
  "\\b",
  "\\t",
  "\\n",
  "\\u000B",
  "\\f",
  "\\r",
  "\\u000E",
  "\\u000F",
  "\\u0010",
  "\\u0011",
  "\\u0012",
  "\\u0013",
  "\\u0014",
  "\\u0015",
  "\\u0016",
  "\\u0017",
  "\\u0018",
  "\\u0019",
  "\\u001A",
  "\\u001B",
  "\\u001C",
  "\\u001D",
  "\\u001E",
  "\\u001F",
  "",
  "",
  '\\"',
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "\\\\",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "\\u007F",
  "\\u0080",
  "\\u0081",
  "\\u0082",
  "\\u0083",
  "\\u0084",
  "\\u0085",
  "\\u0086",
  "\\u0087",
  "\\u0088",
  "\\u0089",
  "\\u008A",
  "\\u008B",
  "\\u008C",
  "\\u008D",
  "\\u008E",
  "\\u008F",
  "\\u0090",
  "\\u0091",
  "\\u0092",
  "\\u0093",
  "\\u0094",
  "\\u0095",
  "\\u0096",
  "\\u0097",
  "\\u0098",
  "\\u0099",
  "\\u009A",
  "\\u009B",
  "\\u009C",
  "\\u009D",
  "\\u009E",
  "\\u009F"
];
const BREAK = Object.freeze({});
function visit(root, visitor, visitorKeys = QueryDocumentKeys) {
  const enterLeaveMap = /* @__PURE__ */ new Map();
  for (const kind of Object.values(Kind)) {
    enterLeaveMap.set(kind, getEnterLeaveForKind(visitor, kind));
  }
  let stack = void 0;
  let inArray = Array.isArray(root);
  let keys = [root];
  let index = -1;
  let edits = [];
  let node = root;
  let key = void 0;
  let parent = void 0;
  const path = [];
  const ancestors = [];
  do {
    index++;
    const isLeaving = index === keys.length;
    const isEdited = isLeaving && edits.length !== 0;
    if (isLeaving) {
      key = ancestors.length === 0 ? void 0 : path[path.length - 1];
      node = parent;
      parent = ancestors.pop();
      if (isEdited) {
        if (inArray) {
          node = node.slice();
          let editOffset = 0;
          for (const [editKey, editValue] of edits) {
            const arrayKey = editKey - editOffset;
            if (editValue === null) {
              node.splice(arrayKey, 1);
              editOffset++;
            } else {
              node[arrayKey] = editValue;
            }
          }
        } else {
          node = Object.defineProperties(
            {},
            Object.getOwnPropertyDescriptors(node)
          );
          for (const [editKey, editValue] of edits) {
            node[editKey] = editValue;
          }
        }
      }
      index = stack.index;
      keys = stack.keys;
      edits = stack.edits;
      inArray = stack.inArray;
      stack = stack.prev;
    } else if (parent) {
      key = inArray ? index : keys[index];
      node = parent[key];
      if (node === null || node === void 0) {
        continue;
      }
      path.push(key);
    }
    let result;
    if (!Array.isArray(node)) {
      var _enterLeaveMap$get, _enterLeaveMap$get2;
      isNode(node) || devAssert(false, `Invalid AST Node: ${inspect(node)}.`);
      const visitFn = isLeaving ? (_enterLeaveMap$get = enterLeaveMap.get(node.kind)) === null || _enterLeaveMap$get === void 0 ? void 0 : _enterLeaveMap$get.leave : (_enterLeaveMap$get2 = enterLeaveMap.get(node.kind)) === null || _enterLeaveMap$get2 === void 0 ? void 0 : _enterLeaveMap$get2.enter;
      result = visitFn === null || visitFn === void 0 ? void 0 : visitFn.call(visitor, node, key, parent, path, ancestors);
      if (result === BREAK) {
        break;
      }
      if (result === false) {
        if (!isLeaving) {
          path.pop();
          continue;
        }
      } else if (result !== void 0) {
        edits.push([key, result]);
        if (!isLeaving) {
          if (isNode(result)) {
            node = result;
          } else {
            path.pop();
            continue;
          }
        }
      }
    }
    if (result === void 0 && isEdited) {
      edits.push([key, node]);
    }
    if (isLeaving) {
      path.pop();
    } else {
      var _node$kind;
      stack = {
        inArray,
        index,
        keys,
        edits,
        prev: stack
      };
      inArray = Array.isArray(node);
      keys = inArray ? node : (_node$kind = visitorKeys[node.kind]) !== null && _node$kind !== void 0 ? _node$kind : [];
      index = -1;
      edits = [];
      if (parent) {
        ancestors.push(parent);
      }
      parent = node;
    }
  } while (stack !== void 0);
  if (edits.length !== 0) {
    return edits[edits.length - 1][1];
  }
  return root;
}
function visitInParallel(visitors) {
  const skipping = new Array(visitors.length).fill(null);
  const mergedVisitor = /* @__PURE__ */ Object.create(null);
  for (const kind of Object.values(Kind)) {
    let hasVisitor = false;
    const enterList = new Array(visitors.length).fill(void 0);
    const leaveList = new Array(visitors.length).fill(void 0);
    for (let i = 0; i < visitors.length; ++i) {
      const { enter, leave } = getEnterLeaveForKind(visitors[i], kind);
      hasVisitor || (hasVisitor = enter != null || leave != null);
      enterList[i] = enter;
      leaveList[i] = leave;
    }
    if (!hasVisitor) {
      continue;
    }
    const mergedEnterLeave = {
      enter(...args) {
        const node = args[0];
        for (let i = 0; i < visitors.length; i++) {
          if (skipping[i] === null) {
            var _enterList$i;
            const result = (_enterList$i = enterList[i]) === null || _enterList$i === void 0 ? void 0 : _enterList$i.apply(visitors[i], args);
            if (result === false) {
              skipping[i] = node;
            } else if (result === BREAK) {
              skipping[i] = BREAK;
            } else if (result !== void 0) {
              return result;
            }
          }
        }
      },
      leave(...args) {
        const node = args[0];
        for (let i = 0; i < visitors.length; i++) {
          if (skipping[i] === null) {
            var _leaveList$i;
            const result = (_leaveList$i = leaveList[i]) === null || _leaveList$i === void 0 ? void 0 : _leaveList$i.apply(visitors[i], args);
            if (result === BREAK) {
              skipping[i] = BREAK;
            } else if (result !== void 0 && result !== false) {
              return result;
            }
          } else if (skipping[i] === node) {
            skipping[i] = null;
          }
        }
      }
    };
    mergedVisitor[kind] = mergedEnterLeave;
  }
  return mergedVisitor;
}
function getEnterLeaveForKind(visitor, kind) {
  const kindVisitor = visitor[kind];
  if (typeof kindVisitor === "object") {
    return kindVisitor;
  } else if (typeof kindVisitor === "function") {
    return {
      enter: kindVisitor,
      leave: void 0
    };
  }
  return {
    enter: visitor.enter,
    leave: visitor.leave
  };
}
function getVisitFn(visitor, kind, isLeaving) {
  const { enter, leave } = getEnterLeaveForKind(visitor, kind);
  return isLeaving ? leave : enter;
}
function print(ast) {
  return visit(ast, printDocASTReducer);
}
const MAX_LINE_LENGTH = 80;
const printDocASTReducer = {
  Name: {
    leave: (node) => node.value
  },
  Variable: {
    leave: (node) => "$" + node.name
  },
  Document: {
    leave: (node) => join(node.definitions, "\n\n")
  },
  OperationDefinition: {
    leave(node) {
      const varDefs = wrap("(", join(node.variableDefinitions, ", "), ")");
      const prefix = join(
        [
          node.operation,
          join([node.name, varDefs]),
          join(node.directives, " ")
        ],
        " "
      );
      return (prefix === "query" ? "" : prefix + " ") + node.selectionSet;
    }
  },
  VariableDefinition: {
    leave: ({ variable, type, defaultValue, directives }) => variable + ": " + type + wrap(" = ", defaultValue) + wrap(" ", join(directives, " "))
  },
  SelectionSet: {
    leave: ({ selections }) => block(selections)
  },
  Field: {
    leave({ alias, name, arguments: args, directives, selectionSet }) {
      const prefix = wrap("", alias, ": ") + name;
      let argsLine = prefix + wrap("(", join(args, ", "), ")");
      if (argsLine.length > MAX_LINE_LENGTH) {
        argsLine = prefix + wrap("(\n", indent(join(args, "\n")), "\n)");
      }
      return join([argsLine, join(directives, " "), selectionSet], " ");
    }
  },
  Argument: {
    leave: ({ name, value }) => name + ": " + value
  },
  FragmentSpread: {
    leave: ({ name, directives }) => "..." + name + wrap(" ", join(directives, " "))
  },
  InlineFragment: {
    leave: ({ typeCondition, directives, selectionSet }) => join(
      [
        "...",
        wrap("on ", typeCondition),
        join(directives, " "),
        selectionSet
      ],
      " "
    )
  },
  FragmentDefinition: {
    leave: ({ name, typeCondition, variableDefinitions, directives, selectionSet }) => `fragment ${name}${wrap("(", join(variableDefinitions, ", "), ")")} on ${typeCondition} ${wrap("", join(directives, " "), " ")}` + selectionSet
  },
  IntValue: {
    leave: ({ value }) => value
  },
  FloatValue: {
    leave: ({ value }) => value
  },
  StringValue: {
    leave: ({ value, block: isBlockString }) => isBlockString ? printBlockString(value) : printString(value)
  },
  BooleanValue: {
    leave: ({ value }) => value ? "true" : "false"
  },
  NullValue: {
    leave: () => "null"
  },
  EnumValue: {
    leave: ({ value }) => value
  },
  ListValue: {
    leave: ({ values }) => "[" + join(values, ", ") + "]"
  },
  ObjectValue: {
    leave: ({ fields }) => "{" + join(fields, ", ") + "}"
  },
  ObjectField: {
    leave: ({ name, value }) => name + ": " + value
  },
  Directive: {
    leave: ({ name, arguments: args }) => "@" + name + wrap("(", join(args, ", "), ")")
  },
  NamedType: {
    leave: ({ name }) => name
  },
  ListType: {
    leave: ({ type }) => "[" + type + "]"
  },
  NonNullType: {
    leave: ({ type }) => type + "!"
  },
  SchemaDefinition: {
    leave: ({ description, directives, operationTypes }) => wrap("", description, "\n") + join(["schema", join(directives, " "), block(operationTypes)], " ")
  },
  OperationTypeDefinition: {
    leave: ({ operation, type }) => operation + ": " + type
  },
  ScalarTypeDefinition: {
    leave: ({ description, name, directives }) => wrap("", description, "\n") + join(["scalar", name, join(directives, " ")], " ")
  },
  ObjectTypeDefinition: {
    leave: ({ description, name, interfaces, directives, fields }) => wrap("", description, "\n") + join(
      [
        "type",
        name,
        wrap("implements ", join(interfaces, " & ")),
        join(directives, " "),
        block(fields)
      ],
      " "
    )
  },
  FieldDefinition: {
    leave: ({ description, name, arguments: args, type, directives }) => wrap("", description, "\n") + name + (hasMultilineItems(args) ? wrap("(\n", indent(join(args, "\n")), "\n)") : wrap("(", join(args, ", "), ")")) + ": " + type + wrap(" ", join(directives, " "))
  },
  InputValueDefinition: {
    leave: ({ description, name, type, defaultValue, directives }) => wrap("", description, "\n") + join(
      [name + ": " + type, wrap("= ", defaultValue), join(directives, " ")],
      " "
    )
  },
  InterfaceTypeDefinition: {
    leave: ({ description, name, interfaces, directives, fields }) => wrap("", description, "\n") + join(
      [
        "interface",
        name,
        wrap("implements ", join(interfaces, " & ")),
        join(directives, " "),
        block(fields)
      ],
      " "
    )
  },
  UnionTypeDefinition: {
    leave: ({ description, name, directives, types: types2 }) => wrap("", description, "\n") + join(
      ["union", name, join(directives, " "), wrap("= ", join(types2, " | "))],
      " "
    )
  },
  EnumTypeDefinition: {
    leave: ({ description, name, directives, values }) => wrap("", description, "\n") + join(["enum", name, join(directives, " "), block(values)], " ")
  },
  EnumValueDefinition: {
    leave: ({ description, name, directives }) => wrap("", description, "\n") + join([name, join(directives, " ")], " ")
  },
  InputObjectTypeDefinition: {
    leave: ({ description, name, directives, fields }) => wrap("", description, "\n") + join(["input", name, join(directives, " "), block(fields)], " ")
  },
  DirectiveDefinition: {
    leave: ({ description, name, arguments: args, repeatable, locations }) => wrap("", description, "\n") + "directive @" + name + (hasMultilineItems(args) ? wrap("(\n", indent(join(args, "\n")), "\n)") : wrap("(", join(args, ", "), ")")) + (repeatable ? " repeatable" : "") + " on " + join(locations, " | ")
  },
  SchemaExtension: {
    leave: ({ directives, operationTypes }) => join(
      ["extend schema", join(directives, " "), block(operationTypes)],
      " "
    )
  },
  ScalarTypeExtension: {
    leave: ({ name, directives }) => join(["extend scalar", name, join(directives, " ")], " ")
  },
  ObjectTypeExtension: {
    leave: ({ name, interfaces, directives, fields }) => join(
      [
        "extend type",
        name,
        wrap("implements ", join(interfaces, " & ")),
        join(directives, " "),
        block(fields)
      ],
      " "
    )
  },
  InterfaceTypeExtension: {
    leave: ({ name, interfaces, directives, fields }) => join(
      [
        "extend interface",
        name,
        wrap("implements ", join(interfaces, " & ")),
        join(directives, " "),
        block(fields)
      ],
      " "
    )
  },
  UnionTypeExtension: {
    leave: ({ name, directives, types: types2 }) => join(
      [
        "extend union",
        name,
        join(directives, " "),
        wrap("= ", join(types2, " | "))
      ],
      " "
    )
  },
  EnumTypeExtension: {
    leave: ({ name, directives, values }) => join(["extend enum", name, join(directives, " "), block(values)], " ")
  },
  InputObjectTypeExtension: {
    leave: ({ name, directives, fields }) => join(["extend input", name, join(directives, " "), block(fields)], " ")
  }
};
function join(maybeArray, separator = "") {
  var _maybeArray$filter$jo;
  return (_maybeArray$filter$jo = maybeArray === null || maybeArray === void 0 ? void 0 : maybeArray.filter((x) => x).join(separator)) !== null && _maybeArray$filter$jo !== void 0 ? _maybeArray$filter$jo : "";
}
function block(array) {
  return wrap("{\n", indent(join(array, "\n")), "\n}");
}
function wrap(start, maybeString, end = "") {
  return maybeString != null && maybeString !== "" ? start + maybeString + end : "";
}
function indent(str) {
  return wrap("  ", str.replace(/\n/g, "\n  "));
}
function hasMultilineItems(maybeArray) {
  var _maybeArray$some;
  return (_maybeArray$some = maybeArray === null || maybeArray === void 0 ? void 0 : maybeArray.some((str) => str.includes("\n"))) !== null && _maybeArray$some !== void 0 ? _maybeArray$some : false;
}
function valueFromASTUntyped(valueNode, variables) {
  switch (valueNode.kind) {
    case Kind.NULL:
      return null;
    case Kind.INT:
      return parseInt(valueNode.value, 10);
    case Kind.FLOAT:
      return parseFloat(valueNode.value);
    case Kind.STRING:
    case Kind.ENUM:
    case Kind.BOOLEAN:
      return valueNode.value;
    case Kind.LIST:
      return valueNode.values.map(
        (node) => valueFromASTUntyped(node, variables)
      );
    case Kind.OBJECT:
      return keyValMap(
        valueNode.fields,
        (field2) => field2.name.value,
        (field2) => valueFromASTUntyped(field2.value, variables)
      );
    case Kind.VARIABLE:
      return variables === null || variables === void 0 ? void 0 : variables[valueNode.name.value];
  }
}
function assertName(name) {
  name != null || devAssert(false, "Must provide name.");
  typeof name === "string" || devAssert(false, "Expected name to be a string.");
  if (name.length === 0) {
    throw new GraphQLError("Expected name to be a non-empty string.");
  }
  for (let i = 1; i < name.length; ++i) {
    if (!isNameContinue(name.charCodeAt(i))) {
      throw new GraphQLError(
        `Names must only contain [_a-zA-Z0-9] but "${name}" does not.`
      );
    }
  }
  if (!isNameStart(name.charCodeAt(0))) {
    throw new GraphQLError(
      `Names must start with [_a-zA-Z] but "${name}" does not.`
    );
  }
  return name;
}
function assertEnumValueName(name) {
  if (name === "true" || name === "false" || name === "null") {
    throw new GraphQLError(`Enum values cannot be named: ${name}`);
  }
  return assertName(name);
}
function isType(type) {
  return isScalarType(type) || isObjectType(type) || isInterfaceType(type) || isUnionType(type) || isEnumType(type) || isInputObjectType(type) || isListType(type) || isNonNullType(type);
}
function assertType(type) {
  if (!isType(type)) {
    throw new Error(`Expected ${inspect(type)} to be a GraphQL type.`);
  }
  return type;
}
function isScalarType(type) {
  return instanceOf(type, GraphQLScalarType);
}
function assertScalarType(type) {
  if (!isScalarType(type)) {
    throw new Error(`Expected ${inspect(type)} to be a GraphQL Scalar type.`);
  }
  return type;
}
function isObjectType(type) {
  return instanceOf(type, GraphQLObjectType);
}
function assertObjectType(type) {
  if (!isObjectType(type)) {
    throw new Error(`Expected ${inspect(type)} to be a GraphQL Object type.`);
  }
  return type;
}
function isInterfaceType(type) {
  return instanceOf(type, GraphQLInterfaceType);
}
function assertInterfaceType(type) {
  if (!isInterfaceType(type)) {
    throw new Error(
      `Expected ${inspect(type)} to be a GraphQL Interface type.`
    );
  }
  return type;
}
function isUnionType(type) {
  return instanceOf(type, GraphQLUnionType);
}
function assertUnionType(type) {
  if (!isUnionType(type)) {
    throw new Error(`Expected ${inspect(type)} to be a GraphQL Union type.`);
  }
  return type;
}
function isEnumType(type) {
  return instanceOf(type, GraphQLEnumType);
}
function assertEnumType(type) {
  if (!isEnumType(type)) {
    throw new Error(`Expected ${inspect(type)} to be a GraphQL Enum type.`);
  }
  return type;
}
function isInputObjectType(type) {
  return instanceOf(type, GraphQLInputObjectType);
}
function assertInputObjectType(type) {
  if (!isInputObjectType(type)) {
    throw new Error(
      `Expected ${inspect(type)} to be a GraphQL Input Object type.`
    );
  }
  return type;
}
function isListType(type) {
  return instanceOf(type, GraphQLList);
}
function assertListType(type) {
  if (!isListType(type)) {
    throw new Error(`Expected ${inspect(type)} to be a GraphQL List type.`);
  }
  return type;
}
function isNonNullType(type) {
  return instanceOf(type, GraphQLNonNull);
}
function assertNonNullType(type) {
  if (!isNonNullType(type)) {
    throw new Error(`Expected ${inspect(type)} to be a GraphQL Non-Null type.`);
  }
  return type;
}
function isInputType(type) {
  return isScalarType(type) || isEnumType(type) || isInputObjectType(type) || isWrappingType(type) && isInputType(type.ofType);
}
function assertInputType(type) {
  if (!isInputType(type)) {
    throw new Error(`Expected ${inspect(type)} to be a GraphQL input type.`);
  }
  return type;
}
function isOutputType(type) {
  return isScalarType(type) || isObjectType(type) || isInterfaceType(type) || isUnionType(type) || isEnumType(type) || isWrappingType(type) && isOutputType(type.ofType);
}
function assertOutputType(type) {
  if (!isOutputType(type)) {
    throw new Error(`Expected ${inspect(type)} to be a GraphQL output type.`);
  }
  return type;
}
function isLeafType(type) {
  return isScalarType(type) || isEnumType(type);
}
function assertLeafType(type) {
  if (!isLeafType(type)) {
    throw new Error(`Expected ${inspect(type)} to be a GraphQL leaf type.`);
  }
  return type;
}
function isCompositeType(type) {
  return isObjectType(type) || isInterfaceType(type) || isUnionType(type);
}
function assertCompositeType(type) {
  if (!isCompositeType(type)) {
    throw new Error(
      `Expected ${inspect(type)} to be a GraphQL composite type.`
    );
  }
  return type;
}
function isAbstractType(type) {
  return isInterfaceType(type) || isUnionType(type);
}
function assertAbstractType(type) {
  if (!isAbstractType(type)) {
    throw new Error(`Expected ${inspect(type)} to be a GraphQL abstract type.`);
  }
  return type;
}
class GraphQLList {
  constructor(ofType) {
    isType(ofType) || devAssert(false, `Expected ${inspect(ofType)} to be a GraphQL type.`);
    this.ofType = ofType;
  }
  get [Symbol.toStringTag]() {
    return "GraphQLList";
  }
  toString() {
    return "[" + String(this.ofType) + "]";
  }
  toJSON() {
    return this.toString();
  }
}
class GraphQLNonNull {
  constructor(ofType) {
    isNullableType(ofType) || devAssert(
      false,
      `Expected ${inspect(ofType)} to be a GraphQL nullable type.`
    );
    this.ofType = ofType;
  }
  get [Symbol.toStringTag]() {
    return "GraphQLNonNull";
  }
  toString() {
    return String(this.ofType) + "!";
  }
  toJSON() {
    return this.toString();
  }
}
function isWrappingType(type) {
  return isListType(type) || isNonNullType(type);
}
function assertWrappingType(type) {
  if (!isWrappingType(type)) {
    throw new Error(`Expected ${inspect(type)} to be a GraphQL wrapping type.`);
  }
  return type;
}
function isNullableType(type) {
  return isType(type) && !isNonNullType(type);
}
function assertNullableType(type) {
  if (!isNullableType(type)) {
    throw new Error(`Expected ${inspect(type)} to be a GraphQL nullable type.`);
  }
  return type;
}
function getNullableType(type) {
  if (type) {
    return isNonNullType(type) ? type.ofType : type;
  }
}
function isNamedType(type) {
  return isScalarType(type) || isObjectType(type) || isInterfaceType(type) || isUnionType(type) || isEnumType(type) || isInputObjectType(type);
}
function assertNamedType(type) {
  if (!isNamedType(type)) {
    throw new Error(`Expected ${inspect(type)} to be a GraphQL named type.`);
  }
  return type;
}
function getNamedType(type) {
  if (type) {
    let unwrappedType = type;
    while (isWrappingType(unwrappedType)) {
      unwrappedType = unwrappedType.ofType;
    }
    return unwrappedType;
  }
}
function resolveReadonlyArrayThunk(thunk) {
  return typeof thunk === "function" ? thunk() : thunk;
}
function resolveObjMapThunk(thunk) {
  return typeof thunk === "function" ? thunk() : thunk;
}
class GraphQLScalarType {
  constructor(config) {
    var _config$parseValue, _config$serialize, _config$parseLiteral, _config$extensionASTN;
    const parseValue2 = (_config$parseValue = config.parseValue) !== null && _config$parseValue !== void 0 ? _config$parseValue : identityFunc;
    this.name = assertName(config.name);
    this.description = config.description;
    this.specifiedByURL = config.specifiedByURL;
    this.serialize = (_config$serialize = config.serialize) !== null && _config$serialize !== void 0 ? _config$serialize : identityFunc;
    this.parseValue = parseValue2;
    this.parseLiteral = (_config$parseLiteral = config.parseLiteral) !== null && _config$parseLiteral !== void 0 ? _config$parseLiteral : (node, variables) => parseValue2(valueFromASTUntyped(node, variables));
    this.extensions = toObjMap(config.extensions);
    this.astNode = config.astNode;
    this.extensionASTNodes = (_config$extensionASTN = config.extensionASTNodes) !== null && _config$extensionASTN !== void 0 ? _config$extensionASTN : [];
    config.specifiedByURL == null || typeof config.specifiedByURL === "string" || devAssert(
      false,
      `${this.name} must provide "specifiedByURL" as a string, but got: ${inspect(config.specifiedByURL)}.`
    );
    config.serialize == null || typeof config.serialize === "function" || devAssert(
      false,
      `${this.name} must provide "serialize" function. If this custom Scalar is also used as an input type, ensure "parseValue" and "parseLiteral" functions are also provided.`
    );
    if (config.parseLiteral) {
      typeof config.parseValue === "function" && typeof config.parseLiteral === "function" || devAssert(
        false,
        `${this.name} must provide both "parseValue" and "parseLiteral" functions.`
      );
    }
  }
  get [Symbol.toStringTag]() {
    return "GraphQLScalarType";
  }
  toConfig() {
    return {
      name: this.name,
      description: this.description,
      specifiedByURL: this.specifiedByURL,
      serialize: this.serialize,
      parseValue: this.parseValue,
      parseLiteral: this.parseLiteral,
      extensions: this.extensions,
      astNode: this.astNode,
      extensionASTNodes: this.extensionASTNodes
    };
  }
  toString() {
    return this.name;
  }
  toJSON() {
    return this.toString();
  }
}
class GraphQLObjectType {
  constructor(config) {
    var _config$extensionASTN2;
    this.name = assertName(config.name);
    this.description = config.description;
    this.isTypeOf = config.isTypeOf;
    this.extensions = toObjMap(config.extensions);
    this.astNode = config.astNode;
    this.extensionASTNodes = (_config$extensionASTN2 = config.extensionASTNodes) !== null && _config$extensionASTN2 !== void 0 ? _config$extensionASTN2 : [];
    this._fields = () => defineFieldMap(config);
    this._interfaces = () => defineInterfaces(config);
    config.isTypeOf == null || typeof config.isTypeOf === "function" || devAssert(
      false,
      `${this.name} must provide "isTypeOf" as a function, but got: ${inspect(config.isTypeOf)}.`
    );
  }
  get [Symbol.toStringTag]() {
    return "GraphQLObjectType";
  }
  getFields() {
    if (typeof this._fields === "function") {
      this._fields = this._fields();
    }
    return this._fields;
  }
  getInterfaces() {
    if (typeof this._interfaces === "function") {
      this._interfaces = this._interfaces();
    }
    return this._interfaces;
  }
  toConfig() {
    return {
      name: this.name,
      description: this.description,
      interfaces: this.getInterfaces(),
      fields: fieldsToFieldsConfig(this.getFields()),
      isTypeOf: this.isTypeOf,
      extensions: this.extensions,
      astNode: this.astNode,
      extensionASTNodes: this.extensionASTNodes
    };
  }
  toString() {
    return this.name;
  }
  toJSON() {
    return this.toString();
  }
}
function defineInterfaces(config) {
  var _config$interfaces;
  const interfaces = resolveReadonlyArrayThunk(
    (_config$interfaces = config.interfaces) !== null && _config$interfaces !== void 0 ? _config$interfaces : []
  );
  Array.isArray(interfaces) || devAssert(
    false,
    `${config.name} interfaces must be an Array or a function which returns an Array.`
  );
  return interfaces;
}
function defineFieldMap(config) {
  const fieldMap = resolveObjMapThunk(config.fields);
  isPlainObj(fieldMap) || devAssert(
    false,
    `${config.name} fields must be an object with field names as keys or a function which returns such an object.`
  );
  return mapValue(fieldMap, (fieldConfig, fieldName) => {
    var _fieldConfig$args;
    isPlainObj(fieldConfig) || devAssert(
      false,
      `${config.name}.${fieldName} field config must be an object.`
    );
    fieldConfig.resolve == null || typeof fieldConfig.resolve === "function" || devAssert(
      false,
      `${config.name}.${fieldName} field resolver must be a function if provided, but got: ${inspect(fieldConfig.resolve)}.`
    );
    const argsConfig = (_fieldConfig$args = fieldConfig.args) !== null && _fieldConfig$args !== void 0 ? _fieldConfig$args : {};
    isPlainObj(argsConfig) || devAssert(
      false,
      `${config.name}.${fieldName} args must be an object with argument names as keys.`
    );
    return {
      name: assertName(fieldName),
      description: fieldConfig.description,
      type: fieldConfig.type,
      args: defineArguments(argsConfig),
      resolve: fieldConfig.resolve,
      subscribe: fieldConfig.subscribe,
      deprecationReason: fieldConfig.deprecationReason,
      extensions: toObjMap(fieldConfig.extensions),
      astNode: fieldConfig.astNode
    };
  });
}
function defineArguments(config) {
  return Object.entries(config).map(([argName, argConfig]) => ({
    name: assertName(argName),
    description: argConfig.description,
    type: argConfig.type,
    defaultValue: argConfig.defaultValue,
    deprecationReason: argConfig.deprecationReason,
    extensions: toObjMap(argConfig.extensions),
    astNode: argConfig.astNode
  }));
}
function isPlainObj(obj) {
  return isObjectLike(obj) && !Array.isArray(obj);
}
function fieldsToFieldsConfig(fields) {
  return mapValue(fields, (field2) => ({
    description: field2.description,
    type: field2.type,
    args: argsToArgsConfig(field2.args),
    resolve: field2.resolve,
    subscribe: field2.subscribe,
    deprecationReason: field2.deprecationReason,
    extensions: field2.extensions,
    astNode: field2.astNode
  }));
}
function argsToArgsConfig(args) {
  return keyValMap(
    args,
    (arg) => arg.name,
    (arg) => ({
      description: arg.description,
      type: arg.type,
      defaultValue: arg.defaultValue,
      deprecationReason: arg.deprecationReason,
      extensions: arg.extensions,
      astNode: arg.astNode
    })
  );
}
function isRequiredArgument(arg) {
  return isNonNullType(arg.type) && arg.defaultValue === void 0;
}
class GraphQLInterfaceType {
  constructor(config) {
    var _config$extensionASTN3;
    this.name = assertName(config.name);
    this.description = config.description;
    this.resolveType = config.resolveType;
    this.extensions = toObjMap(config.extensions);
    this.astNode = config.astNode;
    this.extensionASTNodes = (_config$extensionASTN3 = config.extensionASTNodes) !== null && _config$extensionASTN3 !== void 0 ? _config$extensionASTN3 : [];
    this._fields = defineFieldMap.bind(void 0, config);
    this._interfaces = defineInterfaces.bind(void 0, config);
    config.resolveType == null || typeof config.resolveType === "function" || devAssert(
      false,
      `${this.name} must provide "resolveType" as a function, but got: ${inspect(config.resolveType)}.`
    );
  }
  get [Symbol.toStringTag]() {
    return "GraphQLInterfaceType";
  }
  getFields() {
    if (typeof this._fields === "function") {
      this._fields = this._fields();
    }
    return this._fields;
  }
  getInterfaces() {
    if (typeof this._interfaces === "function") {
      this._interfaces = this._interfaces();
    }
    return this._interfaces;
  }
  toConfig() {
    return {
      name: this.name,
      description: this.description,
      interfaces: this.getInterfaces(),
      fields: fieldsToFieldsConfig(this.getFields()),
      resolveType: this.resolveType,
      extensions: this.extensions,
      astNode: this.astNode,
      extensionASTNodes: this.extensionASTNodes
    };
  }
  toString() {
    return this.name;
  }
  toJSON() {
    return this.toString();
  }
}
class GraphQLUnionType {
  constructor(config) {
    var _config$extensionASTN4;
    this.name = assertName(config.name);
    this.description = config.description;
    this.resolveType = config.resolveType;
    this.extensions = toObjMap(config.extensions);
    this.astNode = config.astNode;
    this.extensionASTNodes = (_config$extensionASTN4 = config.extensionASTNodes) !== null && _config$extensionASTN4 !== void 0 ? _config$extensionASTN4 : [];
    this._types = defineTypes.bind(void 0, config);
    config.resolveType == null || typeof config.resolveType === "function" || devAssert(
      false,
      `${this.name} must provide "resolveType" as a function, but got: ${inspect(config.resolveType)}.`
    );
  }
  get [Symbol.toStringTag]() {
    return "GraphQLUnionType";
  }
  getTypes() {
    if (typeof this._types === "function") {
      this._types = this._types();
    }
    return this._types;
  }
  toConfig() {
    return {
      name: this.name,
      description: this.description,
      types: this.getTypes(),
      resolveType: this.resolveType,
      extensions: this.extensions,
      astNode: this.astNode,
      extensionASTNodes: this.extensionASTNodes
    };
  }
  toString() {
    return this.name;
  }
  toJSON() {
    return this.toString();
  }
}
function defineTypes(config) {
  const types2 = resolveReadonlyArrayThunk(config.types);
  Array.isArray(types2) || devAssert(
    false,
    `Must provide Array of types or a function which returns such an array for Union ${config.name}.`
  );
  return types2;
}
class GraphQLEnumType {
  constructor(config) {
    var _config$extensionASTN5;
    this.name = assertName(config.name);
    this.description = config.description;
    this.extensions = toObjMap(config.extensions);
    this.astNode = config.astNode;
    this.extensionASTNodes = (_config$extensionASTN5 = config.extensionASTNodes) !== null && _config$extensionASTN5 !== void 0 ? _config$extensionASTN5 : [];
    this._values = defineEnumValues(this.name, config.values);
    this._valueLookup = new Map(
      this._values.map((enumValue) => [enumValue.value, enumValue])
    );
    this._nameLookup = keyMap(this._values, (value) => value.name);
  }
  get [Symbol.toStringTag]() {
    return "GraphQLEnumType";
  }
  getValues() {
    return this._values;
  }
  getValue(name) {
    return this._nameLookup[name];
  }
  serialize(outputValue) {
    const enumValue = this._valueLookup.get(outputValue);
    if (enumValue === void 0) {
      throw new GraphQLError(
        `Enum "${this.name}" cannot represent value: ${inspect(outputValue)}`
      );
    }
    return enumValue.name;
  }
  parseValue(inputValue) {
    if (typeof inputValue !== "string") {
      const valueStr = inspect(inputValue);
      throw new GraphQLError(
        `Enum "${this.name}" cannot represent non-string value: ${valueStr}.` + didYouMeanEnumValue(this, valueStr)
      );
    }
    const enumValue = this.getValue(inputValue);
    if (enumValue == null) {
      throw new GraphQLError(
        `Value "${inputValue}" does not exist in "${this.name}" enum.` + didYouMeanEnumValue(this, inputValue)
      );
    }
    return enumValue.value;
  }
  parseLiteral(valueNode, _variables) {
    if (valueNode.kind !== Kind.ENUM) {
      const valueStr = print(valueNode);
      throw new GraphQLError(
        `Enum "${this.name}" cannot represent non-enum value: ${valueStr}.` + didYouMeanEnumValue(this, valueStr),
        {
          nodes: valueNode
        }
      );
    }
    const enumValue = this.getValue(valueNode.value);
    if (enumValue == null) {
      const valueStr = print(valueNode);
      throw new GraphQLError(
        `Value "${valueStr}" does not exist in "${this.name}" enum.` + didYouMeanEnumValue(this, valueStr),
        {
          nodes: valueNode
        }
      );
    }
    return enumValue.value;
  }
  toConfig() {
    const values = keyValMap(
      this.getValues(),
      (value) => value.name,
      (value) => ({
        description: value.description,
        value: value.value,
        deprecationReason: value.deprecationReason,
        extensions: value.extensions,
        astNode: value.astNode
      })
    );
    return {
      name: this.name,
      description: this.description,
      values,
      extensions: this.extensions,
      astNode: this.astNode,
      extensionASTNodes: this.extensionASTNodes
    };
  }
  toString() {
    return this.name;
  }
  toJSON() {
    return this.toString();
  }
}
function didYouMeanEnumValue(enumType, unknownValueStr) {
  const allNames = enumType.getValues().map((value) => value.name);
  const suggestedValues = suggestionList(unknownValueStr, allNames);
  return didYouMean("the enum value", suggestedValues);
}
function defineEnumValues(typeName, valueMap) {
  isPlainObj(valueMap) || devAssert(
    false,
    `${typeName} values must be an object with value names as keys.`
  );
  return Object.entries(valueMap).map(([valueName, valueConfig]) => {
    isPlainObj(valueConfig) || devAssert(
      false,
      `${typeName}.${valueName} must refer to an object with a "value" key representing an internal value but got: ${inspect(valueConfig)}.`
    );
    return {
      name: assertEnumValueName(valueName),
      description: valueConfig.description,
      value: valueConfig.value !== void 0 ? valueConfig.value : valueName,
      deprecationReason: valueConfig.deprecationReason,
      extensions: toObjMap(valueConfig.extensions),
      astNode: valueConfig.astNode
    };
  });
}
class GraphQLInputObjectType {
  constructor(config) {
    var _config$extensionASTN6;
    this.name = assertName(config.name);
    this.description = config.description;
    this.extensions = toObjMap(config.extensions);
    this.astNode = config.astNode;
    this.extensionASTNodes = (_config$extensionASTN6 = config.extensionASTNodes) !== null && _config$extensionASTN6 !== void 0 ? _config$extensionASTN6 : [];
    this._fields = defineInputFieldMap.bind(void 0, config);
  }
  get [Symbol.toStringTag]() {
    return "GraphQLInputObjectType";
  }
  getFields() {
    if (typeof this._fields === "function") {
      this._fields = this._fields();
    }
    return this._fields;
  }
  toConfig() {
    const fields = mapValue(this.getFields(), (field2) => ({
      description: field2.description,
      type: field2.type,
      defaultValue: field2.defaultValue,
      deprecationReason: field2.deprecationReason,
      extensions: field2.extensions,
      astNode: field2.astNode
    }));
    return {
      name: this.name,
      description: this.description,
      fields,
      extensions: this.extensions,
      astNode: this.astNode,
      extensionASTNodes: this.extensionASTNodes
    };
  }
  toString() {
    return this.name;
  }
  toJSON() {
    return this.toString();
  }
}
function defineInputFieldMap(config) {
  const fieldMap = resolveObjMapThunk(config.fields);
  isPlainObj(fieldMap) || devAssert(
    false,
    `${config.name} fields must be an object with field names as keys or a function which returns such an object.`
  );
  return mapValue(fieldMap, (fieldConfig, fieldName) => {
    !("resolve" in fieldConfig) || devAssert(
      false,
      `${config.name}.${fieldName} field has a resolve property, but Input Types cannot define resolvers.`
    );
    return {
      name: assertName(fieldName),
      description: fieldConfig.description,
      type: fieldConfig.type,
      defaultValue: fieldConfig.defaultValue,
      deprecationReason: fieldConfig.deprecationReason,
      extensions: toObjMap(fieldConfig.extensions),
      astNode: fieldConfig.astNode
    };
  });
}
function isRequiredInputField(field2) {
  return isNonNullType(field2.type) && field2.defaultValue === void 0;
}
function isEqualType(typeA, typeB) {
  if (typeA === typeB) {
    return true;
  }
  if (isNonNullType(typeA) && isNonNullType(typeB)) {
    return isEqualType(typeA.ofType, typeB.ofType);
  }
  if (isListType(typeA) && isListType(typeB)) {
    return isEqualType(typeA.ofType, typeB.ofType);
  }
  return false;
}
function isTypeSubTypeOf(schema, maybeSubType, superType) {
  if (maybeSubType === superType) {
    return true;
  }
  if (isNonNullType(superType)) {
    if (isNonNullType(maybeSubType)) {
      return isTypeSubTypeOf(schema, maybeSubType.ofType, superType.ofType);
    }
    return false;
  }
  if (isNonNullType(maybeSubType)) {
    return isTypeSubTypeOf(schema, maybeSubType.ofType, superType);
  }
  if (isListType(superType)) {
    if (isListType(maybeSubType)) {
      return isTypeSubTypeOf(schema, maybeSubType.ofType, superType.ofType);
    }
    return false;
  }
  if (isListType(maybeSubType)) {
    return false;
  }
  return isAbstractType(superType) && (isInterfaceType(maybeSubType) || isObjectType(maybeSubType)) && schema.isSubType(superType, maybeSubType);
}
function doTypesOverlap(schema, typeA, typeB) {
  if (typeA === typeB) {
    return true;
  }
  if (isAbstractType(typeA)) {
    if (isAbstractType(typeB)) {
      return schema.getPossibleTypes(typeA).some((type) => schema.isSubType(typeB, type));
    }
    return schema.isSubType(typeA, typeB);
  }
  if (isAbstractType(typeB)) {
    return schema.isSubType(typeB, typeA);
  }
  return false;
}
const GRAPHQL_MAX_INT = 2147483647;
const GRAPHQL_MIN_INT = -2147483648;
const GraphQLInt = new GraphQLScalarType({
  name: "Int",
  description: "The `Int` scalar type represents non-fractional signed whole numeric values. Int can represent values between -(2^31) and 2^31 - 1.",
  serialize(outputValue) {
    const coercedValue = serializeObject(outputValue);
    if (typeof coercedValue === "boolean") {
      return coercedValue ? 1 : 0;
    }
    let num = coercedValue;
    if (typeof coercedValue === "string" && coercedValue !== "") {
      num = Number(coercedValue);
    }
    if (typeof num !== "number" || !Number.isInteger(num)) {
      throw new GraphQLError(
        `Int cannot represent non-integer value: ${inspect(coercedValue)}`
      );
    }
    if (num > GRAPHQL_MAX_INT || num < GRAPHQL_MIN_INT) {
      throw new GraphQLError(
        "Int cannot represent non 32-bit signed integer value: " + inspect(coercedValue)
      );
    }
    return num;
  },
  parseValue(inputValue) {
    if (typeof inputValue !== "number" || !Number.isInteger(inputValue)) {
      throw new GraphQLError(
        `Int cannot represent non-integer value: ${inspect(inputValue)}`
      );
    }
    if (inputValue > GRAPHQL_MAX_INT || inputValue < GRAPHQL_MIN_INT) {
      throw new GraphQLError(
        `Int cannot represent non 32-bit signed integer value: ${inputValue}`
      );
    }
    return inputValue;
  },
  parseLiteral(valueNode) {
    if (valueNode.kind !== Kind.INT) {
      throw new GraphQLError(
        `Int cannot represent non-integer value: ${print(valueNode)}`,
        {
          nodes: valueNode
        }
      );
    }
    const num = parseInt(valueNode.value, 10);
    if (num > GRAPHQL_MAX_INT || num < GRAPHQL_MIN_INT) {
      throw new GraphQLError(
        `Int cannot represent non 32-bit signed integer value: ${valueNode.value}`,
        {
          nodes: valueNode
        }
      );
    }
    return num;
  }
});
const GraphQLFloat = new GraphQLScalarType({
  name: "Float",
  description: "The `Float` scalar type represents signed double-precision fractional values as specified by [IEEE 754](https://en.wikipedia.org/wiki/IEEE_floating_point).",
  serialize(outputValue) {
    const coercedValue = serializeObject(outputValue);
    if (typeof coercedValue === "boolean") {
      return coercedValue ? 1 : 0;
    }
    let num = coercedValue;
    if (typeof coercedValue === "string" && coercedValue !== "") {
      num = Number(coercedValue);
    }
    if (typeof num !== "number" || !Number.isFinite(num)) {
      throw new GraphQLError(
        `Float cannot represent non numeric value: ${inspect(coercedValue)}`
      );
    }
    return num;
  },
  parseValue(inputValue) {
    if (typeof inputValue !== "number" || !Number.isFinite(inputValue)) {
      throw new GraphQLError(
        `Float cannot represent non numeric value: ${inspect(inputValue)}`
      );
    }
    return inputValue;
  },
  parseLiteral(valueNode) {
    if (valueNode.kind !== Kind.FLOAT && valueNode.kind !== Kind.INT) {
      throw new GraphQLError(
        `Float cannot represent non numeric value: ${print(valueNode)}`,
        valueNode
      );
    }
    return parseFloat(valueNode.value);
  }
});
const GraphQLString = new GraphQLScalarType({
  name: "String",
  description: "The `String` scalar type represents textual data, represented as UTF-8 character sequences. The String type is most often used by GraphQL to represent free-form human-readable text.",
  serialize(outputValue) {
    const coercedValue = serializeObject(outputValue);
    if (typeof coercedValue === "string") {
      return coercedValue;
    }
    if (typeof coercedValue === "boolean") {
      return coercedValue ? "true" : "false";
    }
    if (typeof coercedValue === "number" && Number.isFinite(coercedValue)) {
      return coercedValue.toString();
    }
    throw new GraphQLError(
      `String cannot represent value: ${inspect(outputValue)}`
    );
  },
  parseValue(inputValue) {
    if (typeof inputValue !== "string") {
      throw new GraphQLError(
        `String cannot represent a non string value: ${inspect(inputValue)}`
      );
    }
    return inputValue;
  },
  parseLiteral(valueNode) {
    if (valueNode.kind !== Kind.STRING) {
      throw new GraphQLError(
        `String cannot represent a non string value: ${print(valueNode)}`,
        {
          nodes: valueNode
        }
      );
    }
    return valueNode.value;
  }
});
const GraphQLBoolean = new GraphQLScalarType({
  name: "Boolean",
  description: "The `Boolean` scalar type represents `true` or `false`.",
  serialize(outputValue) {
    const coercedValue = serializeObject(outputValue);
    if (typeof coercedValue === "boolean") {
      return coercedValue;
    }
    if (Number.isFinite(coercedValue)) {
      return coercedValue !== 0;
    }
    throw new GraphQLError(
      `Boolean cannot represent a non boolean value: ${inspect(coercedValue)}`
    );
  },
  parseValue(inputValue) {
    if (typeof inputValue !== "boolean") {
      throw new GraphQLError(
        `Boolean cannot represent a non boolean value: ${inspect(inputValue)}`
      );
    }
    return inputValue;
  },
  parseLiteral(valueNode) {
    if (valueNode.kind !== Kind.BOOLEAN) {
      throw new GraphQLError(
        `Boolean cannot represent a non boolean value: ${print(valueNode)}`,
        {
          nodes: valueNode
        }
      );
    }
    return valueNode.value;
  }
});
const GraphQLID = new GraphQLScalarType({
  name: "ID",
  description: 'The `ID` scalar type represents a unique identifier, often used to refetch an object or as key for a cache. The ID type appears in a JSON response as a String; however, it is not intended to be human-readable. When expected as an input type, any string (such as `"4"`) or integer (such as `4`) input value will be accepted as an ID.',
  serialize(outputValue) {
    const coercedValue = serializeObject(outputValue);
    if (typeof coercedValue === "string") {
      return coercedValue;
    }
    if (Number.isInteger(coercedValue)) {
      return String(coercedValue);
    }
    throw new GraphQLError(
      `ID cannot represent value: ${inspect(outputValue)}`
    );
  },
  parseValue(inputValue) {
    if (typeof inputValue === "string") {
      return inputValue;
    }
    if (typeof inputValue === "number" && Number.isInteger(inputValue)) {
      return inputValue.toString();
    }
    throw new GraphQLError(`ID cannot represent value: ${inspect(inputValue)}`);
  },
  parseLiteral(valueNode) {
    if (valueNode.kind !== Kind.STRING && valueNode.kind !== Kind.INT) {
      throw new GraphQLError(
        "ID cannot represent a non-string and non-integer value: " + print(valueNode),
        {
          nodes: valueNode
        }
      );
    }
    return valueNode.value;
  }
});
const specifiedScalarTypes = Object.freeze([
  GraphQLString,
  GraphQLInt,
  GraphQLFloat,
  GraphQLBoolean,
  GraphQLID
]);
function isSpecifiedScalarType(type) {
  return specifiedScalarTypes.some(({ name }) => type.name === name);
}
function serializeObject(outputValue) {
  if (isObjectLike(outputValue)) {
    if (typeof outputValue.valueOf === "function") {
      const valueOfResult = outputValue.valueOf();
      if (!isObjectLike(valueOfResult)) {
        return valueOfResult;
      }
    }
    if (typeof outputValue.toJSON === "function") {
      return outputValue.toJSON();
    }
  }
  return outputValue;
}
function isDirective(directive) {
  return instanceOf(directive, GraphQLDirective);
}
function assertDirective(directive) {
  if (!isDirective(directive)) {
    throw new Error(
      `Expected ${inspect(directive)} to be a GraphQL directive.`
    );
  }
  return directive;
}
class GraphQLDirective {
  constructor(config) {
    var _config$isRepeatable, _config$args;
    this.name = assertName(config.name);
    this.description = config.description;
    this.locations = config.locations;
    this.isRepeatable = (_config$isRepeatable = config.isRepeatable) !== null && _config$isRepeatable !== void 0 ? _config$isRepeatable : false;
    this.extensions = toObjMap(config.extensions);
    this.astNode = config.astNode;
    Array.isArray(config.locations) || devAssert(false, `@${config.name} locations must be an Array.`);
    const args = (_config$args = config.args) !== null && _config$args !== void 0 ? _config$args : {};
    isObjectLike(args) && !Array.isArray(args) || devAssert(
      false,
      `@${config.name} args must be an object with argument names as keys.`
    );
    this.args = defineArguments(args);
  }
  get [Symbol.toStringTag]() {
    return "GraphQLDirective";
  }
  toConfig() {
    return {
      name: this.name,
      description: this.description,
      locations: this.locations,
      args: argsToArgsConfig(this.args),
      isRepeatable: this.isRepeatable,
      extensions: this.extensions,
      astNode: this.astNode
    };
  }
  toString() {
    return "@" + this.name;
  }
  toJSON() {
    return this.toString();
  }
}
const GraphQLIncludeDirective = new GraphQLDirective({
  name: "include",
  description: "Directs the executor to include this field or fragment only when the `if` argument is true.",
  locations: [
    DirectiveLocation.FIELD,
    DirectiveLocation.FRAGMENT_SPREAD,
    DirectiveLocation.INLINE_FRAGMENT
  ],
  args: {
    if: {
      type: new GraphQLNonNull(GraphQLBoolean),
      description: "Included when true."
    }
  }
});
const GraphQLSkipDirective = new GraphQLDirective({
  name: "skip",
  description: "Directs the executor to skip this field or fragment when the `if` argument is true.",
  locations: [
    DirectiveLocation.FIELD,
    DirectiveLocation.FRAGMENT_SPREAD,
    DirectiveLocation.INLINE_FRAGMENT
  ],
  args: {
    if: {
      type: new GraphQLNonNull(GraphQLBoolean),
      description: "Skipped when true."
    }
  }
});
const DEFAULT_DEPRECATION_REASON = "No longer supported";
const GraphQLDeprecatedDirective = new GraphQLDirective({
  name: "deprecated",
  description: "Marks an element of a GraphQL schema as no longer supported.",
  locations: [
    DirectiveLocation.FIELD_DEFINITION,
    DirectiveLocation.ARGUMENT_DEFINITION,
    DirectiveLocation.INPUT_FIELD_DEFINITION,
    DirectiveLocation.ENUM_VALUE
  ],
  args: {
    reason: {
      type: GraphQLString,
      description: "Explains why this element was deprecated, usually also including a suggestion for how to access supported similar data. Formatted using the Markdown syntax, as specified by [CommonMark](https://commonmark.org/).",
      defaultValue: DEFAULT_DEPRECATION_REASON
    }
  }
});
const GraphQLSpecifiedByDirective = new GraphQLDirective({
  name: "specifiedBy",
  description: "Exposes a URL that specifies the behavior of this scalar.",
  locations: [DirectiveLocation.SCALAR],
  args: {
    url: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The URL that specifies the behavior of this scalar."
    }
  }
});
const specifiedDirectives = Object.freeze([
  GraphQLIncludeDirective,
  GraphQLSkipDirective,
  GraphQLDeprecatedDirective,
  GraphQLSpecifiedByDirective
]);
function isSpecifiedDirective(directive) {
  return specifiedDirectives.some(({ name }) => name === directive.name);
}
function isIterableObject(maybeIterable) {
  return typeof maybeIterable === "object" && typeof (maybeIterable === null || maybeIterable === void 0 ? void 0 : maybeIterable[Symbol.iterator]) === "function";
}
function astFromValue(value, type) {
  if (isNonNullType(type)) {
    const astValue = astFromValue(value, type.ofType);
    if ((astValue === null || astValue === void 0 ? void 0 : astValue.kind) === Kind.NULL) {
      return null;
    }
    return astValue;
  }
  if (value === null) {
    return {
      kind: Kind.NULL
    };
  }
  if (value === void 0) {
    return null;
  }
  if (isListType(type)) {
    const itemType = type.ofType;
    if (isIterableObject(value)) {
      const valuesNodes = [];
      for (const item of value) {
        const itemNode = astFromValue(item, itemType);
        if (itemNode != null) {
          valuesNodes.push(itemNode);
        }
      }
      return {
        kind: Kind.LIST,
        values: valuesNodes
      };
    }
    return astFromValue(value, itemType);
  }
  if (isInputObjectType(type)) {
    if (!isObjectLike(value)) {
      return null;
    }
    const fieldNodes = [];
    for (const field2 of Object.values(type.getFields())) {
      const fieldValue = astFromValue(value[field2.name], field2.type);
      if (fieldValue) {
        fieldNodes.push({
          kind: Kind.OBJECT_FIELD,
          name: {
            kind: Kind.NAME,
            value: field2.name
          },
          value: fieldValue
        });
      }
    }
    return {
      kind: Kind.OBJECT,
      fields: fieldNodes
    };
  }
  if (isLeafType(type)) {
    const serialized = type.serialize(value);
    if (serialized == null) {
      return null;
    }
    if (typeof serialized === "boolean") {
      return {
        kind: Kind.BOOLEAN,
        value: serialized
      };
    }
    if (typeof serialized === "number" && Number.isFinite(serialized)) {
      const stringNum = String(serialized);
      return integerStringRegExp.test(stringNum) ? {
        kind: Kind.INT,
        value: stringNum
      } : {
        kind: Kind.FLOAT,
        value: stringNum
      };
    }
    if (typeof serialized === "string") {
      if (isEnumType(type)) {
        return {
          kind: Kind.ENUM,
          value: serialized
        };
      }
      if (type === GraphQLID && integerStringRegExp.test(serialized)) {
        return {
          kind: Kind.INT,
          value: serialized
        };
      }
      return {
        kind: Kind.STRING,
        value: serialized
      };
    }
    throw new TypeError(`Cannot convert value to AST: ${inspect(serialized)}.`);
  }
  invariant(false, "Unexpected input type: " + inspect(type));
}
const integerStringRegExp = /^-?(?:0|[1-9][0-9]*)$/;
const __Schema = new GraphQLObjectType({
  name: "__Schema",
  description: "A GraphQL Schema defines the capabilities of a GraphQL server. It exposes all available types and directives on the server, as well as the entry points for query, mutation, and subscription operations.",
  fields: () => ({
    description: {
      type: GraphQLString,
      resolve: (schema) => schema.description
    },
    types: {
      description: "A list of all types supported by this server.",
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(__Type))),
      resolve(schema) {
        return Object.values(schema.getTypeMap());
      }
    },
    queryType: {
      description: "The type that query operations will be rooted at.",
      type: new GraphQLNonNull(__Type),
      resolve: (schema) => schema.getQueryType()
    },
    mutationType: {
      description: "If this server supports mutation, the type that mutation operations will be rooted at.",
      type: __Type,
      resolve: (schema) => schema.getMutationType()
    },
    subscriptionType: {
      description: "If this server support subscription, the type that subscription operations will be rooted at.",
      type: __Type,
      resolve: (schema) => schema.getSubscriptionType()
    },
    directives: {
      description: "A list of all directives supported by this server.",
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(__Directive))
      ),
      resolve: (schema) => schema.getDirectives()
    }
  })
});
const __Directive = new GraphQLObjectType({
  name: "__Directive",
  description: "A Directive provides a way to describe alternate runtime execution and type validation behavior in a GraphQL document.\n\nIn some cases, you need to provide options to alter GraphQL's execution behavior in ways field arguments will not suffice, such as conditionally including or skipping a field. Directives provide this by describing additional information to the executor.",
  fields: () => ({
    name: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: (directive) => directive.name
    },
    description: {
      type: GraphQLString,
      resolve: (directive) => directive.description
    },
    isRepeatable: {
      type: new GraphQLNonNull(GraphQLBoolean),
      resolve: (directive) => directive.isRepeatable
    },
    locations: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(__DirectiveLocation))
      ),
      resolve: (directive) => directive.locations
    },
    args: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(__InputValue))
      ),
      args: {
        includeDeprecated: {
          type: GraphQLBoolean,
          defaultValue: false
        }
      },
      resolve(field2, { includeDeprecated }) {
        return includeDeprecated ? field2.args : field2.args.filter((arg) => arg.deprecationReason == null);
      }
    }
  })
});
const __DirectiveLocation = new GraphQLEnumType({
  name: "__DirectiveLocation",
  description: "A Directive can be adjacent to many parts of the GraphQL language, a __DirectiveLocation describes one such possible adjacencies.",
  values: {
    QUERY: {
      value: DirectiveLocation.QUERY,
      description: "Location adjacent to a query operation."
    },
    MUTATION: {
      value: DirectiveLocation.MUTATION,
      description: "Location adjacent to a mutation operation."
    },
    SUBSCRIPTION: {
      value: DirectiveLocation.SUBSCRIPTION,
      description: "Location adjacent to a subscription operation."
    },
    FIELD: {
      value: DirectiveLocation.FIELD,
      description: "Location adjacent to a field."
    },
    FRAGMENT_DEFINITION: {
      value: DirectiveLocation.FRAGMENT_DEFINITION,
      description: "Location adjacent to a fragment definition."
    },
    FRAGMENT_SPREAD: {
      value: DirectiveLocation.FRAGMENT_SPREAD,
      description: "Location adjacent to a fragment spread."
    },
    INLINE_FRAGMENT: {
      value: DirectiveLocation.INLINE_FRAGMENT,
      description: "Location adjacent to an inline fragment."
    },
    VARIABLE_DEFINITION: {
      value: DirectiveLocation.VARIABLE_DEFINITION,
      description: "Location adjacent to a variable definition."
    },
    SCHEMA: {
      value: DirectiveLocation.SCHEMA,
      description: "Location adjacent to a schema definition."
    },
    SCALAR: {
      value: DirectiveLocation.SCALAR,
      description: "Location adjacent to a scalar definition."
    },
    OBJECT: {
      value: DirectiveLocation.OBJECT,
      description: "Location adjacent to an object type definition."
    },
    FIELD_DEFINITION: {
      value: DirectiveLocation.FIELD_DEFINITION,
      description: "Location adjacent to a field definition."
    },
    ARGUMENT_DEFINITION: {
      value: DirectiveLocation.ARGUMENT_DEFINITION,
      description: "Location adjacent to an argument definition."
    },
    INTERFACE: {
      value: DirectiveLocation.INTERFACE,
      description: "Location adjacent to an interface definition."
    },
    UNION: {
      value: DirectiveLocation.UNION,
      description: "Location adjacent to a union definition."
    },
    ENUM: {
      value: DirectiveLocation.ENUM,
      description: "Location adjacent to an enum definition."
    },
    ENUM_VALUE: {
      value: DirectiveLocation.ENUM_VALUE,
      description: "Location adjacent to an enum value definition."
    },
    INPUT_OBJECT: {
      value: DirectiveLocation.INPUT_OBJECT,
      description: "Location adjacent to an input object type definition."
    },
    INPUT_FIELD_DEFINITION: {
      value: DirectiveLocation.INPUT_FIELD_DEFINITION,
      description: "Location adjacent to an input object field definition."
    }
  }
});
const __Type = new GraphQLObjectType({
  name: "__Type",
  description: "The fundamental unit of any GraphQL Schema is the type. There are many kinds of types in GraphQL as represented by the `__TypeKind` enum.\n\nDepending on the kind of a type, certain fields describe information about that type. Scalar types provide no information beyond a name, description and optional `specifiedByURL`, while Enum types provide their values. Object and Interface types provide the fields they describe. Abstract types, Union and Interface, provide the Object types possible at runtime. List and NonNull types compose other types.",
  fields: () => ({
    kind: {
      type: new GraphQLNonNull(__TypeKind),
      resolve(type) {
        if (isScalarType(type)) {
          return TypeKind.SCALAR;
        }
        if (isObjectType(type)) {
          return TypeKind.OBJECT;
        }
        if (isInterfaceType(type)) {
          return TypeKind.INTERFACE;
        }
        if (isUnionType(type)) {
          return TypeKind.UNION;
        }
        if (isEnumType(type)) {
          return TypeKind.ENUM;
        }
        if (isInputObjectType(type)) {
          return TypeKind.INPUT_OBJECT;
        }
        if (isListType(type)) {
          return TypeKind.LIST;
        }
        if (isNonNullType(type)) {
          return TypeKind.NON_NULL;
        }
        invariant(false, `Unexpected type: "${inspect(type)}".`);
      }
    },
    name: {
      type: GraphQLString,
      resolve: (type) => "name" in type ? type.name : void 0
    },
    description: {
      type: GraphQLString,
      resolve: (type) => "description" in type ? type.description : void 0
    },
    specifiedByURL: {
      type: GraphQLString,
      resolve: (obj) => "specifiedByURL" in obj ? obj.specifiedByURL : void 0
    },
    fields: {
      type: new GraphQLList(new GraphQLNonNull(__Field)),
      args: {
        includeDeprecated: {
          type: GraphQLBoolean,
          defaultValue: false
        }
      },
      resolve(type, { includeDeprecated }) {
        if (isObjectType(type) || isInterfaceType(type)) {
          const fields = Object.values(type.getFields());
          return includeDeprecated ? fields : fields.filter((field2) => field2.deprecationReason == null);
        }
      }
    },
    interfaces: {
      type: new GraphQLList(new GraphQLNonNull(__Type)),
      resolve(type) {
        if (isObjectType(type) || isInterfaceType(type)) {
          return type.getInterfaces();
        }
      }
    },
    possibleTypes: {
      type: new GraphQLList(new GraphQLNonNull(__Type)),
      resolve(type, _args, _context, { schema }) {
        if (isAbstractType(type)) {
          return schema.getPossibleTypes(type);
        }
      }
    },
    enumValues: {
      type: new GraphQLList(new GraphQLNonNull(__EnumValue)),
      args: {
        includeDeprecated: {
          type: GraphQLBoolean,
          defaultValue: false
        }
      },
      resolve(type, { includeDeprecated }) {
        if (isEnumType(type)) {
          const values = type.getValues();
          return includeDeprecated ? values : values.filter((field2) => field2.deprecationReason == null);
        }
      }
    },
    inputFields: {
      type: new GraphQLList(new GraphQLNonNull(__InputValue)),
      args: {
        includeDeprecated: {
          type: GraphQLBoolean,
          defaultValue: false
        }
      },
      resolve(type, { includeDeprecated }) {
        if (isInputObjectType(type)) {
          const values = Object.values(type.getFields());
          return includeDeprecated ? values : values.filter((field2) => field2.deprecationReason == null);
        }
      }
    },
    ofType: {
      type: __Type,
      resolve: (type) => "ofType" in type ? type.ofType : void 0
    }
  })
});
const __Field = new GraphQLObjectType({
  name: "__Field",
  description: "Object and Interface types are described by a list of Fields, each of which has a name, potentially a list of arguments, and a return type.",
  fields: () => ({
    name: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: (field2) => field2.name
    },
    description: {
      type: GraphQLString,
      resolve: (field2) => field2.description
    },
    args: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(__InputValue))
      ),
      args: {
        includeDeprecated: {
          type: GraphQLBoolean,
          defaultValue: false
        }
      },
      resolve(field2, { includeDeprecated }) {
        return includeDeprecated ? field2.args : field2.args.filter((arg) => arg.deprecationReason == null);
      }
    },
    type: {
      type: new GraphQLNonNull(__Type),
      resolve: (field2) => field2.type
    },
    isDeprecated: {
      type: new GraphQLNonNull(GraphQLBoolean),
      resolve: (field2) => field2.deprecationReason != null
    },
    deprecationReason: {
      type: GraphQLString,
      resolve: (field2) => field2.deprecationReason
    }
  })
});
const __InputValue = new GraphQLObjectType({
  name: "__InputValue",
  description: "Arguments provided to Fields or Directives and the input fields of an InputObject are represented as Input Values which describe their type and optionally a default value.",
  fields: () => ({
    name: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: (inputValue) => inputValue.name
    },
    description: {
      type: GraphQLString,
      resolve: (inputValue) => inputValue.description
    },
    type: {
      type: new GraphQLNonNull(__Type),
      resolve: (inputValue) => inputValue.type
    },
    defaultValue: {
      type: GraphQLString,
      description: "A GraphQL-formatted string representing the default value for this input value.",
      resolve(inputValue) {
        const { type, defaultValue } = inputValue;
        const valueAST = astFromValue(defaultValue, type);
        return valueAST ? print(valueAST) : null;
      }
    },
    isDeprecated: {
      type: new GraphQLNonNull(GraphQLBoolean),
      resolve: (field2) => field2.deprecationReason != null
    },
    deprecationReason: {
      type: GraphQLString,
      resolve: (obj) => obj.deprecationReason
    }
  })
});
const __EnumValue = new GraphQLObjectType({
  name: "__EnumValue",
  description: "One possible value for a given Enum. Enum values are unique values, not a placeholder for a string or numeric value. However an Enum value is returned in a JSON response as a string.",
  fields: () => ({
    name: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: (enumValue) => enumValue.name
    },
    description: {
      type: GraphQLString,
      resolve: (enumValue) => enumValue.description
    },
    isDeprecated: {
      type: new GraphQLNonNull(GraphQLBoolean),
      resolve: (enumValue) => enumValue.deprecationReason != null
    },
    deprecationReason: {
      type: GraphQLString,
      resolve: (enumValue) => enumValue.deprecationReason
    }
  })
});
var TypeKind;
(function(TypeKind2) {
  TypeKind2["SCALAR"] = "SCALAR";
  TypeKind2["OBJECT"] = "OBJECT";
  TypeKind2["INTERFACE"] = "INTERFACE";
  TypeKind2["UNION"] = "UNION";
  TypeKind2["ENUM"] = "ENUM";
  TypeKind2["INPUT_OBJECT"] = "INPUT_OBJECT";
  TypeKind2["LIST"] = "LIST";
  TypeKind2["NON_NULL"] = "NON_NULL";
})(TypeKind || (TypeKind = {}));
const __TypeKind = new GraphQLEnumType({
  name: "__TypeKind",
  description: "An enum describing what kind of type a given `__Type` is.",
  values: {
    SCALAR: {
      value: TypeKind.SCALAR,
      description: "Indicates this type is a scalar."
    },
    OBJECT: {
      value: TypeKind.OBJECT,
      description: "Indicates this type is an object. `fields` and `interfaces` are valid fields."
    },
    INTERFACE: {
      value: TypeKind.INTERFACE,
      description: "Indicates this type is an interface. `fields`, `interfaces`, and `possibleTypes` are valid fields."
    },
    UNION: {
      value: TypeKind.UNION,
      description: "Indicates this type is a union. `possibleTypes` is a valid field."
    },
    ENUM: {
      value: TypeKind.ENUM,
      description: "Indicates this type is an enum. `enumValues` is a valid field."
    },
    INPUT_OBJECT: {
      value: TypeKind.INPUT_OBJECT,
      description: "Indicates this type is an input object. `inputFields` is a valid field."
    },
    LIST: {
      value: TypeKind.LIST,
      description: "Indicates this type is a list. `ofType` is a valid field."
    },
    NON_NULL: {
      value: TypeKind.NON_NULL,
      description: "Indicates this type is a non-null. `ofType` is a valid field."
    }
  }
});
const SchemaMetaFieldDef = {
  name: "__schema",
  type: new GraphQLNonNull(__Schema),
  description: "Access the current type schema of this server.",
  args: [],
  resolve: (_source, _args, _context, { schema }) => schema,
  deprecationReason: void 0,
  extensions: /* @__PURE__ */ Object.create(null),
  astNode: void 0
};
const TypeMetaFieldDef = {
  name: "__type",
  type: __Type,
  description: "Request the type information of a single type.",
  args: [
    {
      name: "name",
      description: void 0,
      type: new GraphQLNonNull(GraphQLString),
      defaultValue: void 0,
      deprecationReason: void 0,
      extensions: /* @__PURE__ */ Object.create(null),
      astNode: void 0
    }
  ],
  resolve: (_source, { name }, _context, { schema }) => schema.getType(name),
  deprecationReason: void 0,
  extensions: /* @__PURE__ */ Object.create(null),
  astNode: void 0
};
const TypeNameMetaFieldDef = {
  name: "__typename",
  type: new GraphQLNonNull(GraphQLString),
  description: "The name of the current Object type at runtime.",
  args: [],
  resolve: (_source, _args, _context, { parentType }) => parentType.name,
  deprecationReason: void 0,
  extensions: /* @__PURE__ */ Object.create(null),
  astNode: void 0
};
const introspectionTypes = Object.freeze([
  __Schema,
  __Directive,
  __DirectiveLocation,
  __Type,
  __Field,
  __InputValue,
  __EnumValue,
  __TypeKind
]);
function isIntrospectionType(type) {
  return introspectionTypes.some(({ name }) => type.name === name);
}
function isSchema(schema) {
  return instanceOf(schema, GraphQLSchema);
}
function assertSchema(schema) {
  if (!isSchema(schema)) {
    throw new Error(`Expected ${inspect(schema)} to be a GraphQL schema.`);
  }
  return schema;
}
class GraphQLSchema {
  constructor(config) {
    var _config$extensionASTN, _config$directives;
    this.__validationErrors = config.assumeValid === true ? [] : void 0;
    isObjectLike(config) || devAssert(false, "Must provide configuration object.");
    !config.types || Array.isArray(config.types) || devAssert(
      false,
      `"types" must be Array if provided but got: ${inspect(config.types)}.`
    );
    !config.directives || Array.isArray(config.directives) || devAssert(
      false,
      `"directives" must be Array if provided but got: ${inspect(config.directives)}.`
    );
    this.description = config.description;
    this.extensions = toObjMap(config.extensions);
    this.astNode = config.astNode;
    this.extensionASTNodes = (_config$extensionASTN = config.extensionASTNodes) !== null && _config$extensionASTN !== void 0 ? _config$extensionASTN : [];
    this._queryType = config.query;
    this._mutationType = config.mutation;
    this._subscriptionType = config.subscription;
    this._directives = (_config$directives = config.directives) !== null && _config$directives !== void 0 ? _config$directives : specifiedDirectives;
    const allReferencedTypes = new Set(config.types);
    if (config.types != null) {
      for (const type of config.types) {
        allReferencedTypes.delete(type);
        collectReferencedTypes(type, allReferencedTypes);
      }
    }
    if (this._queryType != null) {
      collectReferencedTypes(this._queryType, allReferencedTypes);
    }
    if (this._mutationType != null) {
      collectReferencedTypes(this._mutationType, allReferencedTypes);
    }
    if (this._subscriptionType != null) {
      collectReferencedTypes(this._subscriptionType, allReferencedTypes);
    }
    for (const directive of this._directives) {
      if (isDirective(directive)) {
        for (const arg of directive.args) {
          collectReferencedTypes(arg.type, allReferencedTypes);
        }
      }
    }
    collectReferencedTypes(__Schema, allReferencedTypes);
    this._typeMap = /* @__PURE__ */ Object.create(null);
    this._subTypeMap = /* @__PURE__ */ Object.create(null);
    this._implementationsMap = /* @__PURE__ */ Object.create(null);
    for (const namedType of allReferencedTypes) {
      if (namedType == null) {
        continue;
      }
      const typeName = namedType.name;
      typeName || devAssert(
        false,
        "One of the provided types for building the Schema is missing a name."
      );
      if (this._typeMap[typeName] !== void 0) {
        throw new Error(
          `Schema must contain uniquely named types but contains multiple types named "${typeName}".`
        );
      }
      this._typeMap[typeName] = namedType;
      if (isInterfaceType(namedType)) {
        for (const iface of namedType.getInterfaces()) {
          if (isInterfaceType(iface)) {
            let implementations = this._implementationsMap[iface.name];
            if (implementations === void 0) {
              implementations = this._implementationsMap[iface.name] = {
                objects: [],
                interfaces: []
              };
            }
            implementations.interfaces.push(namedType);
          }
        }
      } else if (isObjectType(namedType)) {
        for (const iface of namedType.getInterfaces()) {
          if (isInterfaceType(iface)) {
            let implementations = this._implementationsMap[iface.name];
            if (implementations === void 0) {
              implementations = this._implementationsMap[iface.name] = {
                objects: [],
                interfaces: []
              };
            }
            implementations.objects.push(namedType);
          }
        }
      }
    }
  }
  get [Symbol.toStringTag]() {
    return "GraphQLSchema";
  }
  getQueryType() {
    return this._queryType;
  }
  getMutationType() {
    return this._mutationType;
  }
  getSubscriptionType() {
    return this._subscriptionType;
  }
  getRootType(operation) {
    switch (operation) {
      case OperationTypeNode.QUERY:
        return this.getQueryType();
      case OperationTypeNode.MUTATION:
        return this.getMutationType();
      case OperationTypeNode.SUBSCRIPTION:
        return this.getSubscriptionType();
    }
  }
  getTypeMap() {
    return this._typeMap;
  }
  getType(name) {
    return this.getTypeMap()[name];
  }
  getPossibleTypes(abstractType) {
    return isUnionType(abstractType) ? abstractType.getTypes() : this.getImplementations(abstractType).objects;
  }
  getImplementations(interfaceType) {
    const implementations = this._implementationsMap[interfaceType.name];
    return implementations !== null && implementations !== void 0 ? implementations : {
      objects: [],
      interfaces: []
    };
  }
  isSubType(abstractType, maybeSubType) {
    let map = this._subTypeMap[abstractType.name];
    if (map === void 0) {
      map = /* @__PURE__ */ Object.create(null);
      if (isUnionType(abstractType)) {
        for (const type of abstractType.getTypes()) {
          map[type.name] = true;
        }
      } else {
        const implementations = this.getImplementations(abstractType);
        for (const type of implementations.objects) {
          map[type.name] = true;
        }
        for (const type of implementations.interfaces) {
          map[type.name] = true;
        }
      }
      this._subTypeMap[abstractType.name] = map;
    }
    return map[maybeSubType.name] !== void 0;
  }
  getDirectives() {
    return this._directives;
  }
  getDirective(name) {
    return this.getDirectives().find((directive) => directive.name === name);
  }
  toConfig() {
    return {
      description: this.description,
      query: this.getQueryType(),
      mutation: this.getMutationType(),
      subscription: this.getSubscriptionType(),
      types: Object.values(this.getTypeMap()),
      directives: this.getDirectives(),
      extensions: this.extensions,
      astNode: this.astNode,
      extensionASTNodes: this.extensionASTNodes,
      assumeValid: this.__validationErrors !== void 0
    };
  }
}
function collectReferencedTypes(type, typeSet) {
  const namedType = getNamedType(type);
  if (!typeSet.has(namedType)) {
    typeSet.add(namedType);
    if (isUnionType(namedType)) {
      for (const memberType of namedType.getTypes()) {
        collectReferencedTypes(memberType, typeSet);
      }
    } else if (isObjectType(namedType) || isInterfaceType(namedType)) {
      for (const interfaceType of namedType.getInterfaces()) {
        collectReferencedTypes(interfaceType, typeSet);
      }
      for (const field2 of Object.values(namedType.getFields())) {
        collectReferencedTypes(field2.type, typeSet);
        for (const arg of field2.args) {
          collectReferencedTypes(arg.type, typeSet);
        }
      }
    } else if (isInputObjectType(namedType)) {
      for (const field2 of Object.values(namedType.getFields())) {
        collectReferencedTypes(field2.type, typeSet);
      }
    }
  }
  return typeSet;
}
function validateSchema(schema) {
  assertSchema(schema);
  if (schema.__validationErrors) {
    return schema.__validationErrors;
  }
  const context = new SchemaValidationContext(schema);
  validateRootTypes(context);
  validateDirectives(context);
  validateTypes(context);
  const errors2 = context.getErrors();
  schema.__validationErrors = errors2;
  return errors2;
}
function assertValidSchema(schema) {
  const errors2 = validateSchema(schema);
  if (errors2.length !== 0) {
    throw new Error(errors2.map((error2) => error2.message).join("\n\n"));
  }
}
class SchemaValidationContext {
  constructor(schema) {
    this._errors = [];
    this.schema = schema;
  }
  reportError(message, nodes) {
    const _nodes = Array.isArray(nodes) ? nodes.filter(Boolean) : nodes;
    this._errors.push(
      new GraphQLError(message, {
        nodes: _nodes
      })
    );
  }
  getErrors() {
    return this._errors;
  }
}
function validateRootTypes(context) {
  const schema = context.schema;
  const queryType = schema.getQueryType();
  if (!queryType) {
    context.reportError("Query root type must be provided.", schema.astNode);
  } else if (!isObjectType(queryType)) {
    var _getOperationTypeNode;
    context.reportError(
      `Query root type must be Object type, it cannot be ${inspect(
        queryType
      )}.`,
      (_getOperationTypeNode = getOperationTypeNode(
        schema,
        OperationTypeNode.QUERY
      )) !== null && _getOperationTypeNode !== void 0 ? _getOperationTypeNode : queryType.astNode
    );
  }
  const mutationType = schema.getMutationType();
  if (mutationType && !isObjectType(mutationType)) {
    var _getOperationTypeNode2;
    context.reportError(
      `Mutation root type must be Object type if provided, it cannot be ${inspect(mutationType)}.`,
      (_getOperationTypeNode2 = getOperationTypeNode(
        schema,
        OperationTypeNode.MUTATION
      )) !== null && _getOperationTypeNode2 !== void 0 ? _getOperationTypeNode2 : mutationType.astNode
    );
  }
  const subscriptionType = schema.getSubscriptionType();
  if (subscriptionType && !isObjectType(subscriptionType)) {
    var _getOperationTypeNode3;
    context.reportError(
      `Subscription root type must be Object type if provided, it cannot be ${inspect(subscriptionType)}.`,
      (_getOperationTypeNode3 = getOperationTypeNode(
        schema,
        OperationTypeNode.SUBSCRIPTION
      )) !== null && _getOperationTypeNode3 !== void 0 ? _getOperationTypeNode3 : subscriptionType.astNode
    );
  }
}
function getOperationTypeNode(schema, operation) {
  var _flatMap$find;
  return (_flatMap$find = [schema.astNode, ...schema.extensionASTNodes].flatMap(
    (schemaNode) => {
      var _schemaNode$operation;
      return (_schemaNode$operation = schemaNode === null || schemaNode === void 0 ? void 0 : schemaNode.operationTypes) !== null && _schemaNode$operation !== void 0 ? _schemaNode$operation : [];
    }
  ).find((operationNode) => operationNode.operation === operation)) === null || _flatMap$find === void 0 ? void 0 : _flatMap$find.type;
}
function validateDirectives(context) {
  for (const directive of context.schema.getDirectives()) {
    if (!isDirective(directive)) {
      context.reportError(
        `Expected directive but got: ${inspect(directive)}.`,
        directive === null || directive === void 0 ? void 0 : directive.astNode
      );
      continue;
    }
    validateName(context, directive);
    for (const arg of directive.args) {
      validateName(context, arg);
      if (!isInputType(arg.type)) {
        context.reportError(
          `The type of @${directive.name}(${arg.name}:) must be Input Type but got: ${inspect(arg.type)}.`,
          arg.astNode
        );
      }
      if (isRequiredArgument(arg) && arg.deprecationReason != null) {
        var _arg$astNode;
        context.reportError(
          `Required argument @${directive.name}(${arg.name}:) cannot be deprecated.`,
          [
            getDeprecatedDirectiveNode(arg.astNode),
            (_arg$astNode = arg.astNode) === null || _arg$astNode === void 0 ? void 0 : _arg$astNode.type
          ]
        );
      }
    }
  }
}
function validateName(context, node) {
  if (node.name.startsWith("__")) {
    context.reportError(
      `Name "${node.name}" must not begin with "__", which is reserved by GraphQL introspection.`,
      node.astNode
    );
  }
}
function validateTypes(context) {
  const validateInputObjectCircularRefs = createInputObjectCircularRefsValidator(context);
  const typeMap = context.schema.getTypeMap();
  for (const type of Object.values(typeMap)) {
    if (!isNamedType(type)) {
      context.reportError(
        `Expected GraphQL named type but got: ${inspect(type)}.`,
        type.astNode
      );
      continue;
    }
    if (!isIntrospectionType(type)) {
      validateName(context, type);
    }
    if (isObjectType(type)) {
      validateFields(context, type);
      validateInterfaces(context, type);
    } else if (isInterfaceType(type)) {
      validateFields(context, type);
      validateInterfaces(context, type);
    } else if (isUnionType(type)) {
      validateUnionMembers(context, type);
    } else if (isEnumType(type)) {
      validateEnumValues(context, type);
    } else if (isInputObjectType(type)) {
      validateInputFields(context, type);
      validateInputObjectCircularRefs(type);
    }
  }
}
function validateFields(context, type) {
  const fields = Object.values(type.getFields());
  if (fields.length === 0) {
    context.reportError(`Type ${type.name} must define one or more fields.`, [
      type.astNode,
      ...type.extensionASTNodes
    ]);
  }
  for (const field2 of fields) {
    validateName(context, field2);
    if (!isOutputType(field2.type)) {
      var _field$astNode;
      context.reportError(
        `The type of ${type.name}.${field2.name} must be Output Type but got: ${inspect(field2.type)}.`,
        (_field$astNode = field2.astNode) === null || _field$astNode === void 0 ? void 0 : _field$astNode.type
      );
    }
    for (const arg of field2.args) {
      const argName = arg.name;
      validateName(context, arg);
      if (!isInputType(arg.type)) {
        var _arg$astNode2;
        context.reportError(
          `The type of ${type.name}.${field2.name}(${argName}:) must be Input Type but got: ${inspect(arg.type)}.`,
          (_arg$astNode2 = arg.astNode) === null || _arg$astNode2 === void 0 ? void 0 : _arg$astNode2.type
        );
      }
      if (isRequiredArgument(arg) && arg.deprecationReason != null) {
        var _arg$astNode3;
        context.reportError(
          `Required argument ${type.name}.${field2.name}(${argName}:) cannot be deprecated.`,
          [
            getDeprecatedDirectiveNode(arg.astNode),
            (_arg$astNode3 = arg.astNode) === null || _arg$astNode3 === void 0 ? void 0 : _arg$astNode3.type
          ]
        );
      }
    }
  }
}
function validateInterfaces(context, type) {
  const ifaceTypeNames = /* @__PURE__ */ Object.create(null);
  for (const iface of type.getInterfaces()) {
    if (!isInterfaceType(iface)) {
      context.reportError(
        `Type ${inspect(type)} must only implement Interface types, it cannot implement ${inspect(iface)}.`,
        getAllImplementsInterfaceNodes(type, iface)
      );
      continue;
    }
    if (type === iface) {
      context.reportError(
        `Type ${type.name} cannot implement itself because it would create a circular reference.`,
        getAllImplementsInterfaceNodes(type, iface)
      );
      continue;
    }
    if (ifaceTypeNames[iface.name]) {
      context.reportError(
        `Type ${type.name} can only implement ${iface.name} once.`,
        getAllImplementsInterfaceNodes(type, iface)
      );
      continue;
    }
    ifaceTypeNames[iface.name] = true;
    validateTypeImplementsAncestors(context, type, iface);
    validateTypeImplementsInterface(context, type, iface);
  }
}
function validateTypeImplementsInterface(context, type, iface) {
  const typeFieldMap = type.getFields();
  for (const ifaceField of Object.values(iface.getFields())) {
    const fieldName = ifaceField.name;
    const typeField = typeFieldMap[fieldName];
    if (!typeField) {
      context.reportError(
        `Interface field ${iface.name}.${fieldName} expected but ${type.name} does not provide it.`,
        [ifaceField.astNode, type.astNode, ...type.extensionASTNodes]
      );
      continue;
    }
    if (!isTypeSubTypeOf(context.schema, typeField.type, ifaceField.type)) {
      var _ifaceField$astNode, _typeField$astNode;
      context.reportError(
        `Interface field ${iface.name}.${fieldName} expects type ${inspect(ifaceField.type)} but ${type.name}.${fieldName} is type ${inspect(typeField.type)}.`,
        [
          (_ifaceField$astNode = ifaceField.astNode) === null || _ifaceField$astNode === void 0 ? void 0 : _ifaceField$astNode.type,
          (_typeField$astNode = typeField.astNode) === null || _typeField$astNode === void 0 ? void 0 : _typeField$astNode.type
        ]
      );
    }
    for (const ifaceArg of ifaceField.args) {
      const argName = ifaceArg.name;
      const typeArg = typeField.args.find((arg) => arg.name === argName);
      if (!typeArg) {
        context.reportError(
          `Interface field argument ${iface.name}.${fieldName}(${argName}:) expected but ${type.name}.${fieldName} does not provide it.`,
          [ifaceArg.astNode, typeField.astNode]
        );
        continue;
      }
      if (!isEqualType(ifaceArg.type, typeArg.type)) {
        var _ifaceArg$astNode, _typeArg$astNode;
        context.reportError(
          `Interface field argument ${iface.name}.${fieldName}(${argName}:) expects type ${inspect(ifaceArg.type)} but ${type.name}.${fieldName}(${argName}:) is type ${inspect(typeArg.type)}.`,
          [
            (_ifaceArg$astNode = ifaceArg.astNode) === null || _ifaceArg$astNode === void 0 ? void 0 : _ifaceArg$astNode.type,
            (_typeArg$astNode = typeArg.astNode) === null || _typeArg$astNode === void 0 ? void 0 : _typeArg$astNode.type
          ]
        );
      }
    }
    for (const typeArg of typeField.args) {
      const argName = typeArg.name;
      const ifaceArg = ifaceField.args.find((arg) => arg.name === argName);
      if (!ifaceArg && isRequiredArgument(typeArg)) {
        context.reportError(
          `Object field ${type.name}.${fieldName} includes required argument ${argName} that is missing from the Interface field ${iface.name}.${fieldName}.`,
          [typeArg.astNode, ifaceField.astNode]
        );
      }
    }
  }
}
function validateTypeImplementsAncestors(context, type, iface) {
  const ifaceInterfaces = type.getInterfaces();
  for (const transitive of iface.getInterfaces()) {
    if (!ifaceInterfaces.includes(transitive)) {
      context.reportError(
        transitive === type ? `Type ${type.name} cannot implement ${iface.name} because it would create a circular reference.` : `Type ${type.name} must implement ${transitive.name} because it is implemented by ${iface.name}.`,
        [
          ...getAllImplementsInterfaceNodes(iface, transitive),
          ...getAllImplementsInterfaceNodes(type, iface)
        ]
      );
    }
  }
}
function validateUnionMembers(context, union) {
  const memberTypes = union.getTypes();
  if (memberTypes.length === 0) {
    context.reportError(
      `Union type ${union.name} must define one or more member types.`,
      [union.astNode, ...union.extensionASTNodes]
    );
  }
  const includedTypeNames = /* @__PURE__ */ Object.create(null);
  for (const memberType of memberTypes) {
    if (includedTypeNames[memberType.name]) {
      context.reportError(
        `Union type ${union.name} can only include type ${memberType.name} once.`,
        getUnionMemberTypeNodes(union, memberType.name)
      );
      continue;
    }
    includedTypeNames[memberType.name] = true;
    if (!isObjectType(memberType)) {
      context.reportError(
        `Union type ${union.name} can only include Object types, it cannot include ${inspect(memberType)}.`,
        getUnionMemberTypeNodes(union, String(memberType))
      );
    }
  }
}
function validateEnumValues(context, enumType) {
  const enumValues = enumType.getValues();
  if (enumValues.length === 0) {
    context.reportError(
      `Enum type ${enumType.name} must define one or more values.`,
      [enumType.astNode, ...enumType.extensionASTNodes]
    );
  }
  for (const enumValue of enumValues) {
    validateName(context, enumValue);
  }
}
function validateInputFields(context, inputObj) {
  const fields = Object.values(inputObj.getFields());
  if (fields.length === 0) {
    context.reportError(
      `Input Object type ${inputObj.name} must define one or more fields.`,
      [inputObj.astNode, ...inputObj.extensionASTNodes]
    );
  }
  for (const field2 of fields) {
    validateName(context, field2);
    if (!isInputType(field2.type)) {
      var _field$astNode2;
      context.reportError(
        `The type of ${inputObj.name}.${field2.name} must be Input Type but got: ${inspect(field2.type)}.`,
        (_field$astNode2 = field2.astNode) === null || _field$astNode2 === void 0 ? void 0 : _field$astNode2.type
      );
    }
    if (isRequiredInputField(field2) && field2.deprecationReason != null) {
      var _field$astNode3;
      context.reportError(
        `Required input field ${inputObj.name}.${field2.name} cannot be deprecated.`,
        [
          getDeprecatedDirectiveNode(field2.astNode),
          (_field$astNode3 = field2.astNode) === null || _field$astNode3 === void 0 ? void 0 : _field$astNode3.type
        ]
      );
    }
  }
}
function createInputObjectCircularRefsValidator(context) {
  const visitedTypes = /* @__PURE__ */ Object.create(null);
  const fieldPath = [];
  const fieldPathIndexByTypeName = /* @__PURE__ */ Object.create(null);
  return detectCycleRecursive;
  function detectCycleRecursive(inputObj) {
    if (visitedTypes[inputObj.name]) {
      return;
    }
    visitedTypes[inputObj.name] = true;
    fieldPathIndexByTypeName[inputObj.name] = fieldPath.length;
    const fields = Object.values(inputObj.getFields());
    for (const field2 of fields) {
      if (isNonNullType(field2.type) && isInputObjectType(field2.type.ofType)) {
        const fieldType = field2.type.ofType;
        const cycleIndex = fieldPathIndexByTypeName[fieldType.name];
        fieldPath.push(field2);
        if (cycleIndex === void 0) {
          detectCycleRecursive(fieldType);
        } else {
          const cyclePath = fieldPath.slice(cycleIndex);
          const pathStr = cyclePath.map((fieldObj) => fieldObj.name).join(".");
          context.reportError(
            `Cannot reference Input Object "${fieldType.name}" within itself through a series of non-null fields: "${pathStr}".`,
            cyclePath.map((fieldObj) => fieldObj.astNode)
          );
        }
        fieldPath.pop();
      }
    }
    fieldPathIndexByTypeName[inputObj.name] = void 0;
  }
}
function getAllImplementsInterfaceNodes(type, iface) {
  const { astNode, extensionASTNodes } = type;
  const nodes = astNode != null ? [astNode, ...extensionASTNodes] : extensionASTNodes;
  return nodes.flatMap((typeNode) => {
    var _typeNode$interfaces;
    return (_typeNode$interfaces = typeNode.interfaces) !== null && _typeNode$interfaces !== void 0 ? _typeNode$interfaces : [];
  }).filter((ifaceNode) => ifaceNode.name.value === iface.name);
}
function getUnionMemberTypeNodes(union, typeName) {
  const { astNode, extensionASTNodes } = union;
  const nodes = astNode != null ? [astNode, ...extensionASTNodes] : extensionASTNodes;
  return nodes.flatMap((unionNode) => {
    var _unionNode$types;
    return (_unionNode$types = unionNode.types) !== null && _unionNode$types !== void 0 ? _unionNode$types : [];
  }).filter((typeNode) => typeNode.name.value === typeName);
}
function getDeprecatedDirectiveNode(definitionNode) {
  var _definitionNode$direc;
  return definitionNode === null || definitionNode === void 0 ? void 0 : (_definitionNode$direc = definitionNode.directives) === null || _definitionNode$direc === void 0 ? void 0 : _definitionNode$direc.find(
    (node) => node.name.value === GraphQLDeprecatedDirective.name
  );
}
function typeFromAST(schema, typeNode) {
  switch (typeNode.kind) {
    case Kind.LIST_TYPE: {
      const innerType = typeFromAST(schema, typeNode.type);
      return innerType && new GraphQLList(innerType);
    }
    case Kind.NON_NULL_TYPE: {
      const innerType = typeFromAST(schema, typeNode.type);
      return innerType && new GraphQLNonNull(innerType);
    }
    case Kind.NAMED_TYPE:
      return schema.getType(typeNode.name.value);
  }
}
class TypeInfo {
  constructor(schema, initialType, getFieldDefFn) {
    this._schema = schema;
    this._typeStack = [];
    this._parentTypeStack = [];
    this._inputTypeStack = [];
    this._fieldDefStack = [];
    this._defaultValueStack = [];
    this._directive = null;
    this._argument = null;
    this._enumValue = null;
    this._getFieldDef = getFieldDefFn !== null && getFieldDefFn !== void 0 ? getFieldDefFn : getFieldDef$1;
    if (initialType) {
      if (isInputType(initialType)) {
        this._inputTypeStack.push(initialType);
      }
      if (isCompositeType(initialType)) {
        this._parentTypeStack.push(initialType);
      }
      if (isOutputType(initialType)) {
        this._typeStack.push(initialType);
      }
    }
  }
  get [Symbol.toStringTag]() {
    return "TypeInfo";
  }
  getType() {
    if (this._typeStack.length > 0) {
      return this._typeStack[this._typeStack.length - 1];
    }
  }
  getParentType() {
    if (this._parentTypeStack.length > 0) {
      return this._parentTypeStack[this._parentTypeStack.length - 1];
    }
  }
  getInputType() {
    if (this._inputTypeStack.length > 0) {
      return this._inputTypeStack[this._inputTypeStack.length - 1];
    }
  }
  getParentInputType() {
    if (this._inputTypeStack.length > 1) {
      return this._inputTypeStack[this._inputTypeStack.length - 2];
    }
  }
  getFieldDef() {
    if (this._fieldDefStack.length > 0) {
      return this._fieldDefStack[this._fieldDefStack.length - 1];
    }
  }
  getDefaultValue() {
    if (this._defaultValueStack.length > 0) {
      return this._defaultValueStack[this._defaultValueStack.length - 1];
    }
  }
  getDirective() {
    return this._directive;
  }
  getArgument() {
    return this._argument;
  }
  getEnumValue() {
    return this._enumValue;
  }
  enter(node) {
    const schema = this._schema;
    switch (node.kind) {
      case Kind.SELECTION_SET: {
        const namedType = getNamedType(this.getType());
        this._parentTypeStack.push(
          isCompositeType(namedType) ? namedType : void 0
        );
        break;
      }
      case Kind.FIELD: {
        const parentType = this.getParentType();
        let fieldDef;
        let fieldType;
        if (parentType) {
          fieldDef = this._getFieldDef(schema, parentType, node);
          if (fieldDef) {
            fieldType = fieldDef.type;
          }
        }
        this._fieldDefStack.push(fieldDef);
        this._typeStack.push(isOutputType(fieldType) ? fieldType : void 0);
        break;
      }
      case Kind.DIRECTIVE:
        this._directive = schema.getDirective(node.name.value);
        break;
      case Kind.OPERATION_DEFINITION: {
        const rootType = schema.getRootType(node.operation);
        this._typeStack.push(isObjectType(rootType) ? rootType : void 0);
        break;
      }
      case Kind.INLINE_FRAGMENT:
      case Kind.FRAGMENT_DEFINITION: {
        const typeConditionAST = node.typeCondition;
        const outputType = typeConditionAST ? typeFromAST(schema, typeConditionAST) : getNamedType(this.getType());
        this._typeStack.push(isOutputType(outputType) ? outputType : void 0);
        break;
      }
      case Kind.VARIABLE_DEFINITION: {
        const inputType = typeFromAST(schema, node.type);
        this._inputTypeStack.push(
          isInputType(inputType) ? inputType : void 0
        );
        break;
      }
      case Kind.ARGUMENT: {
        var _this$getDirective;
        let argDef;
        let argType;
        const fieldOrDirective = (_this$getDirective = this.getDirective()) !== null && _this$getDirective !== void 0 ? _this$getDirective : this.getFieldDef();
        if (fieldOrDirective) {
          argDef = fieldOrDirective.args.find(
            (arg) => arg.name === node.name.value
          );
          if (argDef) {
            argType = argDef.type;
          }
        }
        this._argument = argDef;
        this._defaultValueStack.push(argDef ? argDef.defaultValue : void 0);
        this._inputTypeStack.push(isInputType(argType) ? argType : void 0);
        break;
      }
      case Kind.LIST: {
        const listType = getNullableType(this.getInputType());
        const itemType = isListType(listType) ? listType.ofType : listType;
        this._defaultValueStack.push(void 0);
        this._inputTypeStack.push(isInputType(itemType) ? itemType : void 0);
        break;
      }
      case Kind.OBJECT_FIELD: {
        const objectType = getNamedType(this.getInputType());
        let inputFieldType;
        let inputField;
        if (isInputObjectType(objectType)) {
          inputField = objectType.getFields()[node.name.value];
          if (inputField) {
            inputFieldType = inputField.type;
          }
        }
        this._defaultValueStack.push(
          inputField ? inputField.defaultValue : void 0
        );
        this._inputTypeStack.push(
          isInputType(inputFieldType) ? inputFieldType : void 0
        );
        break;
      }
      case Kind.ENUM: {
        const enumType = getNamedType(this.getInputType());
        let enumValue;
        if (isEnumType(enumType)) {
          enumValue = enumType.getValue(node.value);
        }
        this._enumValue = enumValue;
        break;
      }
    }
  }
  leave(node) {
    switch (node.kind) {
      case Kind.SELECTION_SET:
        this._parentTypeStack.pop();
        break;
      case Kind.FIELD:
        this._fieldDefStack.pop();
        this._typeStack.pop();
        break;
      case Kind.DIRECTIVE:
        this._directive = null;
        break;
      case Kind.OPERATION_DEFINITION:
      case Kind.INLINE_FRAGMENT:
      case Kind.FRAGMENT_DEFINITION:
        this._typeStack.pop();
        break;
      case Kind.VARIABLE_DEFINITION:
        this._inputTypeStack.pop();
        break;
      case Kind.ARGUMENT:
        this._argument = null;
        this._defaultValueStack.pop();
        this._inputTypeStack.pop();
        break;
      case Kind.LIST:
      case Kind.OBJECT_FIELD:
        this._defaultValueStack.pop();
        this._inputTypeStack.pop();
        break;
      case Kind.ENUM:
        this._enumValue = null;
        break;
    }
  }
}
function getFieldDef$1(schema, parentType, fieldNode) {
  const name = fieldNode.name.value;
  if (name === SchemaMetaFieldDef.name && schema.getQueryType() === parentType) {
    return SchemaMetaFieldDef;
  }
  if (name === TypeMetaFieldDef.name && schema.getQueryType() === parentType) {
    return TypeMetaFieldDef;
  }
  if (name === TypeNameMetaFieldDef.name && isCompositeType(parentType)) {
    return TypeNameMetaFieldDef;
  }
  if (isObjectType(parentType) || isInterfaceType(parentType)) {
    return parentType.getFields()[name];
  }
}
function visitWithTypeInfo(typeInfo, visitor) {
  return {
    enter(...args) {
      const node = args[0];
      typeInfo.enter(node);
      const fn = getEnterLeaveForKind(visitor, node.kind).enter;
      if (fn) {
        const result = fn.apply(visitor, args);
        if (result !== void 0) {
          typeInfo.leave(node);
          if (isNode(result)) {
            typeInfo.enter(result);
          }
        }
        return result;
      }
    },
    leave(...args) {
      const node = args[0];
      const fn = getEnterLeaveForKind(visitor, node.kind).leave;
      let result;
      if (fn) {
        result = fn.apply(visitor, args);
      }
      typeInfo.leave(node);
      return result;
    }
  };
}
function isDefinitionNode(node) {
  return isExecutableDefinitionNode(node) || isTypeSystemDefinitionNode(node) || isTypeSystemExtensionNode(node);
}
function isExecutableDefinitionNode(node) {
  return node.kind === Kind.OPERATION_DEFINITION || node.kind === Kind.FRAGMENT_DEFINITION;
}
function isSelectionNode(node) {
  return node.kind === Kind.FIELD || node.kind === Kind.FRAGMENT_SPREAD || node.kind === Kind.INLINE_FRAGMENT;
}
function isValueNode(node) {
  return node.kind === Kind.VARIABLE || node.kind === Kind.INT || node.kind === Kind.FLOAT || node.kind === Kind.STRING || node.kind === Kind.BOOLEAN || node.kind === Kind.NULL || node.kind === Kind.ENUM || node.kind === Kind.LIST || node.kind === Kind.OBJECT;
}
function isConstValueNode(node) {
  return isValueNode(node) && (node.kind === Kind.LIST ? node.values.some(isConstValueNode) : node.kind === Kind.OBJECT ? node.fields.some((field2) => isConstValueNode(field2.value)) : node.kind !== Kind.VARIABLE);
}
function isTypeNode(node) {
  return node.kind === Kind.NAMED_TYPE || node.kind === Kind.LIST_TYPE || node.kind === Kind.NON_NULL_TYPE;
}
function isTypeSystemDefinitionNode(node) {
  return node.kind === Kind.SCHEMA_DEFINITION || isTypeDefinitionNode(node) || node.kind === Kind.DIRECTIVE_DEFINITION;
}
function isTypeDefinitionNode(node) {
  return node.kind === Kind.SCALAR_TYPE_DEFINITION || node.kind === Kind.OBJECT_TYPE_DEFINITION || node.kind === Kind.INTERFACE_TYPE_DEFINITION || node.kind === Kind.UNION_TYPE_DEFINITION || node.kind === Kind.ENUM_TYPE_DEFINITION || node.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION;
}
function isTypeSystemExtensionNode(node) {
  return node.kind === Kind.SCHEMA_EXTENSION || isTypeExtensionNode(node);
}
function isTypeExtensionNode(node) {
  return node.kind === Kind.SCALAR_TYPE_EXTENSION || node.kind === Kind.OBJECT_TYPE_EXTENSION || node.kind === Kind.INTERFACE_TYPE_EXTENSION || node.kind === Kind.UNION_TYPE_EXTENSION || node.kind === Kind.ENUM_TYPE_EXTENSION || node.kind === Kind.INPUT_OBJECT_TYPE_EXTENSION;
}
function ExecutableDefinitionsRule(context) {
  return {
    Document(node) {
      for (const definition of node.definitions) {
        if (!isExecutableDefinitionNode(definition)) {
          const defName = definition.kind === Kind.SCHEMA_DEFINITION || definition.kind === Kind.SCHEMA_EXTENSION ? "schema" : '"' + definition.name.value + '"';
          context.reportError(
            new GraphQLError(`The ${defName} definition is not executable.`, {
              nodes: definition
            })
          );
        }
      }
      return false;
    }
  };
}
function FieldsOnCorrectTypeRule(context) {
  return {
    Field(node) {
      const type = context.getParentType();
      if (type) {
        const fieldDef = context.getFieldDef();
        if (!fieldDef) {
          const schema = context.getSchema();
          const fieldName = node.name.value;
          let suggestion = didYouMean(
            "to use an inline fragment on",
            getSuggestedTypeNames(schema, type, fieldName)
          );
          if (suggestion === "") {
            suggestion = didYouMean(getSuggestedFieldNames(type, fieldName));
          }
          context.reportError(
            new GraphQLError(
              `Cannot query field "${fieldName}" on type "${type.name}".` + suggestion,
              {
                nodes: node
              }
            )
          );
        }
      }
    }
  };
}
function getSuggestedTypeNames(schema, type, fieldName) {
  if (!isAbstractType(type)) {
    return [];
  }
  const suggestedTypes = /* @__PURE__ */ new Set();
  const usageCount = /* @__PURE__ */ Object.create(null);
  for (const possibleType of schema.getPossibleTypes(type)) {
    if (!possibleType.getFields()[fieldName]) {
      continue;
    }
    suggestedTypes.add(possibleType);
    usageCount[possibleType.name] = 1;
    for (const possibleInterface of possibleType.getInterfaces()) {
      var _usageCount$possibleI;
      if (!possibleInterface.getFields()[fieldName]) {
        continue;
      }
      suggestedTypes.add(possibleInterface);
      usageCount[possibleInterface.name] = ((_usageCount$possibleI = usageCount[possibleInterface.name]) !== null && _usageCount$possibleI !== void 0 ? _usageCount$possibleI : 0) + 1;
    }
  }
  return [...suggestedTypes].sort((typeA, typeB) => {
    const usageCountDiff = usageCount[typeB.name] - usageCount[typeA.name];
    if (usageCountDiff !== 0) {
      return usageCountDiff;
    }
    if (isInterfaceType(typeA) && schema.isSubType(typeA, typeB)) {
      return -1;
    }
    if (isInterfaceType(typeB) && schema.isSubType(typeB, typeA)) {
      return 1;
    }
    return naturalCompare(typeA.name, typeB.name);
  }).map((x) => x.name);
}
function getSuggestedFieldNames(type, fieldName) {
  if (isObjectType(type) || isInterfaceType(type)) {
    const possibleFieldNames = Object.keys(type.getFields());
    return suggestionList(fieldName, possibleFieldNames);
  }
  return [];
}
function FragmentsOnCompositeTypesRule(context) {
  return {
    InlineFragment(node) {
      const typeCondition = node.typeCondition;
      if (typeCondition) {
        const type = typeFromAST(context.getSchema(), typeCondition);
        if (type && !isCompositeType(type)) {
          const typeStr = print(typeCondition);
          context.reportError(
            new GraphQLError(
              `Fragment cannot condition on non composite type "${typeStr}".`,
              {
                nodes: typeCondition
              }
            )
          );
        }
      }
    },
    FragmentDefinition(node) {
      const type = typeFromAST(context.getSchema(), node.typeCondition);
      if (type && !isCompositeType(type)) {
        const typeStr = print(node.typeCondition);
        context.reportError(
          new GraphQLError(
            `Fragment "${node.name.value}" cannot condition on non composite type "${typeStr}".`,
            {
              nodes: node.typeCondition
            }
          )
        );
      }
    }
  };
}
function KnownArgumentNamesRule(context) {
  return {
    ...KnownArgumentNamesOnDirectivesRule(context),
    Argument(argNode) {
      const argDef = context.getArgument();
      const fieldDef = context.getFieldDef();
      const parentType = context.getParentType();
      if (!argDef && fieldDef && parentType) {
        const argName = argNode.name.value;
        const knownArgsNames = fieldDef.args.map((arg) => arg.name);
        const suggestions = suggestionList(argName, knownArgsNames);
        context.reportError(
          new GraphQLError(
            `Unknown argument "${argName}" on field "${parentType.name}.${fieldDef.name}".` + didYouMean(suggestions),
            {
              nodes: argNode
            }
          )
        );
      }
    }
  };
}
function KnownArgumentNamesOnDirectivesRule(context) {
  const directiveArgs = /* @__PURE__ */ Object.create(null);
  const schema = context.getSchema();
  const definedDirectives = schema ? schema.getDirectives() : specifiedDirectives;
  for (const directive of definedDirectives) {
    directiveArgs[directive.name] = directive.args.map((arg) => arg.name);
  }
  const astDefinitions = context.getDocument().definitions;
  for (const def of astDefinitions) {
    if (def.kind === Kind.DIRECTIVE_DEFINITION) {
      var _def$arguments;
      const argsNodes = (_def$arguments = def.arguments) !== null && _def$arguments !== void 0 ? _def$arguments : [];
      directiveArgs[def.name.value] = argsNodes.map((arg) => arg.name.value);
    }
  }
  return {
    Directive(directiveNode) {
      const directiveName = directiveNode.name.value;
      const knownArgs = directiveArgs[directiveName];
      if (directiveNode.arguments && knownArgs) {
        for (const argNode of directiveNode.arguments) {
          const argName = argNode.name.value;
          if (!knownArgs.includes(argName)) {
            const suggestions = suggestionList(argName, knownArgs);
            context.reportError(
              new GraphQLError(
                `Unknown argument "${argName}" on directive "@${directiveName}".` + didYouMean(suggestions),
                {
                  nodes: argNode
                }
              )
            );
          }
        }
      }
      return false;
    }
  };
}
function KnownDirectivesRule(context) {
  const locationsMap = /* @__PURE__ */ Object.create(null);
  const schema = context.getSchema();
  const definedDirectives = schema ? schema.getDirectives() : specifiedDirectives;
  for (const directive of definedDirectives) {
    locationsMap[directive.name] = directive.locations;
  }
  const astDefinitions = context.getDocument().definitions;
  for (const def of astDefinitions) {
    if (def.kind === Kind.DIRECTIVE_DEFINITION) {
      locationsMap[def.name.value] = def.locations.map((name) => name.value);
    }
  }
  return {
    Directive(node, _key, _parent, _path, ancestors) {
      const name = node.name.value;
      const locations = locationsMap[name];
      if (!locations) {
        context.reportError(
          new GraphQLError(`Unknown directive "@${name}".`, {
            nodes: node
          })
        );
        return;
      }
      const candidateLocation = getDirectiveLocationForASTPath(ancestors);
      if (candidateLocation && !locations.includes(candidateLocation)) {
        context.reportError(
          new GraphQLError(
            `Directive "@${name}" may not be used on ${candidateLocation}.`,
            {
              nodes: node
            }
          )
        );
      }
    }
  };
}
function getDirectiveLocationForASTPath(ancestors) {
  const appliedTo = ancestors[ancestors.length - 1];
  "kind" in appliedTo || invariant(false);
  switch (appliedTo.kind) {
    case Kind.OPERATION_DEFINITION:
      return getDirectiveLocationForOperation(appliedTo.operation);
    case Kind.FIELD:
      return DirectiveLocation.FIELD;
    case Kind.FRAGMENT_SPREAD:
      return DirectiveLocation.FRAGMENT_SPREAD;
    case Kind.INLINE_FRAGMENT:
      return DirectiveLocation.INLINE_FRAGMENT;
    case Kind.FRAGMENT_DEFINITION:
      return DirectiveLocation.FRAGMENT_DEFINITION;
    case Kind.VARIABLE_DEFINITION:
      return DirectiveLocation.VARIABLE_DEFINITION;
    case Kind.SCHEMA_DEFINITION:
    case Kind.SCHEMA_EXTENSION:
      return DirectiveLocation.SCHEMA;
    case Kind.SCALAR_TYPE_DEFINITION:
    case Kind.SCALAR_TYPE_EXTENSION:
      return DirectiveLocation.SCALAR;
    case Kind.OBJECT_TYPE_DEFINITION:
    case Kind.OBJECT_TYPE_EXTENSION:
      return DirectiveLocation.OBJECT;
    case Kind.FIELD_DEFINITION:
      return DirectiveLocation.FIELD_DEFINITION;
    case Kind.INTERFACE_TYPE_DEFINITION:
    case Kind.INTERFACE_TYPE_EXTENSION:
      return DirectiveLocation.INTERFACE;
    case Kind.UNION_TYPE_DEFINITION:
    case Kind.UNION_TYPE_EXTENSION:
      return DirectiveLocation.UNION;
    case Kind.ENUM_TYPE_DEFINITION:
    case Kind.ENUM_TYPE_EXTENSION:
      return DirectiveLocation.ENUM;
    case Kind.ENUM_VALUE_DEFINITION:
      return DirectiveLocation.ENUM_VALUE;
    case Kind.INPUT_OBJECT_TYPE_DEFINITION:
    case Kind.INPUT_OBJECT_TYPE_EXTENSION:
      return DirectiveLocation.INPUT_OBJECT;
    case Kind.INPUT_VALUE_DEFINITION: {
      const parentNode = ancestors[ancestors.length - 3];
      "kind" in parentNode || invariant(false);
      return parentNode.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION ? DirectiveLocation.INPUT_FIELD_DEFINITION : DirectiveLocation.ARGUMENT_DEFINITION;
    }
    default:
      invariant(false, "Unexpected kind: " + inspect(appliedTo.kind));
  }
}
function getDirectiveLocationForOperation(operation) {
  switch (operation) {
    case OperationTypeNode.QUERY:
      return DirectiveLocation.QUERY;
    case OperationTypeNode.MUTATION:
      return DirectiveLocation.MUTATION;
    case OperationTypeNode.SUBSCRIPTION:
      return DirectiveLocation.SUBSCRIPTION;
  }
}
function KnownFragmentNamesRule(context) {
  return {
    FragmentSpread(node) {
      const fragmentName = node.name.value;
      const fragment = context.getFragment(fragmentName);
      if (!fragment) {
        context.reportError(
          new GraphQLError(`Unknown fragment "${fragmentName}".`, {
            nodes: node.name
          })
        );
      }
    }
  };
}
function KnownTypeNamesRule(context) {
  const schema = context.getSchema();
  const existingTypesMap = schema ? schema.getTypeMap() : /* @__PURE__ */ Object.create(null);
  const definedTypes = /* @__PURE__ */ Object.create(null);
  for (const def of context.getDocument().definitions) {
    if (isTypeDefinitionNode(def)) {
      definedTypes[def.name.value] = true;
    }
  }
  const typeNames = [
    ...Object.keys(existingTypesMap),
    ...Object.keys(definedTypes)
  ];
  return {
    NamedType(node, _1, parent, _2, ancestors) {
      const typeName = node.name.value;
      if (!existingTypesMap[typeName] && !definedTypes[typeName]) {
        var _ancestors$;
        const definitionNode = (_ancestors$ = ancestors[2]) !== null && _ancestors$ !== void 0 ? _ancestors$ : parent;
        const isSDL = definitionNode != null && isSDLNode(definitionNode);
        if (isSDL && standardTypeNames.includes(typeName)) {
          return;
        }
        const suggestedTypes = suggestionList(
          typeName,
          isSDL ? standardTypeNames.concat(typeNames) : typeNames
        );
        context.reportError(
          new GraphQLError(
            `Unknown type "${typeName}".` + didYouMean(suggestedTypes),
            {
              nodes: node
            }
          )
        );
      }
    }
  };
}
const standardTypeNames = [...specifiedScalarTypes, ...introspectionTypes].map(
  (type) => type.name
);
function isSDLNode(value) {
  return "kind" in value && (isTypeSystemDefinitionNode(value) || isTypeSystemExtensionNode(value));
}
function LoneAnonymousOperationRule(context) {
  let operationCount = 0;
  return {
    Document(node) {
      operationCount = node.definitions.filter(
        (definition) => definition.kind === Kind.OPERATION_DEFINITION
      ).length;
    },
    OperationDefinition(node) {
      if (!node.name && operationCount > 1) {
        context.reportError(
          new GraphQLError(
            "This anonymous operation must be the only defined operation.",
            {
              nodes: node
            }
          )
        );
      }
    }
  };
}
function LoneSchemaDefinitionRule(context) {
  var _ref, _ref2, _oldSchema$astNode;
  const oldSchema = context.getSchema();
  const alreadyDefined = (_ref = (_ref2 = (_oldSchema$astNode = oldSchema === null || oldSchema === void 0 ? void 0 : oldSchema.astNode) !== null && _oldSchema$astNode !== void 0 ? _oldSchema$astNode : oldSchema === null || oldSchema === void 0 ? void 0 : oldSchema.getQueryType()) !== null && _ref2 !== void 0 ? _ref2 : oldSchema === null || oldSchema === void 0 ? void 0 : oldSchema.getMutationType()) !== null && _ref !== void 0 ? _ref : oldSchema === null || oldSchema === void 0 ? void 0 : oldSchema.getSubscriptionType();
  let schemaDefinitionsCount = 0;
  return {
    SchemaDefinition(node) {
      if (alreadyDefined) {
        context.reportError(
          new GraphQLError(
            "Cannot define a new schema within a schema extension.",
            {
              nodes: node
            }
          )
        );
        return;
      }
      if (schemaDefinitionsCount > 0) {
        context.reportError(
          new GraphQLError("Must provide only one schema definition.", {
            nodes: node
          })
        );
      }
      ++schemaDefinitionsCount;
    }
  };
}
function NoFragmentCyclesRule(context) {
  const visitedFrags = /* @__PURE__ */ Object.create(null);
  const spreadPath = [];
  const spreadPathIndexByName = /* @__PURE__ */ Object.create(null);
  return {
    OperationDefinition: () => false,
    FragmentDefinition(node) {
      detectCycleRecursive(node);
      return false;
    }
  };
  function detectCycleRecursive(fragment) {
    if (visitedFrags[fragment.name.value]) {
      return;
    }
    const fragmentName = fragment.name.value;
    visitedFrags[fragmentName] = true;
    const spreadNodes = context.getFragmentSpreads(fragment.selectionSet);
    if (spreadNodes.length === 0) {
      return;
    }
    spreadPathIndexByName[fragmentName] = spreadPath.length;
    for (const spreadNode of spreadNodes) {
      const spreadName = spreadNode.name.value;
      const cycleIndex = spreadPathIndexByName[spreadName];
      spreadPath.push(spreadNode);
      if (cycleIndex === void 0) {
        const spreadFragment = context.getFragment(spreadName);
        if (spreadFragment) {
          detectCycleRecursive(spreadFragment);
        }
      } else {
        const cyclePath = spreadPath.slice(cycleIndex);
        const viaPath = cyclePath.slice(0, -1).map((s) => '"' + s.name.value + '"').join(", ");
        context.reportError(
          new GraphQLError(
            `Cannot spread fragment "${spreadName}" within itself` + (viaPath !== "" ? ` via ${viaPath}.` : "."),
            {
              nodes: cyclePath
            }
          )
        );
      }
      spreadPath.pop();
    }
    spreadPathIndexByName[fragmentName] = void 0;
  }
}
function NoUndefinedVariablesRule(context) {
  let variableNameDefined = /* @__PURE__ */ Object.create(null);
  return {
    OperationDefinition: {
      enter() {
        variableNameDefined = /* @__PURE__ */ Object.create(null);
      },
      leave(operation) {
        const usages = context.getRecursiveVariableUsages(operation);
        for (const { node } of usages) {
          const varName = node.name.value;
          if (variableNameDefined[varName] !== true) {
            context.reportError(
              new GraphQLError(
                operation.name ? `Variable "$${varName}" is not defined by operation "${operation.name.value}".` : `Variable "$${varName}" is not defined.`,
                {
                  nodes: [node, operation]
                }
              )
            );
          }
        }
      }
    },
    VariableDefinition(node) {
      variableNameDefined[node.variable.name.value] = true;
    }
  };
}
function NoUnusedFragmentsRule(context) {
  const operationDefs = [];
  const fragmentDefs = [];
  return {
    OperationDefinition(node) {
      operationDefs.push(node);
      return false;
    },
    FragmentDefinition(node) {
      fragmentDefs.push(node);
      return false;
    },
    Document: {
      leave() {
        const fragmentNameUsed = /* @__PURE__ */ Object.create(null);
        for (const operation of operationDefs) {
          for (const fragment of context.getRecursivelyReferencedFragments(
            operation
          )) {
            fragmentNameUsed[fragment.name.value] = true;
          }
        }
        for (const fragmentDef of fragmentDefs) {
          const fragName = fragmentDef.name.value;
          if (fragmentNameUsed[fragName] !== true) {
            context.reportError(
              new GraphQLError(`Fragment "${fragName}" is never used.`, {
                nodes: fragmentDef
              })
            );
          }
        }
      }
    }
  };
}
function NoUnusedVariablesRule(context) {
  let variableDefs = [];
  return {
    OperationDefinition: {
      enter() {
        variableDefs = [];
      },
      leave(operation) {
        const variableNameUsed = /* @__PURE__ */ Object.create(null);
        const usages = context.getRecursiveVariableUsages(operation);
        for (const { node } of usages) {
          variableNameUsed[node.name.value] = true;
        }
        for (const variableDef of variableDefs) {
          const variableName = variableDef.variable.name.value;
          if (variableNameUsed[variableName] !== true) {
            context.reportError(
              new GraphQLError(
                operation.name ? `Variable "$${variableName}" is never used in operation "${operation.name.value}".` : `Variable "$${variableName}" is never used.`,
                {
                  nodes: variableDef
                }
              )
            );
          }
        }
      }
    },
    VariableDefinition(def) {
      variableDefs.push(def);
    }
  };
}
function sortValueNode(valueNode) {
  switch (valueNode.kind) {
    case Kind.OBJECT:
      return { ...valueNode, fields: sortFields(valueNode.fields) };
    case Kind.LIST:
      return { ...valueNode, values: valueNode.values.map(sortValueNode) };
    case Kind.INT:
    case Kind.FLOAT:
    case Kind.STRING:
    case Kind.BOOLEAN:
    case Kind.NULL:
    case Kind.ENUM:
    case Kind.VARIABLE:
      return valueNode;
  }
}
function sortFields(fields) {
  return fields.map((fieldNode) => ({
    ...fieldNode,
    value: sortValueNode(fieldNode.value)
  })).sort(
    (fieldA, fieldB) => naturalCompare(fieldA.name.value, fieldB.name.value)
  );
}
function reasonMessage(reason) {
  if (Array.isArray(reason)) {
    return reason.map(
      ([responseName, subReason]) => `subfields "${responseName}" conflict because ` + reasonMessage(subReason)
    ).join(" and ");
  }
  return reason;
}
function OverlappingFieldsCanBeMergedRule(context) {
  const comparedFragmentPairs = new PairSet();
  const cachedFieldsAndFragmentNames = /* @__PURE__ */ new Map();
  return {
    SelectionSet(selectionSet) {
      const conflicts = findConflictsWithinSelectionSet(
        context,
        cachedFieldsAndFragmentNames,
        comparedFragmentPairs,
        context.getParentType(),
        selectionSet
      );
      for (const [[responseName, reason], fields1, fields2] of conflicts) {
        const reasonMsg = reasonMessage(reason);
        context.reportError(
          new GraphQLError(
            `Fields "${responseName}" conflict because ${reasonMsg}. Use different aliases on the fields to fetch both if this was intentional.`,
            {
              nodes: fields1.concat(fields2)
            }
          )
        );
      }
    }
  };
}
function findConflictsWithinSelectionSet(context, cachedFieldsAndFragmentNames, comparedFragmentPairs, parentType, selectionSet) {
  const conflicts = [];
  const [fieldMap, fragmentNames] = getFieldsAndFragmentNames(
    context,
    cachedFieldsAndFragmentNames,
    parentType,
    selectionSet
  );
  collectConflictsWithin(
    context,
    conflicts,
    cachedFieldsAndFragmentNames,
    comparedFragmentPairs,
    fieldMap
  );
  if (fragmentNames.length !== 0) {
    for (let i = 0; i < fragmentNames.length; i++) {
      collectConflictsBetweenFieldsAndFragment(
        context,
        conflicts,
        cachedFieldsAndFragmentNames,
        comparedFragmentPairs,
        false,
        fieldMap,
        fragmentNames[i]
      );
      for (let j = i + 1; j < fragmentNames.length; j++) {
        collectConflictsBetweenFragments(
          context,
          conflicts,
          cachedFieldsAndFragmentNames,
          comparedFragmentPairs,
          false,
          fragmentNames[i],
          fragmentNames[j]
        );
      }
    }
  }
  return conflicts;
}
function collectConflictsBetweenFieldsAndFragment(context, conflicts, cachedFieldsAndFragmentNames, comparedFragmentPairs, areMutuallyExclusive, fieldMap, fragmentName) {
  const fragment = context.getFragment(fragmentName);
  if (!fragment) {
    return;
  }
  const [fieldMap2, referencedFragmentNames] = getReferencedFieldsAndFragmentNames(
    context,
    cachedFieldsAndFragmentNames,
    fragment
  );
  if (fieldMap === fieldMap2) {
    return;
  }
  collectConflictsBetween(
    context,
    conflicts,
    cachedFieldsAndFragmentNames,
    comparedFragmentPairs,
    areMutuallyExclusive,
    fieldMap,
    fieldMap2
  );
  for (const referencedFragmentName of referencedFragmentNames) {
    if (comparedFragmentPairs.has(
      referencedFragmentName,
      fragmentName,
      areMutuallyExclusive
    )) {
      continue;
    }
    comparedFragmentPairs.add(
      referencedFragmentName,
      fragmentName,
      areMutuallyExclusive
    );
    collectConflictsBetweenFieldsAndFragment(
      context,
      conflicts,
      cachedFieldsAndFragmentNames,
      comparedFragmentPairs,
      areMutuallyExclusive,
      fieldMap,
      referencedFragmentName
    );
  }
}
function collectConflictsBetweenFragments(context, conflicts, cachedFieldsAndFragmentNames, comparedFragmentPairs, areMutuallyExclusive, fragmentName1, fragmentName2) {
  if (fragmentName1 === fragmentName2) {
    return;
  }
  if (comparedFragmentPairs.has(
    fragmentName1,
    fragmentName2,
    areMutuallyExclusive
  )) {
    return;
  }
  comparedFragmentPairs.add(fragmentName1, fragmentName2, areMutuallyExclusive);
  const fragment1 = context.getFragment(fragmentName1);
  const fragment2 = context.getFragment(fragmentName2);
  if (!fragment1 || !fragment2) {
    return;
  }
  const [fieldMap1, referencedFragmentNames1] = getReferencedFieldsAndFragmentNames(
    context,
    cachedFieldsAndFragmentNames,
    fragment1
  );
  const [fieldMap2, referencedFragmentNames2] = getReferencedFieldsAndFragmentNames(
    context,
    cachedFieldsAndFragmentNames,
    fragment2
  );
  collectConflictsBetween(
    context,
    conflicts,
    cachedFieldsAndFragmentNames,
    comparedFragmentPairs,
    areMutuallyExclusive,
    fieldMap1,
    fieldMap2
  );
  for (const referencedFragmentName2 of referencedFragmentNames2) {
    collectConflictsBetweenFragments(
      context,
      conflicts,
      cachedFieldsAndFragmentNames,
      comparedFragmentPairs,
      areMutuallyExclusive,
      fragmentName1,
      referencedFragmentName2
    );
  }
  for (const referencedFragmentName1 of referencedFragmentNames1) {
    collectConflictsBetweenFragments(
      context,
      conflicts,
      cachedFieldsAndFragmentNames,
      comparedFragmentPairs,
      areMutuallyExclusive,
      referencedFragmentName1,
      fragmentName2
    );
  }
}
function findConflictsBetweenSubSelectionSets(context, cachedFieldsAndFragmentNames, comparedFragmentPairs, areMutuallyExclusive, parentType1, selectionSet1, parentType2, selectionSet2) {
  const conflicts = [];
  const [fieldMap1, fragmentNames1] = getFieldsAndFragmentNames(
    context,
    cachedFieldsAndFragmentNames,
    parentType1,
    selectionSet1
  );
  const [fieldMap2, fragmentNames2] = getFieldsAndFragmentNames(
    context,
    cachedFieldsAndFragmentNames,
    parentType2,
    selectionSet2
  );
  collectConflictsBetween(
    context,
    conflicts,
    cachedFieldsAndFragmentNames,
    comparedFragmentPairs,
    areMutuallyExclusive,
    fieldMap1,
    fieldMap2
  );
  for (const fragmentName2 of fragmentNames2) {
    collectConflictsBetweenFieldsAndFragment(
      context,
      conflicts,
      cachedFieldsAndFragmentNames,
      comparedFragmentPairs,
      areMutuallyExclusive,
      fieldMap1,
      fragmentName2
    );
  }
  for (const fragmentName1 of fragmentNames1) {
    collectConflictsBetweenFieldsAndFragment(
      context,
      conflicts,
      cachedFieldsAndFragmentNames,
      comparedFragmentPairs,
      areMutuallyExclusive,
      fieldMap2,
      fragmentName1
    );
  }
  for (const fragmentName1 of fragmentNames1) {
    for (const fragmentName2 of fragmentNames2) {
      collectConflictsBetweenFragments(
        context,
        conflicts,
        cachedFieldsAndFragmentNames,
        comparedFragmentPairs,
        areMutuallyExclusive,
        fragmentName1,
        fragmentName2
      );
    }
  }
  return conflicts;
}
function collectConflictsWithin(context, conflicts, cachedFieldsAndFragmentNames, comparedFragmentPairs, fieldMap) {
  for (const [responseName, fields] of Object.entries(fieldMap)) {
    if (fields.length > 1) {
      for (let i = 0; i < fields.length; i++) {
        for (let j = i + 1; j < fields.length; j++) {
          const conflict = findConflict(
            context,
            cachedFieldsAndFragmentNames,
            comparedFragmentPairs,
            false,
            responseName,
            fields[i],
            fields[j]
          );
          if (conflict) {
            conflicts.push(conflict);
          }
        }
      }
    }
  }
}
function collectConflictsBetween(context, conflicts, cachedFieldsAndFragmentNames, comparedFragmentPairs, parentFieldsAreMutuallyExclusive, fieldMap1, fieldMap2) {
  for (const [responseName, fields1] of Object.entries(fieldMap1)) {
    const fields2 = fieldMap2[responseName];
    if (fields2) {
      for (const field1 of fields1) {
        for (const field2 of fields2) {
          const conflict = findConflict(
            context,
            cachedFieldsAndFragmentNames,
            comparedFragmentPairs,
            parentFieldsAreMutuallyExclusive,
            responseName,
            field1,
            field2
          );
          if (conflict) {
            conflicts.push(conflict);
          }
        }
      }
    }
  }
}
function findConflict(context, cachedFieldsAndFragmentNames, comparedFragmentPairs, parentFieldsAreMutuallyExclusive, responseName, field1, field2) {
  const [parentType1, node1, def1] = field1;
  const [parentType2, node2, def2] = field2;
  const areMutuallyExclusive = parentFieldsAreMutuallyExclusive || parentType1 !== parentType2 && isObjectType(parentType1) && isObjectType(parentType2);
  if (!areMutuallyExclusive) {
    const name1 = node1.name.value;
    const name2 = node2.name.value;
    if (name1 !== name2) {
      return [
        [responseName, `"${name1}" and "${name2}" are different fields`],
        [node1],
        [node2]
      ];
    }
    if (stringifyArguments(node1) !== stringifyArguments(node2)) {
      return [
        [responseName, "they have differing arguments"],
        [node1],
        [node2]
      ];
    }
  }
  const type1 = def1 === null || def1 === void 0 ? void 0 : def1.type;
  const type2 = def2 === null || def2 === void 0 ? void 0 : def2.type;
  if (type1 && type2 && doTypesConflict(type1, type2)) {
    return [
      [
        responseName,
        `they return conflicting types "${inspect(type1)}" and "${inspect(
          type2
        )}"`
      ],
      [node1],
      [node2]
    ];
  }
  const selectionSet1 = node1.selectionSet;
  const selectionSet2 = node2.selectionSet;
  if (selectionSet1 && selectionSet2) {
    const conflicts = findConflictsBetweenSubSelectionSets(
      context,
      cachedFieldsAndFragmentNames,
      comparedFragmentPairs,
      areMutuallyExclusive,
      getNamedType(type1),
      selectionSet1,
      getNamedType(type2),
      selectionSet2
    );
    return subfieldConflicts(conflicts, responseName, node1, node2);
  }
}
function stringifyArguments(fieldNode) {
  var _fieldNode$arguments;
  const args = (_fieldNode$arguments = fieldNode.arguments) !== null && _fieldNode$arguments !== void 0 ? _fieldNode$arguments : [];
  const inputObjectWithArgs = {
    kind: Kind.OBJECT,
    fields: args.map((argNode) => ({
      kind: Kind.OBJECT_FIELD,
      name: argNode.name,
      value: argNode.value
    }))
  };
  return print(sortValueNode(inputObjectWithArgs));
}
function doTypesConflict(type1, type2) {
  if (isListType(type1)) {
    return isListType(type2) ? doTypesConflict(type1.ofType, type2.ofType) : true;
  }
  if (isListType(type2)) {
    return true;
  }
  if (isNonNullType(type1)) {
    return isNonNullType(type2) ? doTypesConflict(type1.ofType, type2.ofType) : true;
  }
  if (isNonNullType(type2)) {
    return true;
  }
  if (isLeafType(type1) || isLeafType(type2)) {
    return type1 !== type2;
  }
  return false;
}
function getFieldsAndFragmentNames(context, cachedFieldsAndFragmentNames, parentType, selectionSet) {
  const cached = cachedFieldsAndFragmentNames.get(selectionSet);
  if (cached) {
    return cached;
  }
  const nodeAndDefs = /* @__PURE__ */ Object.create(null);
  const fragmentNames = /* @__PURE__ */ Object.create(null);
  _collectFieldsAndFragmentNames(
    context,
    parentType,
    selectionSet,
    nodeAndDefs,
    fragmentNames
  );
  const result = [nodeAndDefs, Object.keys(fragmentNames)];
  cachedFieldsAndFragmentNames.set(selectionSet, result);
  return result;
}
function getReferencedFieldsAndFragmentNames(context, cachedFieldsAndFragmentNames, fragment) {
  const cached = cachedFieldsAndFragmentNames.get(fragment.selectionSet);
  if (cached) {
    return cached;
  }
  const fragmentType = typeFromAST(context.getSchema(), fragment.typeCondition);
  return getFieldsAndFragmentNames(
    context,
    cachedFieldsAndFragmentNames,
    fragmentType,
    fragment.selectionSet
  );
}
function _collectFieldsAndFragmentNames(context, parentType, selectionSet, nodeAndDefs, fragmentNames) {
  for (const selection of selectionSet.selections) {
    switch (selection.kind) {
      case Kind.FIELD: {
        const fieldName = selection.name.value;
        let fieldDef;
        if (isObjectType(parentType) || isInterfaceType(parentType)) {
          fieldDef = parentType.getFields()[fieldName];
        }
        const responseName = selection.alias ? selection.alias.value : fieldName;
        if (!nodeAndDefs[responseName]) {
          nodeAndDefs[responseName] = [];
        }
        nodeAndDefs[responseName].push([parentType, selection, fieldDef]);
        break;
      }
      case Kind.FRAGMENT_SPREAD:
        fragmentNames[selection.name.value] = true;
        break;
      case Kind.INLINE_FRAGMENT: {
        const typeCondition = selection.typeCondition;
        const inlineFragmentType = typeCondition ? typeFromAST(context.getSchema(), typeCondition) : parentType;
        _collectFieldsAndFragmentNames(
          context,
          inlineFragmentType,
          selection.selectionSet,
          nodeAndDefs,
          fragmentNames
        );
        break;
      }
    }
  }
}
function subfieldConflicts(conflicts, responseName, node1, node2) {
  if (conflicts.length > 0) {
    return [
      [responseName, conflicts.map(([reason]) => reason)],
      [node1, ...conflicts.map(([, fields1]) => fields1).flat()],
      [node2, ...conflicts.map(([, , fields2]) => fields2).flat()]
    ];
  }
}
class PairSet {
  constructor() {
    this._data = /* @__PURE__ */ new Map();
  }
  has(a, b, areMutuallyExclusive) {
    var _this$_data$get;
    const [key1, key2] = a < b ? [a, b] : [b, a];
    const result = (_this$_data$get = this._data.get(key1)) === null || _this$_data$get === void 0 ? void 0 : _this$_data$get.get(key2);
    if (result === void 0) {
      return false;
    }
    return areMutuallyExclusive ? true : areMutuallyExclusive === result;
  }
  add(a, b, areMutuallyExclusive) {
    const [key1, key2] = a < b ? [a, b] : [b, a];
    const map = this._data.get(key1);
    if (map === void 0) {
      this._data.set(key1, /* @__PURE__ */ new Map([[key2, areMutuallyExclusive]]));
    } else {
      map.set(key2, areMutuallyExclusive);
    }
  }
}
function PossibleFragmentSpreadsRule(context) {
  return {
    InlineFragment(node) {
      const fragType = context.getType();
      const parentType = context.getParentType();
      if (isCompositeType(fragType) && isCompositeType(parentType) && !doTypesOverlap(context.getSchema(), fragType, parentType)) {
        const parentTypeStr = inspect(parentType);
        const fragTypeStr = inspect(fragType);
        context.reportError(
          new GraphQLError(
            `Fragment cannot be spread here as objects of type "${parentTypeStr}" can never be of type "${fragTypeStr}".`,
            {
              nodes: node
            }
          )
        );
      }
    },
    FragmentSpread(node) {
      const fragName = node.name.value;
      const fragType = getFragmentType(context, fragName);
      const parentType = context.getParentType();
      if (fragType && parentType && !doTypesOverlap(context.getSchema(), fragType, parentType)) {
        const parentTypeStr = inspect(parentType);
        const fragTypeStr = inspect(fragType);
        context.reportError(
          new GraphQLError(
            `Fragment "${fragName}" cannot be spread here as objects of type "${parentTypeStr}" can never be of type "${fragTypeStr}".`,
            {
              nodes: node
            }
          )
        );
      }
    }
  };
}
function getFragmentType(context, name) {
  const frag = context.getFragment(name);
  if (frag) {
    const type = typeFromAST(context.getSchema(), frag.typeCondition);
    if (isCompositeType(type)) {
      return type;
    }
  }
}
function PossibleTypeExtensionsRule(context) {
  const schema = context.getSchema();
  const definedTypes = /* @__PURE__ */ Object.create(null);
  for (const def of context.getDocument().definitions) {
    if (isTypeDefinitionNode(def)) {
      definedTypes[def.name.value] = def;
    }
  }
  return {
    ScalarTypeExtension: checkExtension,
    ObjectTypeExtension: checkExtension,
    InterfaceTypeExtension: checkExtension,
    UnionTypeExtension: checkExtension,
    EnumTypeExtension: checkExtension,
    InputObjectTypeExtension: checkExtension
  };
  function checkExtension(node) {
    const typeName = node.name.value;
    const defNode = definedTypes[typeName];
    const existingType = schema === null || schema === void 0 ? void 0 : schema.getType(typeName);
    let expectedKind;
    if (defNode) {
      expectedKind = defKindToExtKind[defNode.kind];
    } else if (existingType) {
      expectedKind = typeToExtKind(existingType);
    }
    if (expectedKind) {
      if (expectedKind !== node.kind) {
        const kindStr = extensionKindToTypeName(node.kind);
        context.reportError(
          new GraphQLError(`Cannot extend non-${kindStr} type "${typeName}".`, {
            nodes: defNode ? [defNode, node] : node
          })
        );
      }
    } else {
      const allTypeNames = Object.keys({
        ...definedTypes,
        ...schema === null || schema === void 0 ? void 0 : schema.getTypeMap()
      });
      const suggestedTypes = suggestionList(typeName, allTypeNames);
      context.reportError(
        new GraphQLError(
          `Cannot extend type "${typeName}" because it is not defined.` + didYouMean(suggestedTypes),
          {
            nodes: node.name
          }
        )
      );
    }
  }
}
const defKindToExtKind = {
  [Kind.SCALAR_TYPE_DEFINITION]: Kind.SCALAR_TYPE_EXTENSION,
  [Kind.OBJECT_TYPE_DEFINITION]: Kind.OBJECT_TYPE_EXTENSION,
  [Kind.INTERFACE_TYPE_DEFINITION]: Kind.INTERFACE_TYPE_EXTENSION,
  [Kind.UNION_TYPE_DEFINITION]: Kind.UNION_TYPE_EXTENSION,
  [Kind.ENUM_TYPE_DEFINITION]: Kind.ENUM_TYPE_EXTENSION,
  [Kind.INPUT_OBJECT_TYPE_DEFINITION]: Kind.INPUT_OBJECT_TYPE_EXTENSION
};
function typeToExtKind(type) {
  if (isScalarType(type)) {
    return Kind.SCALAR_TYPE_EXTENSION;
  }
  if (isObjectType(type)) {
    return Kind.OBJECT_TYPE_EXTENSION;
  }
  if (isInterfaceType(type)) {
    return Kind.INTERFACE_TYPE_EXTENSION;
  }
  if (isUnionType(type)) {
    return Kind.UNION_TYPE_EXTENSION;
  }
  if (isEnumType(type)) {
    return Kind.ENUM_TYPE_EXTENSION;
  }
  if (isInputObjectType(type)) {
    return Kind.INPUT_OBJECT_TYPE_EXTENSION;
  }
  invariant(false, "Unexpected type: " + inspect(type));
}
function extensionKindToTypeName(kind) {
  switch (kind) {
    case Kind.SCALAR_TYPE_EXTENSION:
      return "scalar";
    case Kind.OBJECT_TYPE_EXTENSION:
      return "object";
    case Kind.INTERFACE_TYPE_EXTENSION:
      return "interface";
    case Kind.UNION_TYPE_EXTENSION:
      return "union";
    case Kind.ENUM_TYPE_EXTENSION:
      return "enum";
    case Kind.INPUT_OBJECT_TYPE_EXTENSION:
      return "input object";
    default:
      invariant(false, "Unexpected kind: " + inspect(kind));
  }
}
function ProvidedRequiredArgumentsRule(context) {
  return {
    ...ProvidedRequiredArgumentsOnDirectivesRule(context),
    Field: {
      leave(fieldNode) {
        var _fieldNode$arguments;
        const fieldDef = context.getFieldDef();
        if (!fieldDef) {
          return false;
        }
        const providedArgs = new Set(
          (_fieldNode$arguments = fieldNode.arguments) === null || _fieldNode$arguments === void 0 ? void 0 : _fieldNode$arguments.map((arg) => arg.name.value)
        );
        for (const argDef of fieldDef.args) {
          if (!providedArgs.has(argDef.name) && isRequiredArgument(argDef)) {
            const argTypeStr = inspect(argDef.type);
            context.reportError(
              new GraphQLError(
                `Field "${fieldDef.name}" argument "${argDef.name}" of type "${argTypeStr}" is required, but it was not provided.`,
                {
                  nodes: fieldNode
                }
              )
            );
          }
        }
      }
    }
  };
}
function ProvidedRequiredArgumentsOnDirectivesRule(context) {
  var _schema$getDirectives;
  const requiredArgsMap = /* @__PURE__ */ Object.create(null);
  const schema = context.getSchema();
  const definedDirectives = (_schema$getDirectives = schema === null || schema === void 0 ? void 0 : schema.getDirectives()) !== null && _schema$getDirectives !== void 0 ? _schema$getDirectives : specifiedDirectives;
  for (const directive of definedDirectives) {
    requiredArgsMap[directive.name] = keyMap(
      directive.args.filter(isRequiredArgument),
      (arg) => arg.name
    );
  }
  const astDefinitions = context.getDocument().definitions;
  for (const def of astDefinitions) {
    if (def.kind === Kind.DIRECTIVE_DEFINITION) {
      var _def$arguments;
      const argNodes = (_def$arguments = def.arguments) !== null && _def$arguments !== void 0 ? _def$arguments : [];
      requiredArgsMap[def.name.value] = keyMap(
        argNodes.filter(isRequiredArgumentNode),
        (arg) => arg.name.value
      );
    }
  }
  return {
    Directive: {
      leave(directiveNode) {
        const directiveName = directiveNode.name.value;
        const requiredArgs = requiredArgsMap[directiveName];
        if (requiredArgs) {
          var _directiveNode$argume;
          const argNodes = (_directiveNode$argume = directiveNode.arguments) !== null && _directiveNode$argume !== void 0 ? _directiveNode$argume : [];
          const argNodeMap = new Set(argNodes.map((arg) => arg.name.value));
          for (const [argName, argDef] of Object.entries(requiredArgs)) {
            if (!argNodeMap.has(argName)) {
              const argType = isType(argDef.type) ? inspect(argDef.type) : print(argDef.type);
              context.reportError(
                new GraphQLError(
                  `Directive "@${directiveName}" argument "${argName}" of type "${argType}" is required, but it was not provided.`,
                  {
                    nodes: directiveNode
                  }
                )
              );
            }
          }
        }
      }
    }
  };
}
function isRequiredArgumentNode(arg) {
  return arg.type.kind === Kind.NON_NULL_TYPE && arg.defaultValue == null;
}
function ScalarLeafsRule(context) {
  return {
    Field(node) {
      const type = context.getType();
      const selectionSet = node.selectionSet;
      if (type) {
        if (isLeafType(getNamedType(type))) {
          if (selectionSet) {
            const fieldName = node.name.value;
            const typeStr = inspect(type);
            context.reportError(
              new GraphQLError(
                `Field "${fieldName}" must not have a selection since type "${typeStr}" has no subfields.`,
                {
                  nodes: selectionSet
                }
              )
            );
          }
        } else if (!selectionSet) {
          const fieldName = node.name.value;
          const typeStr = inspect(type);
          context.reportError(
            new GraphQLError(
              `Field "${fieldName}" of type "${typeStr}" must have a selection of subfields. Did you mean "${fieldName} { ... }"?`,
              {
                nodes: node
              }
            )
          );
        }
      }
    }
  };
}
function printPathArray(path) {
  return path.map(
    (key) => typeof key === "number" ? "[" + key.toString() + "]" : "." + key
  ).join("");
}
function addPath(prev, key, typename) {
  return {
    prev,
    key,
    typename
  };
}
function pathToArray(path) {
  const flattened = [];
  let curr = path;
  while (curr) {
    flattened.push(curr.key);
    curr = curr.prev;
  }
  return flattened.reverse();
}
function coerceInputValue(inputValue, type, onError = defaultOnError) {
  return coerceInputValueImpl(inputValue, type, onError, void 0);
}
function defaultOnError(path, invalidValue, error2) {
  let errorPrefix = "Invalid value " + inspect(invalidValue);
  if (path.length > 0) {
    errorPrefix += ` at "value${printPathArray(path)}"`;
  }
  error2.message = errorPrefix + ": " + error2.message;
  throw error2;
}
function coerceInputValueImpl(inputValue, type, onError, path) {
  if (isNonNullType(type)) {
    if (inputValue != null) {
      return coerceInputValueImpl(inputValue, type.ofType, onError, path);
    }
    onError(
      pathToArray(path),
      inputValue,
      new GraphQLError(
        `Expected non-nullable type "${inspect(type)}" not to be null.`
      )
    );
    return;
  }
  if (inputValue == null) {
    return null;
  }
  if (isListType(type)) {
    const itemType = type.ofType;
    if (isIterableObject(inputValue)) {
      return Array.from(inputValue, (itemValue, index) => {
        const itemPath = addPath(path, index, void 0);
        return coerceInputValueImpl(itemValue, itemType, onError, itemPath);
      });
    }
    return [coerceInputValueImpl(inputValue, itemType, onError, path)];
  }
  if (isInputObjectType(type)) {
    if (!isObjectLike(inputValue)) {
      onError(
        pathToArray(path),
        inputValue,
        new GraphQLError(`Expected type "${type.name}" to be an object.`)
      );
      return;
    }
    const coercedValue = {};
    const fieldDefs = type.getFields();
    for (const field2 of Object.values(fieldDefs)) {
      const fieldValue = inputValue[field2.name];
      if (fieldValue === void 0) {
        if (field2.defaultValue !== void 0) {
          coercedValue[field2.name] = field2.defaultValue;
        } else if (isNonNullType(field2.type)) {
          const typeStr = inspect(field2.type);
          onError(
            pathToArray(path),
            inputValue,
            new GraphQLError(
              `Field "${field2.name}" of required type "${typeStr}" was not provided.`
            )
          );
        }
        continue;
      }
      coercedValue[field2.name] = coerceInputValueImpl(
        fieldValue,
        field2.type,
        onError,
        addPath(path, field2.name, type.name)
      );
    }
    for (const fieldName of Object.keys(inputValue)) {
      if (!fieldDefs[fieldName]) {
        const suggestions = suggestionList(
          fieldName,
          Object.keys(type.getFields())
        );
        onError(
          pathToArray(path),
          inputValue,
          new GraphQLError(
            `Field "${fieldName}" is not defined by type "${type.name}".` + didYouMean(suggestions)
          )
        );
      }
    }
    return coercedValue;
  }
  if (isLeafType(type)) {
    let parseResult;
    try {
      parseResult = type.parseValue(inputValue);
    } catch (error2) {
      if (error2 instanceof GraphQLError) {
        onError(pathToArray(path), inputValue, error2);
      } else {
        onError(
          pathToArray(path),
          inputValue,
          new GraphQLError(`Expected type "${type.name}". ` + error2.message, {
            originalError: error2
          })
        );
      }
      return;
    }
    if (parseResult === void 0) {
      onError(
        pathToArray(path),
        inputValue,
        new GraphQLError(`Expected type "${type.name}".`)
      );
    }
    return parseResult;
  }
  invariant(false, "Unexpected input type: " + inspect(type));
}
function valueFromAST(valueNode, type, variables) {
  if (!valueNode) {
    return;
  }
  if (valueNode.kind === Kind.VARIABLE) {
    const variableName = valueNode.name.value;
    if (variables == null || variables[variableName] === void 0) {
      return;
    }
    const variableValue = variables[variableName];
    if (variableValue === null && isNonNullType(type)) {
      return;
    }
    return variableValue;
  }
  if (isNonNullType(type)) {
    if (valueNode.kind === Kind.NULL) {
      return;
    }
    return valueFromAST(valueNode, type.ofType, variables);
  }
  if (valueNode.kind === Kind.NULL) {
    return null;
  }
  if (isListType(type)) {
    const itemType = type.ofType;
    if (valueNode.kind === Kind.LIST) {
      const coercedValues = [];
      for (const itemNode of valueNode.values) {
        if (isMissingVariable(itemNode, variables)) {
          if (isNonNullType(itemType)) {
            return;
          }
          coercedValues.push(null);
        } else {
          const itemValue = valueFromAST(itemNode, itemType, variables);
          if (itemValue === void 0) {
            return;
          }
          coercedValues.push(itemValue);
        }
      }
      return coercedValues;
    }
    const coercedValue = valueFromAST(valueNode, itemType, variables);
    if (coercedValue === void 0) {
      return;
    }
    return [coercedValue];
  }
  if (isInputObjectType(type)) {
    if (valueNode.kind !== Kind.OBJECT) {
      return;
    }
    const coercedObj = /* @__PURE__ */ Object.create(null);
    const fieldNodes = keyMap(valueNode.fields, (field2) => field2.name.value);
    for (const field2 of Object.values(type.getFields())) {
      const fieldNode = fieldNodes[field2.name];
      if (!fieldNode || isMissingVariable(fieldNode.value, variables)) {
        if (field2.defaultValue !== void 0) {
          coercedObj[field2.name] = field2.defaultValue;
        } else if (isNonNullType(field2.type)) {
          return;
        }
        continue;
      }
      const fieldValue = valueFromAST(fieldNode.value, field2.type, variables);
      if (fieldValue === void 0) {
        return;
      }
      coercedObj[field2.name] = fieldValue;
    }
    return coercedObj;
  }
  if (isLeafType(type)) {
    let result;
    try {
      result = type.parseLiteral(valueNode, variables);
    } catch (_error) {
      return;
    }
    if (result === void 0) {
      return;
    }
    return result;
  }
  invariant(false, "Unexpected input type: " + inspect(type));
}
function isMissingVariable(valueNode, variables) {
  return valueNode.kind === Kind.VARIABLE && (variables == null || variables[valueNode.name.value] === void 0);
}
function getVariableValues(schema, varDefNodes, inputs, options) {
  const errors2 = [];
  const maxErrors = options === null || options === void 0 ? void 0 : options.maxErrors;
  try {
    const coerced = coerceVariableValues(
      schema,
      varDefNodes,
      inputs,
      (error2) => {
        if (maxErrors != null && errors2.length >= maxErrors) {
          throw new GraphQLError(
            "Too many errors processing variables, error limit reached. Execution aborted."
          );
        }
        errors2.push(error2);
      }
    );
    if (errors2.length === 0) {
      return {
        coerced
      };
    }
  } catch (error2) {
    errors2.push(error2);
  }
  return {
    errors: errors2
  };
}
function coerceVariableValues(schema, varDefNodes, inputs, onError) {
  const coercedValues = {};
  for (const varDefNode of varDefNodes) {
    const varName = varDefNode.variable.name.value;
    const varType = typeFromAST(schema, varDefNode.type);
    if (!isInputType(varType)) {
      const varTypeStr = print(varDefNode.type);
      onError(
        new GraphQLError(
          `Variable "$${varName}" expected value of type "${varTypeStr}" which cannot be used as an input type.`,
          {
            nodes: varDefNode.type
          }
        )
      );
      continue;
    }
    if (!hasOwnProperty(inputs, varName)) {
      if (varDefNode.defaultValue) {
        coercedValues[varName] = valueFromAST(varDefNode.defaultValue, varType);
      } else if (isNonNullType(varType)) {
        const varTypeStr = inspect(varType);
        onError(
          new GraphQLError(
            `Variable "$${varName}" of required type "${varTypeStr}" was not provided.`,
            {
              nodes: varDefNode
            }
          )
        );
      }
      continue;
    }
    const value = inputs[varName];
    if (value === null && isNonNullType(varType)) {
      const varTypeStr = inspect(varType);
      onError(
        new GraphQLError(
          `Variable "$${varName}" of non-null type "${varTypeStr}" must not be null.`,
          {
            nodes: varDefNode
          }
        )
      );
      continue;
    }
    coercedValues[varName] = coerceInputValue(
      value,
      varType,
      (path, invalidValue, error2) => {
        let prefix = `Variable "$${varName}" got invalid value ` + inspect(invalidValue);
        if (path.length > 0) {
          prefix += ` at "${varName}${printPathArray(path)}"`;
        }
        onError(
          new GraphQLError(prefix + "; " + error2.message, {
            nodes: varDefNode,
            originalError: error2.originalError
          })
        );
      }
    );
  }
  return coercedValues;
}
function getArgumentValues(def, node, variableValues) {
  var _node$arguments;
  const coercedValues = {};
  const argumentNodes = (_node$arguments = node.arguments) !== null && _node$arguments !== void 0 ? _node$arguments : [];
  const argNodeMap = keyMap(argumentNodes, (arg) => arg.name.value);
  for (const argDef of def.args) {
    const name = argDef.name;
    const argType = argDef.type;
    const argumentNode = argNodeMap[name];
    if (!argumentNode) {
      if (argDef.defaultValue !== void 0) {
        coercedValues[name] = argDef.defaultValue;
      } else if (isNonNullType(argType)) {
        throw new GraphQLError(
          `Argument "${name}" of required type "${inspect(argType)}" was not provided.`,
          {
            nodes: node
          }
        );
      }
      continue;
    }
    const valueNode = argumentNode.value;
    let isNull = valueNode.kind === Kind.NULL;
    if (valueNode.kind === Kind.VARIABLE) {
      const variableName = valueNode.name.value;
      if (variableValues == null || !hasOwnProperty(variableValues, variableName)) {
        if (argDef.defaultValue !== void 0) {
          coercedValues[name] = argDef.defaultValue;
        } else if (isNonNullType(argType)) {
          throw new GraphQLError(
            `Argument "${name}" of required type "${inspect(argType)}" was provided the variable "$${variableName}" which was not provided a runtime value.`,
            {
              nodes: valueNode
            }
          );
        }
        continue;
      }
      isNull = variableValues[variableName] == null;
    }
    if (isNull && isNonNullType(argType)) {
      throw new GraphQLError(
        `Argument "${name}" of non-null type "${inspect(argType)}" must not be null.`,
        {
          nodes: valueNode
        }
      );
    }
    const coercedValue = valueFromAST(valueNode, argType, variableValues);
    if (coercedValue === void 0) {
      throw new GraphQLError(
        `Argument "${name}" has invalid value ${print(valueNode)}.`,
        {
          nodes: valueNode
        }
      );
    }
    coercedValues[name] = coercedValue;
  }
  return coercedValues;
}
function getDirectiveValues(directiveDef, node, variableValues) {
  var _node$directives;
  const directiveNode = (_node$directives = node.directives) === null || _node$directives === void 0 ? void 0 : _node$directives.find(
    (directive) => directive.name.value === directiveDef.name
  );
  if (directiveNode) {
    return getArgumentValues(directiveDef, directiveNode, variableValues);
  }
}
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}
function collectFields(schema, fragments, variableValues, runtimeType, selectionSet) {
  const fields = /* @__PURE__ */ new Map();
  collectFieldsImpl(
    schema,
    fragments,
    variableValues,
    runtimeType,
    selectionSet,
    fields,
    /* @__PURE__ */ new Set()
  );
  return fields;
}
function collectSubfields$1(schema, fragments, variableValues, returnType, fieldNodes) {
  const subFieldNodes = /* @__PURE__ */ new Map();
  const visitedFragmentNames = /* @__PURE__ */ new Set();
  for (const node of fieldNodes) {
    if (node.selectionSet) {
      collectFieldsImpl(
        schema,
        fragments,
        variableValues,
        returnType,
        node.selectionSet,
        subFieldNodes,
        visitedFragmentNames
      );
    }
  }
  return subFieldNodes;
}
function collectFieldsImpl(schema, fragments, variableValues, runtimeType, selectionSet, fields, visitedFragmentNames) {
  for (const selection of selectionSet.selections) {
    switch (selection.kind) {
      case Kind.FIELD: {
        if (!shouldIncludeNode(variableValues, selection)) {
          continue;
        }
        const name = getFieldEntryKey(selection);
        const fieldList = fields.get(name);
        if (fieldList !== void 0) {
          fieldList.push(selection);
        } else {
          fields.set(name, [selection]);
        }
        break;
      }
      case Kind.INLINE_FRAGMENT: {
        if (!shouldIncludeNode(variableValues, selection) || !doesFragmentConditionMatch(schema, selection, runtimeType)) {
          continue;
        }
        collectFieldsImpl(
          schema,
          fragments,
          variableValues,
          runtimeType,
          selection.selectionSet,
          fields,
          visitedFragmentNames
        );
        break;
      }
      case Kind.FRAGMENT_SPREAD: {
        const fragName = selection.name.value;
        if (visitedFragmentNames.has(fragName) || !shouldIncludeNode(variableValues, selection)) {
          continue;
        }
        visitedFragmentNames.add(fragName);
        const fragment = fragments[fragName];
        if (!fragment || !doesFragmentConditionMatch(schema, fragment, runtimeType)) {
          continue;
        }
        collectFieldsImpl(
          schema,
          fragments,
          variableValues,
          runtimeType,
          fragment.selectionSet,
          fields,
          visitedFragmentNames
        );
        break;
      }
    }
  }
}
function shouldIncludeNode(variableValues, node) {
  const skip = getDirectiveValues(GraphQLSkipDirective, node, variableValues);
  if ((skip === null || skip === void 0 ? void 0 : skip.if) === true) {
    return false;
  }
  const include = getDirectiveValues(
    GraphQLIncludeDirective,
    node,
    variableValues
  );
  if ((include === null || include === void 0 ? void 0 : include.if) === false) {
    return false;
  }
  return true;
}
function doesFragmentConditionMatch(schema, fragment, type) {
  const typeConditionNode = fragment.typeCondition;
  if (!typeConditionNode) {
    return true;
  }
  const conditionalType = typeFromAST(schema, typeConditionNode);
  if (conditionalType === type) {
    return true;
  }
  if (isAbstractType(conditionalType)) {
    return schema.isSubType(conditionalType, type);
  }
  return false;
}
function getFieldEntryKey(node) {
  return node.alias ? node.alias.value : node.name.value;
}
function SingleFieldSubscriptionsRule(context) {
  return {
    OperationDefinition(node) {
      if (node.operation === "subscription") {
        const schema = context.getSchema();
        const subscriptionType = schema.getSubscriptionType();
        if (subscriptionType) {
          const operationName = node.name ? node.name.value : null;
          const variableValues = /* @__PURE__ */ Object.create(null);
          const document2 = context.getDocument();
          const fragments = /* @__PURE__ */ Object.create(null);
          for (const definition of document2.definitions) {
            if (definition.kind === Kind.FRAGMENT_DEFINITION) {
              fragments[definition.name.value] = definition;
            }
          }
          const fields = collectFields(
            schema,
            fragments,
            variableValues,
            subscriptionType,
            node.selectionSet
          );
          if (fields.size > 1) {
            const fieldSelectionLists = [...fields.values()];
            const extraFieldSelectionLists = fieldSelectionLists.slice(1);
            const extraFieldSelections = extraFieldSelectionLists.flat();
            context.reportError(
              new GraphQLError(
                operationName != null ? `Subscription "${operationName}" must select only one top level field.` : "Anonymous Subscription must select only one top level field.",
                {
                  nodes: extraFieldSelections
                }
              )
            );
          }
          for (const fieldNodes of fields.values()) {
            const field2 = fieldNodes[0];
            const fieldName = field2.name.value;
            if (fieldName.startsWith("__")) {
              context.reportError(
                new GraphQLError(
                  operationName != null ? `Subscription "${operationName}" must not select an introspection top level field.` : "Anonymous Subscription must not select an introspection top level field.",
                  {
                    nodes: fieldNodes
                  }
                )
              );
            }
          }
        }
      }
    }
  };
}
function groupBy(list, keyFn) {
  const result = /* @__PURE__ */ new Map();
  for (const item of list) {
    const key = keyFn(item);
    const group = result.get(key);
    if (group === void 0) {
      result.set(key, [item]);
    } else {
      group.push(item);
    }
  }
  return result;
}
function UniqueArgumentDefinitionNamesRule(context) {
  return {
    DirectiveDefinition(directiveNode) {
      var _directiveNode$argume;
      const argumentNodes = (_directiveNode$argume = directiveNode.arguments) !== null && _directiveNode$argume !== void 0 ? _directiveNode$argume : [];
      return checkArgUniqueness(`@${directiveNode.name.value}`, argumentNodes);
    },
    InterfaceTypeDefinition: checkArgUniquenessPerField,
    InterfaceTypeExtension: checkArgUniquenessPerField,
    ObjectTypeDefinition: checkArgUniquenessPerField,
    ObjectTypeExtension: checkArgUniquenessPerField
  };
  function checkArgUniquenessPerField(typeNode) {
    var _typeNode$fields;
    const typeName = typeNode.name.value;
    const fieldNodes = (_typeNode$fields = typeNode.fields) !== null && _typeNode$fields !== void 0 ? _typeNode$fields : [];
    for (const fieldDef of fieldNodes) {
      var _fieldDef$arguments;
      const fieldName = fieldDef.name.value;
      const argumentNodes = (_fieldDef$arguments = fieldDef.arguments) !== null && _fieldDef$arguments !== void 0 ? _fieldDef$arguments : [];
      checkArgUniqueness(`${typeName}.${fieldName}`, argumentNodes);
    }
    return false;
  }
  function checkArgUniqueness(parentName, argumentNodes) {
    const seenArgs = groupBy(argumentNodes, (arg) => arg.name.value);
    for (const [argName, argNodes] of seenArgs) {
      if (argNodes.length > 1) {
        context.reportError(
          new GraphQLError(
            `Argument "${parentName}(${argName}:)" can only be defined once.`,
            {
              nodes: argNodes.map((node) => node.name)
            }
          )
        );
      }
    }
    return false;
  }
}
function UniqueArgumentNamesRule(context) {
  return {
    Field: checkArgUniqueness,
    Directive: checkArgUniqueness
  };
  function checkArgUniqueness(parentNode) {
    var _parentNode$arguments;
    const argumentNodes = (_parentNode$arguments = parentNode.arguments) !== null && _parentNode$arguments !== void 0 ? _parentNode$arguments : [];
    const seenArgs = groupBy(argumentNodes, (arg) => arg.name.value);
    for (const [argName, argNodes] of seenArgs) {
      if (argNodes.length > 1) {
        context.reportError(
          new GraphQLError(
            `There can be only one argument named "${argName}".`,
            {
              nodes: argNodes.map((node) => node.name)
            }
          )
        );
      }
    }
  }
}
function UniqueDirectiveNamesRule(context) {
  const knownDirectiveNames = /* @__PURE__ */ Object.create(null);
  const schema = context.getSchema();
  return {
    DirectiveDefinition(node) {
      const directiveName = node.name.value;
      if (schema !== null && schema !== void 0 && schema.getDirective(directiveName)) {
        context.reportError(
          new GraphQLError(
            `Directive "@${directiveName}" already exists in the schema. It cannot be redefined.`,
            {
              nodes: node.name
            }
          )
        );
        return;
      }
      if (knownDirectiveNames[directiveName]) {
        context.reportError(
          new GraphQLError(
            `There can be only one directive named "@${directiveName}".`,
            {
              nodes: [knownDirectiveNames[directiveName], node.name]
            }
          )
        );
      } else {
        knownDirectiveNames[directiveName] = node.name;
      }
      return false;
    }
  };
}
function UniqueDirectivesPerLocationRule(context) {
  const uniqueDirectiveMap = /* @__PURE__ */ Object.create(null);
  const schema = context.getSchema();
  const definedDirectives = schema ? schema.getDirectives() : specifiedDirectives;
  for (const directive of definedDirectives) {
    uniqueDirectiveMap[directive.name] = !directive.isRepeatable;
  }
  const astDefinitions = context.getDocument().definitions;
  for (const def of astDefinitions) {
    if (def.kind === Kind.DIRECTIVE_DEFINITION) {
      uniqueDirectiveMap[def.name.value] = !def.repeatable;
    }
  }
  const schemaDirectives = /* @__PURE__ */ Object.create(null);
  const typeDirectivesMap = /* @__PURE__ */ Object.create(null);
  return {
    enter(node) {
      if (!("directives" in node) || !node.directives) {
        return;
      }
      let seenDirectives;
      if (node.kind === Kind.SCHEMA_DEFINITION || node.kind === Kind.SCHEMA_EXTENSION) {
        seenDirectives = schemaDirectives;
      } else if (isTypeDefinitionNode(node) || isTypeExtensionNode(node)) {
        const typeName = node.name.value;
        seenDirectives = typeDirectivesMap[typeName];
        if (seenDirectives === void 0) {
          typeDirectivesMap[typeName] = seenDirectives = /* @__PURE__ */ Object.create(null);
        }
      } else {
        seenDirectives = /* @__PURE__ */ Object.create(null);
      }
      for (const directive of node.directives) {
        const directiveName = directive.name.value;
        if (uniqueDirectiveMap[directiveName]) {
          if (seenDirectives[directiveName]) {
            context.reportError(
              new GraphQLError(
                `The directive "@${directiveName}" can only be used once at this location.`,
                {
                  nodes: [seenDirectives[directiveName], directive]
                }
              )
            );
          } else {
            seenDirectives[directiveName] = directive;
          }
        }
      }
    }
  };
}
function UniqueEnumValueNamesRule(context) {
  const schema = context.getSchema();
  const existingTypeMap = schema ? schema.getTypeMap() : /* @__PURE__ */ Object.create(null);
  const knownValueNames = /* @__PURE__ */ Object.create(null);
  return {
    EnumTypeDefinition: checkValueUniqueness,
    EnumTypeExtension: checkValueUniqueness
  };
  function checkValueUniqueness(node) {
    var _node$values;
    const typeName = node.name.value;
    if (!knownValueNames[typeName]) {
      knownValueNames[typeName] = /* @__PURE__ */ Object.create(null);
    }
    const valueNodes = (_node$values = node.values) !== null && _node$values !== void 0 ? _node$values : [];
    const valueNames = knownValueNames[typeName];
    for (const valueDef of valueNodes) {
      const valueName = valueDef.name.value;
      const existingType = existingTypeMap[typeName];
      if (isEnumType(existingType) && existingType.getValue(valueName)) {
        context.reportError(
          new GraphQLError(
            `Enum value "${typeName}.${valueName}" already exists in the schema. It cannot also be defined in this type extension.`,
            {
              nodes: valueDef.name
            }
          )
        );
      } else if (valueNames[valueName]) {
        context.reportError(
          new GraphQLError(
            `Enum value "${typeName}.${valueName}" can only be defined once.`,
            {
              nodes: [valueNames[valueName], valueDef.name]
            }
          )
        );
      } else {
        valueNames[valueName] = valueDef.name;
      }
    }
    return false;
  }
}
function UniqueFieldDefinitionNamesRule(context) {
  const schema = context.getSchema();
  const existingTypeMap = schema ? schema.getTypeMap() : /* @__PURE__ */ Object.create(null);
  const knownFieldNames = /* @__PURE__ */ Object.create(null);
  return {
    InputObjectTypeDefinition: checkFieldUniqueness,
    InputObjectTypeExtension: checkFieldUniqueness,
    InterfaceTypeDefinition: checkFieldUniqueness,
    InterfaceTypeExtension: checkFieldUniqueness,
    ObjectTypeDefinition: checkFieldUniqueness,
    ObjectTypeExtension: checkFieldUniqueness
  };
  function checkFieldUniqueness(node) {
    var _node$fields;
    const typeName = node.name.value;
    if (!knownFieldNames[typeName]) {
      knownFieldNames[typeName] = /* @__PURE__ */ Object.create(null);
    }
    const fieldNodes = (_node$fields = node.fields) !== null && _node$fields !== void 0 ? _node$fields : [];
    const fieldNames = knownFieldNames[typeName];
    for (const fieldDef of fieldNodes) {
      const fieldName = fieldDef.name.value;
      if (hasField(existingTypeMap[typeName], fieldName)) {
        context.reportError(
          new GraphQLError(
            `Field "${typeName}.${fieldName}" already exists in the schema. It cannot also be defined in this type extension.`,
            {
              nodes: fieldDef.name
            }
          )
        );
      } else if (fieldNames[fieldName]) {
        context.reportError(
          new GraphQLError(
            `Field "${typeName}.${fieldName}" can only be defined once.`,
            {
              nodes: [fieldNames[fieldName], fieldDef.name]
            }
          )
        );
      } else {
        fieldNames[fieldName] = fieldDef.name;
      }
    }
    return false;
  }
}
function hasField(type, fieldName) {
  if (isObjectType(type) || isInterfaceType(type) || isInputObjectType(type)) {
    return type.getFields()[fieldName] != null;
  }
  return false;
}
function UniqueFragmentNamesRule(context) {
  const knownFragmentNames = /* @__PURE__ */ Object.create(null);
  return {
    OperationDefinition: () => false,
    FragmentDefinition(node) {
      const fragmentName = node.name.value;
      if (knownFragmentNames[fragmentName]) {
        context.reportError(
          new GraphQLError(
            `There can be only one fragment named "${fragmentName}".`,
            {
              nodes: [knownFragmentNames[fragmentName], node.name]
            }
          )
        );
      } else {
        knownFragmentNames[fragmentName] = node.name;
      }
      return false;
    }
  };
}
function UniqueInputFieldNamesRule(context) {
  const knownNameStack = [];
  let knownNames = /* @__PURE__ */ Object.create(null);
  return {
    ObjectValue: {
      enter() {
        knownNameStack.push(knownNames);
        knownNames = /* @__PURE__ */ Object.create(null);
      },
      leave() {
        const prevKnownNames = knownNameStack.pop();
        prevKnownNames || invariant(false);
        knownNames = prevKnownNames;
      }
    },
    ObjectField(node) {
      const fieldName = node.name.value;
      if (knownNames[fieldName]) {
        context.reportError(
          new GraphQLError(
            `There can be only one input field named "${fieldName}".`,
            {
              nodes: [knownNames[fieldName], node.name]
            }
          )
        );
      } else {
        knownNames[fieldName] = node.name;
      }
    }
  };
}
function UniqueOperationNamesRule(context) {
  const knownOperationNames = /* @__PURE__ */ Object.create(null);
  return {
    OperationDefinition(node) {
      const operationName = node.name;
      if (operationName) {
        if (knownOperationNames[operationName.value]) {
          context.reportError(
            new GraphQLError(
              `There can be only one operation named "${operationName.value}".`,
              {
                nodes: [
                  knownOperationNames[operationName.value],
                  operationName
                ]
              }
            )
          );
        } else {
          knownOperationNames[operationName.value] = operationName;
        }
      }
      return false;
    },
    FragmentDefinition: () => false
  };
}
function UniqueOperationTypesRule(context) {
  const schema = context.getSchema();
  const definedOperationTypes = /* @__PURE__ */ Object.create(null);
  const existingOperationTypes = schema ? {
    query: schema.getQueryType(),
    mutation: schema.getMutationType(),
    subscription: schema.getSubscriptionType()
  } : {};
  return {
    SchemaDefinition: checkOperationTypes,
    SchemaExtension: checkOperationTypes
  };
  function checkOperationTypes(node) {
    var _node$operationTypes;
    const operationTypesNodes = (_node$operationTypes = node.operationTypes) !== null && _node$operationTypes !== void 0 ? _node$operationTypes : [];
    for (const operationType of operationTypesNodes) {
      const operation = operationType.operation;
      const alreadyDefinedOperationType = definedOperationTypes[operation];
      if (existingOperationTypes[operation]) {
        context.reportError(
          new GraphQLError(
            `Type for ${operation} already defined in the schema. It cannot be redefined.`,
            {
              nodes: operationType
            }
          )
        );
      } else if (alreadyDefinedOperationType) {
        context.reportError(
          new GraphQLError(
            `There can be only one ${operation} type in schema.`,
            {
              nodes: [alreadyDefinedOperationType, operationType]
            }
          )
        );
      } else {
        definedOperationTypes[operation] = operationType;
      }
    }
    return false;
  }
}
function UniqueTypeNamesRule(context) {
  const knownTypeNames = /* @__PURE__ */ Object.create(null);
  const schema = context.getSchema();
  return {
    ScalarTypeDefinition: checkTypeName,
    ObjectTypeDefinition: checkTypeName,
    InterfaceTypeDefinition: checkTypeName,
    UnionTypeDefinition: checkTypeName,
    EnumTypeDefinition: checkTypeName,
    InputObjectTypeDefinition: checkTypeName
  };
  function checkTypeName(node) {
    const typeName = node.name.value;
    if (schema !== null && schema !== void 0 && schema.getType(typeName)) {
      context.reportError(
        new GraphQLError(
          `Type "${typeName}" already exists in the schema. It cannot also be defined in this type definition.`,
          {
            nodes: node.name
          }
        )
      );
      return;
    }
    if (knownTypeNames[typeName]) {
      context.reportError(
        new GraphQLError(`There can be only one type named "${typeName}".`, {
          nodes: [knownTypeNames[typeName], node.name]
        })
      );
    } else {
      knownTypeNames[typeName] = node.name;
    }
    return false;
  }
}
function UniqueVariableNamesRule(context) {
  return {
    OperationDefinition(operationNode) {
      var _operationNode$variab;
      const variableDefinitions = (_operationNode$variab = operationNode.variableDefinitions) !== null && _operationNode$variab !== void 0 ? _operationNode$variab : [];
      const seenVariableDefinitions = groupBy(
        variableDefinitions,
        (node) => node.variable.name.value
      );
      for (const [variableName, variableNodes] of seenVariableDefinitions) {
        if (variableNodes.length > 1) {
          context.reportError(
            new GraphQLError(
              `There can be only one variable named "$${variableName}".`,
              {
                nodes: variableNodes.map((node) => node.variable.name)
              }
            )
          );
        }
      }
    }
  };
}
function ValuesOfCorrectTypeRule(context) {
  return {
    ListValue(node) {
      const type = getNullableType(context.getParentInputType());
      if (!isListType(type)) {
        isValidValueNode(context, node);
        return false;
      }
    },
    ObjectValue(node) {
      const type = getNamedType(context.getInputType());
      if (!isInputObjectType(type)) {
        isValidValueNode(context, node);
        return false;
      }
      const fieldNodeMap = keyMap(node.fields, (field2) => field2.name.value);
      for (const fieldDef of Object.values(type.getFields())) {
        const fieldNode = fieldNodeMap[fieldDef.name];
        if (!fieldNode && isRequiredInputField(fieldDef)) {
          const typeStr = inspect(fieldDef.type);
          context.reportError(
            new GraphQLError(
              `Field "${type.name}.${fieldDef.name}" of required type "${typeStr}" was not provided.`,
              {
                nodes: node
              }
            )
          );
        }
      }
    },
    ObjectField(node) {
      const parentType = getNamedType(context.getParentInputType());
      const fieldType = context.getInputType();
      if (!fieldType && isInputObjectType(parentType)) {
        const suggestions = suggestionList(
          node.name.value,
          Object.keys(parentType.getFields())
        );
        context.reportError(
          new GraphQLError(
            `Field "${node.name.value}" is not defined by type "${parentType.name}".` + didYouMean(suggestions),
            {
              nodes: node
            }
          )
        );
      }
    },
    NullValue(node) {
      const type = context.getInputType();
      if (isNonNullType(type)) {
        context.reportError(
          new GraphQLError(
            `Expected value of type "${inspect(type)}", found ${print(node)}.`,
            {
              nodes: node
            }
          )
        );
      }
    },
    EnumValue: (node) => isValidValueNode(context, node),
    IntValue: (node) => isValidValueNode(context, node),
    FloatValue: (node) => isValidValueNode(context, node),
    StringValue: (node) => isValidValueNode(context, node),
    BooleanValue: (node) => isValidValueNode(context, node)
  };
}
function isValidValueNode(context, node) {
  const locationType = context.getInputType();
  if (!locationType) {
    return;
  }
  const type = getNamedType(locationType);
  if (!isLeafType(type)) {
    const typeStr = inspect(locationType);
    context.reportError(
      new GraphQLError(
        `Expected value of type "${typeStr}", found ${print(node)}.`,
        {
          nodes: node
        }
      )
    );
    return;
  }
  try {
    const parseResult = type.parseLiteral(
      node,
      void 0
    );
    if (parseResult === void 0) {
      const typeStr = inspect(locationType);
      context.reportError(
        new GraphQLError(
          `Expected value of type "${typeStr}", found ${print(node)}.`,
          {
            nodes: node
          }
        )
      );
    }
  } catch (error2) {
    const typeStr = inspect(locationType);
    if (error2 instanceof GraphQLError) {
      context.reportError(error2);
    } else {
      context.reportError(
        new GraphQLError(
          `Expected value of type "${typeStr}", found ${print(node)}; ` + error2.message,
          {
            nodes: node,
            originalError: error2
          }
        )
      );
    }
  }
}
function VariablesAreInputTypesRule(context) {
  return {
    VariableDefinition(node) {
      const type = typeFromAST(context.getSchema(), node.type);
      if (type !== void 0 && !isInputType(type)) {
        const variableName = node.variable.name.value;
        const typeName = print(node.type);
        context.reportError(
          new GraphQLError(
            `Variable "$${variableName}" cannot be non-input type "${typeName}".`,
            {
              nodes: node.type
            }
          )
        );
      }
    }
  };
}
function VariablesInAllowedPositionRule(context) {
  let varDefMap = /* @__PURE__ */ Object.create(null);
  return {
    OperationDefinition: {
      enter() {
        varDefMap = /* @__PURE__ */ Object.create(null);
      },
      leave(operation) {
        const usages = context.getRecursiveVariableUsages(operation);
        for (const { node, type, defaultValue } of usages) {
          const varName = node.name.value;
          const varDef = varDefMap[varName];
          if (varDef && type) {
            const schema = context.getSchema();
            const varType = typeFromAST(schema, varDef.type);
            if (varType && !allowedVariableUsage(
              schema,
              varType,
              varDef.defaultValue,
              type,
              defaultValue
            )) {
              const varTypeStr = inspect(varType);
              const typeStr = inspect(type);
              context.reportError(
                new GraphQLError(
                  `Variable "$${varName}" of type "${varTypeStr}" used in position expecting type "${typeStr}".`,
                  {
                    nodes: [varDef, node]
                  }
                )
              );
            }
          }
        }
      }
    },
    VariableDefinition(node) {
      varDefMap[node.variable.name.value] = node;
    }
  };
}
function allowedVariableUsage(schema, varType, varDefaultValue, locationType, locationDefaultValue) {
  if (isNonNullType(locationType) && !isNonNullType(varType)) {
    const hasNonNullVariableDefaultValue = varDefaultValue != null && varDefaultValue.kind !== Kind.NULL;
    const hasLocationDefaultValue = locationDefaultValue !== void 0;
    if (!hasNonNullVariableDefaultValue && !hasLocationDefaultValue) {
      return false;
    }
    const nullableLocationType = locationType.ofType;
    return isTypeSubTypeOf(schema, varType, nullableLocationType);
  }
  return isTypeSubTypeOf(schema, varType, locationType);
}
const specifiedRules = Object.freeze([
  ExecutableDefinitionsRule,
  UniqueOperationNamesRule,
  LoneAnonymousOperationRule,
  SingleFieldSubscriptionsRule,
  KnownTypeNamesRule,
  FragmentsOnCompositeTypesRule,
  VariablesAreInputTypesRule,
  ScalarLeafsRule,
  FieldsOnCorrectTypeRule,
  UniqueFragmentNamesRule,
  KnownFragmentNamesRule,
  NoUnusedFragmentsRule,
  PossibleFragmentSpreadsRule,
  NoFragmentCyclesRule,
  UniqueVariableNamesRule,
  NoUndefinedVariablesRule,
  NoUnusedVariablesRule,
  KnownDirectivesRule,
  UniqueDirectivesPerLocationRule,
  KnownArgumentNamesRule,
  UniqueArgumentNamesRule,
  ValuesOfCorrectTypeRule,
  ProvidedRequiredArgumentsRule,
  VariablesInAllowedPositionRule,
  OverlappingFieldsCanBeMergedRule,
  UniqueInputFieldNamesRule
]);
const specifiedSDLRules = Object.freeze([
  LoneSchemaDefinitionRule,
  UniqueOperationTypesRule,
  UniqueTypeNamesRule,
  UniqueEnumValueNamesRule,
  UniqueFieldDefinitionNamesRule,
  UniqueArgumentDefinitionNamesRule,
  UniqueDirectiveNamesRule,
  KnownTypeNamesRule,
  KnownDirectivesRule,
  UniqueDirectivesPerLocationRule,
  PossibleTypeExtensionsRule,
  KnownArgumentNamesOnDirectivesRule,
  UniqueArgumentNamesRule,
  UniqueInputFieldNamesRule,
  ProvidedRequiredArgumentsOnDirectivesRule
]);
class ASTValidationContext {
  constructor(ast, onError) {
    this._ast = ast;
    this._fragments = void 0;
    this._fragmentSpreads = /* @__PURE__ */ new Map();
    this._recursivelyReferencedFragments = /* @__PURE__ */ new Map();
    this._onError = onError;
  }
  get [Symbol.toStringTag]() {
    return "ASTValidationContext";
  }
  reportError(error2) {
    this._onError(error2);
  }
  getDocument() {
    return this._ast;
  }
  getFragment(name) {
    let fragments;
    if (this._fragments) {
      fragments = this._fragments;
    } else {
      fragments = /* @__PURE__ */ Object.create(null);
      for (const defNode of this.getDocument().definitions) {
        if (defNode.kind === Kind.FRAGMENT_DEFINITION) {
          fragments[defNode.name.value] = defNode;
        }
      }
      this._fragments = fragments;
    }
    return fragments[name];
  }
  getFragmentSpreads(node) {
    let spreads = this._fragmentSpreads.get(node);
    if (!spreads) {
      spreads = [];
      const setsToVisit = [node];
      let set2;
      while (set2 = setsToVisit.pop()) {
        for (const selection of set2.selections) {
          if (selection.kind === Kind.FRAGMENT_SPREAD) {
            spreads.push(selection);
          } else if (selection.selectionSet) {
            setsToVisit.push(selection.selectionSet);
          }
        }
      }
      this._fragmentSpreads.set(node, spreads);
    }
    return spreads;
  }
  getRecursivelyReferencedFragments(operation) {
    let fragments = this._recursivelyReferencedFragments.get(operation);
    if (!fragments) {
      fragments = [];
      const collectedNames = /* @__PURE__ */ Object.create(null);
      const nodesToVisit = [operation.selectionSet];
      let node;
      while (node = nodesToVisit.pop()) {
        for (const spread of this.getFragmentSpreads(node)) {
          const fragName = spread.name.value;
          if (collectedNames[fragName] !== true) {
            collectedNames[fragName] = true;
            const fragment = this.getFragment(fragName);
            if (fragment) {
              fragments.push(fragment);
              nodesToVisit.push(fragment.selectionSet);
            }
          }
        }
      }
      this._recursivelyReferencedFragments.set(operation, fragments);
    }
    return fragments;
  }
}
class SDLValidationContext extends ASTValidationContext {
  constructor(ast, schema, onError) {
    super(ast, onError);
    this._schema = schema;
  }
  get [Symbol.toStringTag]() {
    return "SDLValidationContext";
  }
  getSchema() {
    return this._schema;
  }
}
class ValidationContext extends ASTValidationContext {
  constructor(schema, ast, typeInfo, onError) {
    super(ast, onError);
    this._schema = schema;
    this._typeInfo = typeInfo;
    this._variableUsages = /* @__PURE__ */ new Map();
    this._recursiveVariableUsages = /* @__PURE__ */ new Map();
  }
  get [Symbol.toStringTag]() {
    return "ValidationContext";
  }
  getSchema() {
    return this._schema;
  }
  getVariableUsages(node) {
    let usages = this._variableUsages.get(node);
    if (!usages) {
      const newUsages = [];
      const typeInfo = new TypeInfo(this._schema);
      visit(
        node,
        visitWithTypeInfo(typeInfo, {
          VariableDefinition: () => false,
          Variable(variable) {
            newUsages.push({
              node: variable,
              type: typeInfo.getInputType(),
              defaultValue: typeInfo.getDefaultValue()
            });
          }
        })
      );
      usages = newUsages;
      this._variableUsages.set(node, usages);
    }
    return usages;
  }
  getRecursiveVariableUsages(operation) {
    let usages = this._recursiveVariableUsages.get(operation);
    if (!usages) {
      usages = this.getVariableUsages(operation);
      for (const frag of this.getRecursivelyReferencedFragments(operation)) {
        usages = usages.concat(this.getVariableUsages(frag));
      }
      this._recursiveVariableUsages.set(operation, usages);
    }
    return usages;
  }
  getType() {
    return this._typeInfo.getType();
  }
  getParentType() {
    return this._typeInfo.getParentType();
  }
  getInputType() {
    return this._typeInfo.getInputType();
  }
  getParentInputType() {
    return this._typeInfo.getParentInputType();
  }
  getFieldDef() {
    return this._typeInfo.getFieldDef();
  }
  getDirective() {
    return this._typeInfo.getDirective();
  }
  getArgument() {
    return this._typeInfo.getArgument();
  }
  getEnumValue() {
    return this._typeInfo.getEnumValue();
  }
}
function validate(schema, documentAST, rules = specifiedRules, options, typeInfo = new TypeInfo(schema)) {
  var _options$maxErrors;
  const maxErrors = (_options$maxErrors = options === null || options === void 0 ? void 0 : options.maxErrors) !== null && _options$maxErrors !== void 0 ? _options$maxErrors : 100;
  documentAST || devAssert(false, "Must provide document.");
  assertValidSchema(schema);
  const abortObj = Object.freeze({});
  const errors2 = [];
  const context = new ValidationContext(
    schema,
    documentAST,
    typeInfo,
    (error2) => {
      if (errors2.length >= maxErrors) {
        errors2.push(
          new GraphQLError(
            "Too many validation errors, error limit reached. Validation aborted."
          )
        );
        throw abortObj;
      }
      errors2.push(error2);
    }
  );
  const visitor = visitInParallel(rules.map((rule) => rule(context)));
  try {
    visit(documentAST, visitWithTypeInfo(typeInfo, visitor));
  } catch (e) {
    if (e !== abortObj) {
      throw e;
    }
  }
  return errors2;
}
function validateSDL(documentAST, schemaToExtend, rules = specifiedSDLRules) {
  const errors2 = [];
  const context = new SDLValidationContext(
    documentAST,
    schemaToExtend,
    (error2) => {
      errors2.push(error2);
    }
  );
  const visitors = rules.map((rule) => rule(context));
  visit(documentAST, visitInParallel(visitors));
  return errors2;
}
function assertValidSDL(documentAST) {
  const errors2 = validateSDL(documentAST);
  if (errors2.length !== 0) {
    throw new Error(errors2.map((error2) => error2.message).join("\n\n"));
  }
}
function assertValidSDLExtension(documentAST, schema) {
  const errors2 = validateSDL(documentAST, schema);
  if (errors2.length !== 0) {
    throw new Error(errors2.map((error2) => error2.message).join("\n\n"));
  }
}
function memoize3(fn) {
  let cache0;
  return function memoized(a1, a2, a3) {
    if (cache0 === void 0) {
      cache0 = /* @__PURE__ */ new WeakMap();
    }
    let cache1 = cache0.get(a1);
    if (cache1 === void 0) {
      cache1 = /* @__PURE__ */ new WeakMap();
      cache0.set(a1, cache1);
    }
    let cache2 = cache1.get(a2);
    if (cache2 === void 0) {
      cache2 = /* @__PURE__ */ new WeakMap();
      cache1.set(a2, cache2);
    }
    let fnResult = cache2.get(a3);
    if (fnResult === void 0) {
      fnResult = fn(a1, a2, a3);
      cache2.set(a3, fnResult);
    }
    return fnResult;
  };
}
function promiseForObject(object) {
  return Promise.all(Object.values(object)).then((resolvedValues) => {
    const resolvedObject = /* @__PURE__ */ Object.create(null);
    for (const [i, key] of Object.keys(object).entries()) {
      resolvedObject[key] = resolvedValues[i];
    }
    return resolvedObject;
  });
}
function promiseReduce(values, callbackFn, initialValue) {
  let accumulator = initialValue;
  for (const value of values) {
    accumulator = isPromise(accumulator) ? accumulator.then((resolved) => callbackFn(resolved, value)) : callbackFn(accumulator, value);
  }
  return accumulator;
}
function toError(thrownValue) {
  return thrownValue instanceof Error ? thrownValue : new NonErrorThrown(thrownValue);
}
class NonErrorThrown extends Error {
  constructor(thrownValue) {
    super("Unexpected error value: " + inspect(thrownValue));
    this.name = "NonErrorThrown";
    this.thrownValue = thrownValue;
  }
}
function locatedError(rawOriginalError, nodes, path) {
  var _nodes;
  const originalError = toError(rawOriginalError);
  if (isLocatedGraphQLError(originalError)) {
    return originalError;
  }
  return new GraphQLError(originalError.message, {
    nodes: (_nodes = originalError.nodes) !== null && _nodes !== void 0 ? _nodes : nodes,
    source: originalError.source,
    positions: originalError.positions,
    path,
    originalError
  });
}
function isLocatedGraphQLError(error2) {
  return Array.isArray(error2.path);
}
const collectSubfields = memoize3(
  (exeContext, returnType, fieldNodes) => collectSubfields$1(
    exeContext.schema,
    exeContext.fragments,
    exeContext.variableValues,
    returnType,
    fieldNodes
  )
);
function execute(args) {
  arguments.length < 2 || devAssert(
    false,
    "graphql@16 dropped long-deprecated support for positional arguments, please pass an object instead."
  );
  const { schema, document: document2, variableValues, rootValue } = args;
  assertValidExecutionArguments(schema, document2, variableValues);
  const exeContext = buildExecutionContext(args);
  if (!("schema" in exeContext)) {
    return {
      errors: exeContext
    };
  }
  try {
    const { operation } = exeContext;
    const result = executeOperation(exeContext, operation, rootValue);
    if (isPromise(result)) {
      return result.then(
        (data2) => buildResponse(data2, exeContext.errors),
        (error2) => {
          exeContext.errors.push(error2);
          return buildResponse(null, exeContext.errors);
        }
      );
    }
    return buildResponse(result, exeContext.errors);
  } catch (error2) {
    exeContext.errors.push(error2);
    return buildResponse(null, exeContext.errors);
  }
}
function executeSync(args) {
  const result = execute(args);
  if (isPromise(result)) {
    throw new Error("GraphQL execution failed to complete synchronously.");
  }
  return result;
}
function buildResponse(data2, errors2) {
  return errors2.length === 0 ? {
    data: data2
  } : {
    errors: errors2,
    data: data2
  };
}
function assertValidExecutionArguments(schema, document2, rawVariableValues) {
  document2 || devAssert(false, "Must provide document.");
  assertValidSchema(schema);
  rawVariableValues == null || isObjectLike(rawVariableValues) || devAssert(
    false,
    "Variables must be provided as an Object where each property is a variable value. Perhaps look to see if an unparsed JSON string was provided."
  );
}
function buildExecutionContext(args) {
  var _definition$name, _operation$variableDe;
  const {
    schema,
    document: document2,
    rootValue,
    contextValue,
    variableValues: rawVariableValues,
    operationName,
    fieldResolver,
    typeResolver,
    subscribeFieldResolver
  } = args;
  let operation;
  const fragments = /* @__PURE__ */ Object.create(null);
  for (const definition of document2.definitions) {
    switch (definition.kind) {
      case Kind.OPERATION_DEFINITION:
        if (operationName == null) {
          if (operation !== void 0) {
            return [
              new GraphQLError(
                "Must provide operation name if query contains multiple operations."
              )
            ];
          }
          operation = definition;
        } else if (((_definition$name = definition.name) === null || _definition$name === void 0 ? void 0 : _definition$name.value) === operationName) {
          operation = definition;
        }
        break;
      case Kind.FRAGMENT_DEFINITION:
        fragments[definition.name.value] = definition;
        break;
    }
  }
  if (!operation) {
    if (operationName != null) {
      return [new GraphQLError(`Unknown operation named "${operationName}".`)];
    }
    return [new GraphQLError("Must provide an operation.")];
  }
  const variableDefinitions = (_operation$variableDe = operation.variableDefinitions) !== null && _operation$variableDe !== void 0 ? _operation$variableDe : [];
  const coercedVariableValues = getVariableValues(
    schema,
    variableDefinitions,
    rawVariableValues !== null && rawVariableValues !== void 0 ? rawVariableValues : {},
    {
      maxErrors: 50
    }
  );
  if (coercedVariableValues.errors) {
    return coercedVariableValues.errors;
  }
  return {
    schema,
    fragments,
    rootValue,
    contextValue,
    operation,
    variableValues: coercedVariableValues.coerced,
    fieldResolver: fieldResolver !== null && fieldResolver !== void 0 ? fieldResolver : defaultFieldResolver,
    typeResolver: typeResolver !== null && typeResolver !== void 0 ? typeResolver : defaultTypeResolver,
    subscribeFieldResolver: subscribeFieldResolver !== null && subscribeFieldResolver !== void 0 ? subscribeFieldResolver : defaultFieldResolver,
    errors: []
  };
}
function executeOperation(exeContext, operation, rootValue) {
  const rootType = exeContext.schema.getRootType(operation.operation);
  if (rootType == null) {
    throw new GraphQLError(
      `Schema is not configured to execute ${operation.operation} operation.`,
      {
        nodes: operation
      }
    );
  }
  const rootFields = collectFields(
    exeContext.schema,
    exeContext.fragments,
    exeContext.variableValues,
    rootType,
    operation.selectionSet
  );
  const path = void 0;
  switch (operation.operation) {
    case OperationTypeNode.QUERY:
      return executeFields(exeContext, rootType, rootValue, path, rootFields);
    case OperationTypeNode.MUTATION:
      return executeFieldsSerially(
        exeContext,
        rootType,
        rootValue,
        path,
        rootFields
      );
    case OperationTypeNode.SUBSCRIPTION:
      return executeFields(exeContext, rootType, rootValue, path, rootFields);
  }
}
function executeFieldsSerially(exeContext, parentType, sourceValue, path, fields) {
  return promiseReduce(
    fields.entries(),
    (results, [responseName, fieldNodes]) => {
      const fieldPath = addPath(path, responseName, parentType.name);
      const result = executeField(
        exeContext,
        parentType,
        sourceValue,
        fieldNodes,
        fieldPath
      );
      if (result === void 0) {
        return results;
      }
      if (isPromise(result)) {
        return result.then((resolvedResult) => {
          results[responseName] = resolvedResult;
          return results;
        });
      }
      results[responseName] = result;
      return results;
    },
    /* @__PURE__ */ Object.create(null)
  );
}
function executeFields(exeContext, parentType, sourceValue, path, fields) {
  const results = /* @__PURE__ */ Object.create(null);
  let containsPromise = false;
  for (const [responseName, fieldNodes] of fields.entries()) {
    const fieldPath = addPath(path, responseName, parentType.name);
    const result = executeField(
      exeContext,
      parentType,
      sourceValue,
      fieldNodes,
      fieldPath
    );
    if (result !== void 0) {
      results[responseName] = result;
      if (isPromise(result)) {
        containsPromise = true;
      }
    }
  }
  if (!containsPromise) {
    return results;
  }
  return promiseForObject(results);
}
function executeField(exeContext, parentType, source, fieldNodes, path) {
  var _fieldDef$resolve;
  const fieldDef = getFieldDef(exeContext.schema, parentType, fieldNodes[0]);
  if (!fieldDef) {
    return;
  }
  const returnType = fieldDef.type;
  const resolveFn = (_fieldDef$resolve = fieldDef.resolve) !== null && _fieldDef$resolve !== void 0 ? _fieldDef$resolve : exeContext.fieldResolver;
  const info = buildResolveInfo(
    exeContext,
    fieldDef,
    fieldNodes,
    parentType,
    path
  );
  try {
    const args = getArgumentValues(
      fieldDef,
      fieldNodes[0],
      exeContext.variableValues
    );
    const contextValue = exeContext.contextValue;
    const result = resolveFn(source, args, contextValue, info);
    let completed;
    if (isPromise(result)) {
      completed = result.then(
        (resolved) => completeValue(exeContext, returnType, fieldNodes, info, path, resolved)
      );
    } else {
      completed = completeValue(
        exeContext,
        returnType,
        fieldNodes,
        info,
        path,
        result
      );
    }
    if (isPromise(completed)) {
      return completed.then(void 0, (rawError) => {
        const error2 = locatedError(rawError, fieldNodes, pathToArray(path));
        return handleFieldError(error2, returnType, exeContext);
      });
    }
    return completed;
  } catch (rawError) {
    const error2 = locatedError(rawError, fieldNodes, pathToArray(path));
    return handleFieldError(error2, returnType, exeContext);
  }
}
function buildResolveInfo(exeContext, fieldDef, fieldNodes, parentType, path) {
  return {
    fieldName: fieldDef.name,
    fieldNodes,
    returnType: fieldDef.type,
    parentType,
    path,
    schema: exeContext.schema,
    fragments: exeContext.fragments,
    rootValue: exeContext.rootValue,
    operation: exeContext.operation,
    variableValues: exeContext.variableValues
  };
}
function handleFieldError(error2, returnType, exeContext) {
  if (isNonNullType(returnType)) {
    throw error2;
  }
  exeContext.errors.push(error2);
  return null;
}
function completeValue(exeContext, returnType, fieldNodes, info, path, result) {
  if (result instanceof Error) {
    throw result;
  }
  if (isNonNullType(returnType)) {
    const completed = completeValue(
      exeContext,
      returnType.ofType,
      fieldNodes,
      info,
      path,
      result
    );
    if (completed === null) {
      throw new Error(
        `Cannot return null for non-nullable field ${info.parentType.name}.${info.fieldName}.`
      );
    }
    return completed;
  }
  if (result == null) {
    return null;
  }
  if (isListType(returnType)) {
    return completeListValue(
      exeContext,
      returnType,
      fieldNodes,
      info,
      path,
      result
    );
  }
  if (isLeafType(returnType)) {
    return completeLeafValue(returnType, result);
  }
  if (isAbstractType(returnType)) {
    return completeAbstractValue(
      exeContext,
      returnType,
      fieldNodes,
      info,
      path,
      result
    );
  }
  if (isObjectType(returnType)) {
    return completeObjectValue(
      exeContext,
      returnType,
      fieldNodes,
      info,
      path,
      result
    );
  }
  invariant(
    false,
    "Cannot complete value of unexpected output type: " + inspect(returnType)
  );
}
function completeListValue(exeContext, returnType, fieldNodes, info, path, result) {
  if (!isIterableObject(result)) {
    throw new GraphQLError(
      `Expected Iterable, but did not find one for field "${info.parentType.name}.${info.fieldName}".`
    );
  }
  const itemType = returnType.ofType;
  let containsPromise = false;
  const completedResults = Array.from(result, (item, index) => {
    const itemPath = addPath(path, index, void 0);
    try {
      let completedItem;
      if (isPromise(item)) {
        completedItem = item.then(
          (resolved) => completeValue(
            exeContext,
            itemType,
            fieldNodes,
            info,
            itemPath,
            resolved
          )
        );
      } else {
        completedItem = completeValue(
          exeContext,
          itemType,
          fieldNodes,
          info,
          itemPath,
          item
        );
      }
      if (isPromise(completedItem)) {
        containsPromise = true;
        return completedItem.then(void 0, (rawError) => {
          const error2 = locatedError(
            rawError,
            fieldNodes,
            pathToArray(itemPath)
          );
          return handleFieldError(error2, itemType, exeContext);
        });
      }
      return completedItem;
    } catch (rawError) {
      const error2 = locatedError(rawError, fieldNodes, pathToArray(itemPath));
      return handleFieldError(error2, itemType, exeContext);
    }
  });
  return containsPromise ? Promise.all(completedResults) : completedResults;
}
function completeLeafValue(returnType, result) {
  const serializedResult = returnType.serialize(result);
  if (serializedResult == null) {
    throw new Error(
      `Expected \`${inspect(returnType)}.serialize(${inspect(result)})\` to return non-nullable value, returned: ${inspect(serializedResult)}`
    );
  }
  return serializedResult;
}
function completeAbstractValue(exeContext, returnType, fieldNodes, info, path, result) {
  var _returnType$resolveTy;
  const resolveTypeFn = (_returnType$resolveTy = returnType.resolveType) !== null && _returnType$resolveTy !== void 0 ? _returnType$resolveTy : exeContext.typeResolver;
  const contextValue = exeContext.contextValue;
  const runtimeType = resolveTypeFn(result, contextValue, info, returnType);
  if (isPromise(runtimeType)) {
    return runtimeType.then(
      (resolvedRuntimeType) => completeObjectValue(
        exeContext,
        ensureValidRuntimeType(
          resolvedRuntimeType,
          exeContext,
          returnType,
          fieldNodes,
          info,
          result
        ),
        fieldNodes,
        info,
        path,
        result
      )
    );
  }
  return completeObjectValue(
    exeContext,
    ensureValidRuntimeType(
      runtimeType,
      exeContext,
      returnType,
      fieldNodes,
      info,
      result
    ),
    fieldNodes,
    info,
    path,
    result
  );
}
function ensureValidRuntimeType(runtimeTypeName, exeContext, returnType, fieldNodes, info, result) {
  if (runtimeTypeName == null) {
    throw new GraphQLError(
      `Abstract type "${returnType.name}" must resolve to an Object type at runtime for field "${info.parentType.name}.${info.fieldName}". Either the "${returnType.name}" type should provide a "resolveType" function or each possible type should provide an "isTypeOf" function.`,
      fieldNodes
    );
  }
  if (isObjectType(runtimeTypeName)) {
    throw new GraphQLError(
      "Support for returning GraphQLObjectType from resolveType was removed in graphql-js@16.0.0 please return type name instead."
    );
  }
  if (typeof runtimeTypeName !== "string") {
    throw new GraphQLError(
      `Abstract type "${returnType.name}" must resolve to an Object type at runtime for field "${info.parentType.name}.${info.fieldName}" with value ${inspect(result)}, received "${inspect(runtimeTypeName)}".`
    );
  }
  const runtimeType = exeContext.schema.getType(runtimeTypeName);
  if (runtimeType == null) {
    throw new GraphQLError(
      `Abstract type "${returnType.name}" was resolved to a type "${runtimeTypeName}" that does not exist inside the schema.`,
      {
        nodes: fieldNodes
      }
    );
  }
  if (!isObjectType(runtimeType)) {
    throw new GraphQLError(
      `Abstract type "${returnType.name}" was resolved to a non-object type "${runtimeTypeName}".`,
      {
        nodes: fieldNodes
      }
    );
  }
  if (!exeContext.schema.isSubType(returnType, runtimeType)) {
    throw new GraphQLError(
      `Runtime Object type "${runtimeType.name}" is not a possible type for "${returnType.name}".`,
      {
        nodes: fieldNodes
      }
    );
  }
  return runtimeType;
}
function completeObjectValue(exeContext, returnType, fieldNodes, info, path, result) {
  const subFieldNodes = collectSubfields(exeContext, returnType, fieldNodes);
  if (returnType.isTypeOf) {
    const isTypeOf = returnType.isTypeOf(result, exeContext.contextValue, info);
    if (isPromise(isTypeOf)) {
      return isTypeOf.then((resolvedIsTypeOf) => {
        if (!resolvedIsTypeOf) {
          throw invalidReturnTypeError(returnType, result, fieldNodes);
        }
        return executeFields(
          exeContext,
          returnType,
          result,
          path,
          subFieldNodes
        );
      });
    }
    if (!isTypeOf) {
      throw invalidReturnTypeError(returnType, result, fieldNodes);
    }
  }
  return executeFields(exeContext, returnType, result, path, subFieldNodes);
}
function invalidReturnTypeError(returnType, result, fieldNodes) {
  return new GraphQLError(
    `Expected value of type "${returnType.name}" but got: ${inspect(result)}.`,
    {
      nodes: fieldNodes
    }
  );
}
const defaultTypeResolver = function(value, contextValue, info, abstractType) {
  if (isObjectLike(value) && typeof value.__typename === "string") {
    return value.__typename;
  }
  const possibleTypes = info.schema.getPossibleTypes(abstractType);
  const promisedIsTypeOfResults = [];
  for (let i = 0; i < possibleTypes.length; i++) {
    const type = possibleTypes[i];
    if (type.isTypeOf) {
      const isTypeOfResult = type.isTypeOf(value, contextValue, info);
      if (isPromise(isTypeOfResult)) {
        promisedIsTypeOfResults[i] = isTypeOfResult;
      } else if (isTypeOfResult) {
        return type.name;
      }
    }
  }
  if (promisedIsTypeOfResults.length) {
    return Promise.all(promisedIsTypeOfResults).then((isTypeOfResults) => {
      for (let i = 0; i < isTypeOfResults.length; i++) {
        if (isTypeOfResults[i]) {
          return possibleTypes[i].name;
        }
      }
    });
  }
};
const defaultFieldResolver = function(source, args, contextValue, info) {
  if (isObjectLike(source) || typeof source === "function") {
    const property = source[info.fieldName];
    if (typeof property === "function") {
      return source[info.fieldName](args, contextValue, info);
    }
    return property;
  }
};
function getFieldDef(schema, parentType, fieldNode) {
  const fieldName = fieldNode.name.value;
  if (fieldName === SchemaMetaFieldDef.name && schema.getQueryType() === parentType) {
    return SchemaMetaFieldDef;
  } else if (fieldName === TypeMetaFieldDef.name && schema.getQueryType() === parentType) {
    return TypeMetaFieldDef;
  } else if (fieldName === TypeNameMetaFieldDef.name) {
    return TypeNameMetaFieldDef;
  }
  return parentType.getFields()[fieldName];
}
function graphql$1(args) {
  return new Promise((resolve) => resolve(graphqlImpl(args)));
}
function graphqlSync(args) {
  const result = graphqlImpl(args);
  if (isPromise(result)) {
    throw new Error("GraphQL execution failed to complete synchronously.");
  }
  return result;
}
function graphqlImpl(args) {
  arguments.length < 2 || devAssert(
    false,
    "graphql@16 dropped long-deprecated support for positional arguments, please pass an object instead."
  );
  const {
    schema,
    source,
    rootValue,
    contextValue,
    variableValues,
    operationName,
    fieldResolver,
    typeResolver
  } = args;
  const schemaValidationErrors = validateSchema(schema);
  if (schemaValidationErrors.length > 0) {
    return {
      errors: schemaValidationErrors
    };
  }
  let document2;
  try {
    document2 = parse$1(source);
  } catch (syntaxError2) {
    return {
      errors: [syntaxError2]
    };
  }
  const validationErrors = validate(schema, document2);
  if (validationErrors.length > 0) {
    return {
      errors: validationErrors
    };
  }
  return execute({
    schema,
    document: document2,
    rootValue,
    contextValue,
    variableValues,
    operationName,
    fieldResolver,
    typeResolver
  });
}
function isAsyncIterable(maybeAsyncIterable) {
  return typeof (maybeAsyncIterable === null || maybeAsyncIterable === void 0 ? void 0 : maybeAsyncIterable[Symbol.asyncIterator]) === "function";
}
function mapAsyncIterator(iterable, callback) {
  const iterator = iterable[Symbol.asyncIterator]();
  async function mapResult(result) {
    if (result.done) {
      return result;
    }
    try {
      return {
        value: await callback(result.value),
        done: false
      };
    } catch (error2) {
      if (typeof iterator.return === "function") {
        try {
          await iterator.return();
        } catch (_e) {
        }
      }
      throw error2;
    }
  }
  return {
    async next() {
      return mapResult(await iterator.next());
    },
    async return() {
      return typeof iterator.return === "function" ? mapResult(await iterator.return()) : {
        value: void 0,
        done: true
      };
    },
    async throw(error2) {
      if (typeof iterator.throw === "function") {
        return mapResult(await iterator.throw(error2));
      }
      throw error2;
    },
    [Symbol.asyncIterator]() {
      return this;
    }
  };
}
async function subscribe(args) {
  arguments.length < 2 || devAssert(
    false,
    "graphql@16 dropped long-deprecated support for positional arguments, please pass an object instead."
  );
  const resultOrStream = await createSourceEventStream(args);
  if (!isAsyncIterable(resultOrStream)) {
    return resultOrStream;
  }
  const mapSourceToResponse = (payload) => execute({ ...args, rootValue: payload });
  return mapAsyncIterator(resultOrStream, mapSourceToResponse);
}
function toNormalizedArgs(args) {
  const firstArg = args[0];
  if (firstArg && "document" in firstArg) {
    return firstArg;
  }
  return {
    schema: firstArg,
    document: args[1],
    rootValue: args[2],
    contextValue: args[3],
    variableValues: args[4],
    operationName: args[5],
    subscribeFieldResolver: args[6]
  };
}
async function createSourceEventStream(...rawArgs) {
  const args = toNormalizedArgs(rawArgs);
  const { schema, document: document2, variableValues } = args;
  assertValidExecutionArguments(schema, document2, variableValues);
  const exeContext = buildExecutionContext(args);
  if (!("schema" in exeContext)) {
    return {
      errors: exeContext
    };
  }
  try {
    const eventStream = await executeSubscription(exeContext);
    if (!isAsyncIterable(eventStream)) {
      throw new Error(
        `Subscription field must return Async Iterable. Received: ${inspect(eventStream)}.`
      );
    }
    return eventStream;
  } catch (error2) {
    if (error2 instanceof GraphQLError) {
      return {
        errors: [error2]
      };
    }
    throw error2;
  }
}
async function executeSubscription(exeContext) {
  const { schema, fragments, operation, variableValues, rootValue } = exeContext;
  const rootType = schema.getSubscriptionType();
  if (rootType == null) {
    throw new GraphQLError(
      "Schema is not configured to execute subscription operation.",
      {
        nodes: operation
      }
    );
  }
  const rootFields = collectFields(
    schema,
    fragments,
    variableValues,
    rootType,
    operation.selectionSet
  );
  const [responseName, fieldNodes] = [...rootFields.entries()][0];
  const fieldDef = getFieldDef(schema, rootType, fieldNodes[0]);
  if (!fieldDef) {
    const fieldName = fieldNodes[0].name.value;
    throw new GraphQLError(
      `The subscription field "${fieldName}" is not defined.`,
      {
        nodes: fieldNodes
      }
    );
  }
  const path = addPath(void 0, responseName, rootType.name);
  const info = buildResolveInfo(
    exeContext,
    fieldDef,
    fieldNodes,
    rootType,
    path
  );
  try {
    var _fieldDef$subscribe;
    const args = getArgumentValues(fieldDef, fieldNodes[0], variableValues);
    const contextValue = exeContext.contextValue;
    const resolveFn = (_fieldDef$subscribe = fieldDef.subscribe) !== null && _fieldDef$subscribe !== void 0 ? _fieldDef$subscribe : exeContext.subscribeFieldResolver;
    const eventStream = await resolveFn(rootValue, args, contextValue, info);
    if (eventStream instanceof Error) {
      throw eventStream;
    }
    return eventStream;
  } catch (error2) {
    throw locatedError(error2, fieldNodes, pathToArray(path));
  }
}
function NoDeprecatedCustomRule(context) {
  return {
    Field(node) {
      const fieldDef = context.getFieldDef();
      const deprecationReason = fieldDef === null || fieldDef === void 0 ? void 0 : fieldDef.deprecationReason;
      if (fieldDef && deprecationReason != null) {
        const parentType = context.getParentType();
        parentType != null || invariant(false);
        context.reportError(
          new GraphQLError(
            `The field ${parentType.name}.${fieldDef.name} is deprecated. ${deprecationReason}`,
            {
              nodes: node
            }
          )
        );
      }
    },
    Argument(node) {
      const argDef = context.getArgument();
      const deprecationReason = argDef === null || argDef === void 0 ? void 0 : argDef.deprecationReason;
      if (argDef && deprecationReason != null) {
        const directiveDef = context.getDirective();
        if (directiveDef != null) {
          context.reportError(
            new GraphQLError(
              `Directive "@${directiveDef.name}" argument "${argDef.name}" is deprecated. ${deprecationReason}`,
              {
                nodes: node
              }
            )
          );
        } else {
          const parentType = context.getParentType();
          const fieldDef = context.getFieldDef();
          parentType != null && fieldDef != null || invariant(false);
          context.reportError(
            new GraphQLError(
              `Field "${parentType.name}.${fieldDef.name}" argument "${argDef.name}" is deprecated. ${deprecationReason}`,
              {
                nodes: node
              }
            )
          );
        }
      }
    },
    ObjectField(node) {
      const inputObjectDef = getNamedType(context.getParentInputType());
      if (isInputObjectType(inputObjectDef)) {
        const inputFieldDef = inputObjectDef.getFields()[node.name.value];
        const deprecationReason = inputFieldDef === null || inputFieldDef === void 0 ? void 0 : inputFieldDef.deprecationReason;
        if (deprecationReason != null) {
          context.reportError(
            new GraphQLError(
              `The input field ${inputObjectDef.name}.${inputFieldDef.name} is deprecated. ${deprecationReason}`,
              {
                nodes: node
              }
            )
          );
        }
      }
    },
    EnumValue(node) {
      const enumValueDef = context.getEnumValue();
      const deprecationReason = enumValueDef === null || enumValueDef === void 0 ? void 0 : enumValueDef.deprecationReason;
      if (enumValueDef && deprecationReason != null) {
        const enumTypeDef = getNamedType(context.getInputType());
        enumTypeDef != null || invariant(false);
        context.reportError(
          new GraphQLError(
            `The enum value "${enumTypeDef.name}.${enumValueDef.name}" is deprecated. ${deprecationReason}`,
            {
              nodes: node
            }
          )
        );
      }
    }
  };
}
function NoSchemaIntrospectionCustomRule(context) {
  return {
    Field(node) {
      const type = getNamedType(context.getType());
      if (type && isIntrospectionType(type)) {
        context.reportError(
          new GraphQLError(
            `GraphQL introspection has been disabled, but the requested query contained the field "${node.name.value}".`,
            {
              nodes: node
            }
          )
        );
      }
    }
  };
}
function getIntrospectionQuery(options) {
  const optionsWithDefault = {
    descriptions: true,
    specifiedByUrl: false,
    directiveIsRepeatable: false,
    schemaDescription: false,
    inputValueDeprecation: false,
    ...options
  };
  const descriptions = optionsWithDefault.descriptions ? "description" : "";
  const specifiedByUrl = optionsWithDefault.specifiedByUrl ? "specifiedByURL" : "";
  const directiveIsRepeatable = optionsWithDefault.directiveIsRepeatable ? "isRepeatable" : "";
  const schemaDescription = optionsWithDefault.schemaDescription ? descriptions : "";
  function inputDeprecation(str) {
    return optionsWithDefault.inputValueDeprecation ? str : "";
  }
  return `
    query IntrospectionQuery {
      __schema {
        ${schemaDescription}
        queryType { name }
        mutationType { name }
        subscriptionType { name }
        types {
          ...FullType
        }
        directives {
          name
          ${descriptions}
          ${directiveIsRepeatable}
          locations
          args${inputDeprecation("(includeDeprecated: true)")} {
            ...InputValue
          }
        }
      }
    }

    fragment FullType on __Type {
      kind
      name
      ${descriptions}
      ${specifiedByUrl}
      fields(includeDeprecated: true) {
        name
        ${descriptions}
        args${inputDeprecation("(includeDeprecated: true)")} {
          ...InputValue
        }
        type {
          ...TypeRef
        }
        isDeprecated
        deprecationReason
      }
      inputFields${inputDeprecation("(includeDeprecated: true)")} {
        ...InputValue
      }
      interfaces {
        ...TypeRef
      }
      enumValues(includeDeprecated: true) {
        name
        ${descriptions}
        isDeprecated
        deprecationReason
      }
      possibleTypes {
        ...TypeRef
      }
    }

    fragment InputValue on __InputValue {
      name
      ${descriptions}
      type { ...TypeRef }
      defaultValue
      ${inputDeprecation("isDeprecated")}
      ${inputDeprecation("deprecationReason")}
    }

    fragment TypeRef on __Type {
      kind
      name
      ofType {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
                ofType {
                  kind
                  name
                  ofType {
                    kind
                    name
                  }
                }
              }
            }
          }
        }
      }
    }
  `;
}
function getOperationAST(documentAST, operationName) {
  let operation = null;
  for (const definition of documentAST.definitions) {
    if (definition.kind === Kind.OPERATION_DEFINITION) {
      var _definition$name;
      if (operationName == null) {
        if (operation) {
          return null;
        }
        operation = definition;
      } else if (((_definition$name = definition.name) === null || _definition$name === void 0 ? void 0 : _definition$name.value) === operationName) {
        return definition;
      }
    }
  }
  return operation;
}
function getOperationRootType(schema, operation) {
  if (operation.operation === "query") {
    const queryType = schema.getQueryType();
    if (!queryType) {
      throw new GraphQLError(
        "Schema does not define the required query root type.",
        {
          nodes: operation
        }
      );
    }
    return queryType;
  }
  if (operation.operation === "mutation") {
    const mutationType = schema.getMutationType();
    if (!mutationType) {
      throw new GraphQLError("Schema is not configured for mutations.", {
        nodes: operation
      });
    }
    return mutationType;
  }
  if (operation.operation === "subscription") {
    const subscriptionType = schema.getSubscriptionType();
    if (!subscriptionType) {
      throw new GraphQLError("Schema is not configured for subscriptions.", {
        nodes: operation
      });
    }
    return subscriptionType;
  }
  throw new GraphQLError(
    "Can only have query, mutation and subscription operations.",
    {
      nodes: operation
    }
  );
}
function introspectionFromSchema(schema, options) {
  const optionsWithDefaults = {
    specifiedByUrl: true,
    directiveIsRepeatable: true,
    schemaDescription: true,
    inputValueDeprecation: true,
    ...options
  };
  const document2 = parse$1(getIntrospectionQuery(optionsWithDefaults));
  const result = executeSync({
    schema,
    document: document2
  });
  !result.errors && result.data || invariant(false);
  return result.data;
}
function buildClientSchema(introspection, options) {
  isObjectLike(introspection) && isObjectLike(introspection.__schema) || devAssert(
    false,
    `Invalid or incomplete introspection result. Ensure that you are passing "data" property of introspection response and no "errors" was returned alongside: ${inspect(
      introspection
    )}.`
  );
  const schemaIntrospection = introspection.__schema;
  const typeMap = keyValMap(
    schemaIntrospection.types,
    (typeIntrospection) => typeIntrospection.name,
    (typeIntrospection) => buildType(typeIntrospection)
  );
  for (const stdType of [...specifiedScalarTypes, ...introspectionTypes]) {
    if (typeMap[stdType.name]) {
      typeMap[stdType.name] = stdType;
    }
  }
  const queryType = schemaIntrospection.queryType ? getObjectType(schemaIntrospection.queryType) : null;
  const mutationType = schemaIntrospection.mutationType ? getObjectType(schemaIntrospection.mutationType) : null;
  const subscriptionType = schemaIntrospection.subscriptionType ? getObjectType(schemaIntrospection.subscriptionType) : null;
  const directives = schemaIntrospection.directives ? schemaIntrospection.directives.map(buildDirective) : [];
  return new GraphQLSchema({
    description: schemaIntrospection.description,
    query: queryType,
    mutation: mutationType,
    subscription: subscriptionType,
    types: Object.values(typeMap),
    directives,
    assumeValid: options === null || options === void 0 ? void 0 : options.assumeValid
  });
  function getType(typeRef) {
    if (typeRef.kind === TypeKind.LIST) {
      const itemRef = typeRef.ofType;
      if (!itemRef) {
        throw new Error("Decorated type deeper than introspection query.");
      }
      return new GraphQLList(getType(itemRef));
    }
    if (typeRef.kind === TypeKind.NON_NULL) {
      const nullableRef = typeRef.ofType;
      if (!nullableRef) {
        throw new Error("Decorated type deeper than introspection query.");
      }
      const nullableType = getType(nullableRef);
      return new GraphQLNonNull(assertNullableType(nullableType));
    }
    return getNamedType2(typeRef);
  }
  function getNamedType2(typeRef) {
    const typeName = typeRef.name;
    if (!typeName) {
      throw new Error(`Unknown type reference: ${inspect(typeRef)}.`);
    }
    const type = typeMap[typeName];
    if (!type) {
      throw new Error(
        `Invalid or incomplete schema, unknown type: ${typeName}. Ensure that a full introspection query is used in order to build a client schema.`
      );
    }
    return type;
  }
  function getObjectType(typeRef) {
    return assertObjectType(getNamedType2(typeRef));
  }
  function getInterfaceType(typeRef) {
    return assertInterfaceType(getNamedType2(typeRef));
  }
  function buildType(type) {
    if (type != null && type.name != null && type.kind != null) {
      switch (type.kind) {
        case TypeKind.SCALAR:
          return buildScalarDef(type);
        case TypeKind.OBJECT:
          return buildObjectDef(type);
        case TypeKind.INTERFACE:
          return buildInterfaceDef(type);
        case TypeKind.UNION:
          return buildUnionDef(type);
        case TypeKind.ENUM:
          return buildEnumDef(type);
        case TypeKind.INPUT_OBJECT:
          return buildInputObjectDef(type);
      }
    }
    const typeStr = inspect(type);
    throw new Error(
      `Invalid or incomplete introspection result. Ensure that a full introspection query is used in order to build a client schema: ${typeStr}.`
    );
  }
  function buildScalarDef(scalarIntrospection) {
    return new GraphQLScalarType({
      name: scalarIntrospection.name,
      description: scalarIntrospection.description,
      specifiedByURL: scalarIntrospection.specifiedByURL
    });
  }
  function buildImplementationsList(implementingIntrospection) {
    if (implementingIntrospection.interfaces === null && implementingIntrospection.kind === TypeKind.INTERFACE) {
      return [];
    }
    if (!implementingIntrospection.interfaces) {
      const implementingIntrospectionStr = inspect(implementingIntrospection);
      throw new Error(
        `Introspection result missing interfaces: ${implementingIntrospectionStr}.`
      );
    }
    return implementingIntrospection.interfaces.map(getInterfaceType);
  }
  function buildObjectDef(objectIntrospection) {
    return new GraphQLObjectType({
      name: objectIntrospection.name,
      description: objectIntrospection.description,
      interfaces: () => buildImplementationsList(objectIntrospection),
      fields: () => buildFieldDefMap(objectIntrospection)
    });
  }
  function buildInterfaceDef(interfaceIntrospection) {
    return new GraphQLInterfaceType({
      name: interfaceIntrospection.name,
      description: interfaceIntrospection.description,
      interfaces: () => buildImplementationsList(interfaceIntrospection),
      fields: () => buildFieldDefMap(interfaceIntrospection)
    });
  }
  function buildUnionDef(unionIntrospection) {
    if (!unionIntrospection.possibleTypes) {
      const unionIntrospectionStr = inspect(unionIntrospection);
      throw new Error(
        `Introspection result missing possibleTypes: ${unionIntrospectionStr}.`
      );
    }
    return new GraphQLUnionType({
      name: unionIntrospection.name,
      description: unionIntrospection.description,
      types: () => unionIntrospection.possibleTypes.map(getObjectType)
    });
  }
  function buildEnumDef(enumIntrospection) {
    if (!enumIntrospection.enumValues) {
      const enumIntrospectionStr = inspect(enumIntrospection);
      throw new Error(
        `Introspection result missing enumValues: ${enumIntrospectionStr}.`
      );
    }
    return new GraphQLEnumType({
      name: enumIntrospection.name,
      description: enumIntrospection.description,
      values: keyValMap(
        enumIntrospection.enumValues,
        (valueIntrospection) => valueIntrospection.name,
        (valueIntrospection) => ({
          description: valueIntrospection.description,
          deprecationReason: valueIntrospection.deprecationReason
        })
      )
    });
  }
  function buildInputObjectDef(inputObjectIntrospection) {
    if (!inputObjectIntrospection.inputFields) {
      const inputObjectIntrospectionStr = inspect(inputObjectIntrospection);
      throw new Error(
        `Introspection result missing inputFields: ${inputObjectIntrospectionStr}.`
      );
    }
    return new GraphQLInputObjectType({
      name: inputObjectIntrospection.name,
      description: inputObjectIntrospection.description,
      fields: () => buildInputValueDefMap(inputObjectIntrospection.inputFields)
    });
  }
  function buildFieldDefMap(typeIntrospection) {
    if (!typeIntrospection.fields) {
      throw new Error(
        `Introspection result missing fields: ${inspect(typeIntrospection)}.`
      );
    }
    return keyValMap(
      typeIntrospection.fields,
      (fieldIntrospection) => fieldIntrospection.name,
      buildField
    );
  }
  function buildField(fieldIntrospection) {
    const type = getType(fieldIntrospection.type);
    if (!isOutputType(type)) {
      const typeStr = inspect(type);
      throw new Error(
        `Introspection must provide output type for fields, but received: ${typeStr}.`
      );
    }
    if (!fieldIntrospection.args) {
      const fieldIntrospectionStr = inspect(fieldIntrospection);
      throw new Error(
        `Introspection result missing field args: ${fieldIntrospectionStr}.`
      );
    }
    return {
      description: fieldIntrospection.description,
      deprecationReason: fieldIntrospection.deprecationReason,
      type,
      args: buildInputValueDefMap(fieldIntrospection.args)
    };
  }
  function buildInputValueDefMap(inputValueIntrospections) {
    return keyValMap(
      inputValueIntrospections,
      (inputValue) => inputValue.name,
      buildInputValue
    );
  }
  function buildInputValue(inputValueIntrospection) {
    const type = getType(inputValueIntrospection.type);
    if (!isInputType(type)) {
      const typeStr = inspect(type);
      throw new Error(
        `Introspection must provide input type for arguments, but received: ${typeStr}.`
      );
    }
    const defaultValue = inputValueIntrospection.defaultValue != null ? valueFromAST(parseValue(inputValueIntrospection.defaultValue), type) : void 0;
    return {
      description: inputValueIntrospection.description,
      type,
      defaultValue,
      deprecationReason: inputValueIntrospection.deprecationReason
    };
  }
  function buildDirective(directiveIntrospection) {
    if (!directiveIntrospection.args) {
      const directiveIntrospectionStr = inspect(directiveIntrospection);
      throw new Error(
        `Introspection result missing directive args: ${directiveIntrospectionStr}.`
      );
    }
    if (!directiveIntrospection.locations) {
      const directiveIntrospectionStr = inspect(directiveIntrospection);
      throw new Error(
        `Introspection result missing directive locations: ${directiveIntrospectionStr}.`
      );
    }
    return new GraphQLDirective({
      name: directiveIntrospection.name,
      description: directiveIntrospection.description,
      isRepeatable: directiveIntrospection.isRepeatable,
      locations: directiveIntrospection.locations.slice(),
      args: buildInputValueDefMap(directiveIntrospection.args)
    });
  }
}
function extendSchema(schema, documentAST, options) {
  assertSchema(schema);
  documentAST != null && documentAST.kind === Kind.DOCUMENT || devAssert(false, "Must provide valid Document AST.");
  if ((options === null || options === void 0 ? void 0 : options.assumeValid) !== true && (options === null || options === void 0 ? void 0 : options.assumeValidSDL) !== true) {
    assertValidSDLExtension(documentAST, schema);
  }
  const schemaConfig = schema.toConfig();
  const extendedConfig = extendSchemaImpl(schemaConfig, documentAST, options);
  return schemaConfig === extendedConfig ? schema : new GraphQLSchema(extendedConfig);
}
function extendSchemaImpl(schemaConfig, documentAST, options) {
  var _schemaDef, _schemaDef$descriptio, _schemaDef2, _options$assumeValid;
  const typeDefs = [];
  const typeExtensionsMap = /* @__PURE__ */ Object.create(null);
  const directiveDefs = [];
  let schemaDef;
  const schemaExtensions = [];
  for (const def of documentAST.definitions) {
    if (def.kind === Kind.SCHEMA_DEFINITION) {
      schemaDef = def;
    } else if (def.kind === Kind.SCHEMA_EXTENSION) {
      schemaExtensions.push(def);
    } else if (isTypeDefinitionNode(def)) {
      typeDefs.push(def);
    } else if (isTypeExtensionNode(def)) {
      const extendedTypeName = def.name.value;
      const existingTypeExtensions = typeExtensionsMap[extendedTypeName];
      typeExtensionsMap[extendedTypeName] = existingTypeExtensions ? existingTypeExtensions.concat([def]) : [def];
    } else if (def.kind === Kind.DIRECTIVE_DEFINITION) {
      directiveDefs.push(def);
    }
  }
  if (Object.keys(typeExtensionsMap).length === 0 && typeDefs.length === 0 && directiveDefs.length === 0 && schemaExtensions.length === 0 && schemaDef == null) {
    return schemaConfig;
  }
  const typeMap = /* @__PURE__ */ Object.create(null);
  for (const existingType of schemaConfig.types) {
    typeMap[existingType.name] = extendNamedType(existingType);
  }
  for (const typeNode of typeDefs) {
    var _stdTypeMap$name;
    const name = typeNode.name.value;
    typeMap[name] = (_stdTypeMap$name = stdTypeMap[name]) !== null && _stdTypeMap$name !== void 0 ? _stdTypeMap$name : buildType(typeNode);
  }
  const operationTypes = {
    query: schemaConfig.query && replaceNamedType(schemaConfig.query),
    mutation: schemaConfig.mutation && replaceNamedType(schemaConfig.mutation),
    subscription: schemaConfig.subscription && replaceNamedType(schemaConfig.subscription),
    ...schemaDef && getOperationTypes([schemaDef]),
    ...getOperationTypes(schemaExtensions)
  };
  return {
    description: (_schemaDef = schemaDef) === null || _schemaDef === void 0 ? void 0 : (_schemaDef$descriptio = _schemaDef.description) === null || _schemaDef$descriptio === void 0 ? void 0 : _schemaDef$descriptio.value,
    ...operationTypes,
    types: Object.values(typeMap),
    directives: [
      ...schemaConfig.directives.map(replaceDirective),
      ...directiveDefs.map(buildDirective)
    ],
    extensions: /* @__PURE__ */ Object.create(null),
    astNode: (_schemaDef2 = schemaDef) !== null && _schemaDef2 !== void 0 ? _schemaDef2 : schemaConfig.astNode,
    extensionASTNodes: schemaConfig.extensionASTNodes.concat(schemaExtensions),
    assumeValid: (_options$assumeValid = options === null || options === void 0 ? void 0 : options.assumeValid) !== null && _options$assumeValid !== void 0 ? _options$assumeValid : false
  };
  function replaceType(type) {
    if (isListType(type)) {
      return new GraphQLList(replaceType(type.ofType));
    }
    if (isNonNullType(type)) {
      return new GraphQLNonNull(replaceType(type.ofType));
    }
    return replaceNamedType(type);
  }
  function replaceNamedType(type) {
    return typeMap[type.name];
  }
  function replaceDirective(directive) {
    const config = directive.toConfig();
    return new GraphQLDirective({
      ...config,
      args: mapValue(config.args, extendArg)
    });
  }
  function extendNamedType(type) {
    if (isIntrospectionType(type) || isSpecifiedScalarType(type)) {
      return type;
    }
    if (isScalarType(type)) {
      return extendScalarType(type);
    }
    if (isObjectType(type)) {
      return extendObjectType(type);
    }
    if (isInterfaceType(type)) {
      return extendInterfaceType(type);
    }
    if (isUnionType(type)) {
      return extendUnionType(type);
    }
    if (isEnumType(type)) {
      return extendEnumType(type);
    }
    if (isInputObjectType(type)) {
      return extendInputObjectType(type);
    }
    invariant(false, "Unexpected type: " + inspect(type));
  }
  function extendInputObjectType(type) {
    var _typeExtensionsMap$co;
    const config = type.toConfig();
    const extensions2 = (_typeExtensionsMap$co = typeExtensionsMap[config.name]) !== null && _typeExtensionsMap$co !== void 0 ? _typeExtensionsMap$co : [];
    return new GraphQLInputObjectType({
      ...config,
      fields: () => ({
        ...mapValue(config.fields, (field2) => ({
          ...field2,
          type: replaceType(field2.type)
        })),
        ...buildInputFieldMap(extensions2)
      }),
      extensionASTNodes: config.extensionASTNodes.concat(extensions2)
    });
  }
  function extendEnumType(type) {
    var _typeExtensionsMap$ty;
    const config = type.toConfig();
    const extensions2 = (_typeExtensionsMap$ty = typeExtensionsMap[type.name]) !== null && _typeExtensionsMap$ty !== void 0 ? _typeExtensionsMap$ty : [];
    return new GraphQLEnumType({
      ...config,
      values: { ...config.values, ...buildEnumValueMap(extensions2) },
      extensionASTNodes: config.extensionASTNodes.concat(extensions2)
    });
  }
  function extendScalarType(type) {
    var _typeExtensionsMap$co2;
    const config = type.toConfig();
    const extensions2 = (_typeExtensionsMap$co2 = typeExtensionsMap[config.name]) !== null && _typeExtensionsMap$co2 !== void 0 ? _typeExtensionsMap$co2 : [];
    let specifiedByURL = config.specifiedByURL;
    for (const extensionNode of extensions2) {
      var _getSpecifiedByURL;
      specifiedByURL = (_getSpecifiedByURL = getSpecifiedByURL(extensionNode)) !== null && _getSpecifiedByURL !== void 0 ? _getSpecifiedByURL : specifiedByURL;
    }
    return new GraphQLScalarType({
      ...config,
      specifiedByURL,
      extensionASTNodes: config.extensionASTNodes.concat(extensions2)
    });
  }
  function extendObjectType(type) {
    var _typeExtensionsMap$co3;
    const config = type.toConfig();
    const extensions2 = (_typeExtensionsMap$co3 = typeExtensionsMap[config.name]) !== null && _typeExtensionsMap$co3 !== void 0 ? _typeExtensionsMap$co3 : [];
    return new GraphQLObjectType({
      ...config,
      interfaces: () => [
        ...type.getInterfaces().map(replaceNamedType),
        ...buildInterfaces(extensions2)
      ],
      fields: () => ({
        ...mapValue(config.fields, extendField),
        ...buildFieldMap(extensions2)
      }),
      extensionASTNodes: config.extensionASTNodes.concat(extensions2)
    });
  }
  function extendInterfaceType(type) {
    var _typeExtensionsMap$co4;
    const config = type.toConfig();
    const extensions2 = (_typeExtensionsMap$co4 = typeExtensionsMap[config.name]) !== null && _typeExtensionsMap$co4 !== void 0 ? _typeExtensionsMap$co4 : [];
    return new GraphQLInterfaceType({
      ...config,
      interfaces: () => [
        ...type.getInterfaces().map(replaceNamedType),
        ...buildInterfaces(extensions2)
      ],
      fields: () => ({
        ...mapValue(config.fields, extendField),
        ...buildFieldMap(extensions2)
      }),
      extensionASTNodes: config.extensionASTNodes.concat(extensions2)
    });
  }
  function extendUnionType(type) {
    var _typeExtensionsMap$co5;
    const config = type.toConfig();
    const extensions2 = (_typeExtensionsMap$co5 = typeExtensionsMap[config.name]) !== null && _typeExtensionsMap$co5 !== void 0 ? _typeExtensionsMap$co5 : [];
    return new GraphQLUnionType({
      ...config,
      types: () => [
        ...type.getTypes().map(replaceNamedType),
        ...buildUnionTypes(extensions2)
      ],
      extensionASTNodes: config.extensionASTNodes.concat(extensions2)
    });
  }
  function extendField(field2) {
    return {
      ...field2,
      type: replaceType(field2.type),
      args: field2.args && mapValue(field2.args, extendArg)
    };
  }
  function extendArg(arg) {
    return { ...arg, type: replaceType(arg.type) };
  }
  function getOperationTypes(nodes) {
    const opTypes = {};
    for (const node of nodes) {
      var _node$operationTypes;
      const operationTypesNodes = (_node$operationTypes = node.operationTypes) !== null && _node$operationTypes !== void 0 ? _node$operationTypes : [];
      for (const operationType of operationTypesNodes) {
        opTypes[operationType.operation] = getNamedType2(operationType.type);
      }
    }
    return opTypes;
  }
  function getNamedType2(node) {
    var _stdTypeMap$name2;
    const name = node.name.value;
    const type = (_stdTypeMap$name2 = stdTypeMap[name]) !== null && _stdTypeMap$name2 !== void 0 ? _stdTypeMap$name2 : typeMap[name];
    if (type === void 0) {
      throw new Error(`Unknown type: "${name}".`);
    }
    return type;
  }
  function getWrappedType(node) {
    if (node.kind === Kind.LIST_TYPE) {
      return new GraphQLList(getWrappedType(node.type));
    }
    if (node.kind === Kind.NON_NULL_TYPE) {
      return new GraphQLNonNull(getWrappedType(node.type));
    }
    return getNamedType2(node);
  }
  function buildDirective(node) {
    var _node$description;
    return new GraphQLDirective({
      name: node.name.value,
      description: (_node$description = node.description) === null || _node$description === void 0 ? void 0 : _node$description.value,
      locations: node.locations.map(({ value }) => value),
      isRepeatable: node.repeatable,
      args: buildArgumentMap(node.arguments),
      astNode: node
    });
  }
  function buildFieldMap(nodes) {
    const fieldConfigMap = /* @__PURE__ */ Object.create(null);
    for (const node of nodes) {
      var _node$fields;
      const nodeFields = (_node$fields = node.fields) !== null && _node$fields !== void 0 ? _node$fields : [];
      for (const field2 of nodeFields) {
        var _field$description;
        fieldConfigMap[field2.name.value] = {
          type: getWrappedType(field2.type),
          description: (_field$description = field2.description) === null || _field$description === void 0 ? void 0 : _field$description.value,
          args: buildArgumentMap(field2.arguments),
          deprecationReason: getDeprecationReason(field2),
          astNode: field2
        };
      }
    }
    return fieldConfigMap;
  }
  function buildArgumentMap(args) {
    const argsNodes = args !== null && args !== void 0 ? args : [];
    const argConfigMap = /* @__PURE__ */ Object.create(null);
    for (const arg of argsNodes) {
      var _arg$description;
      const type = getWrappedType(arg.type);
      argConfigMap[arg.name.value] = {
        type,
        description: (_arg$description = arg.description) === null || _arg$description === void 0 ? void 0 : _arg$description.value,
        defaultValue: valueFromAST(arg.defaultValue, type),
        deprecationReason: getDeprecationReason(arg),
        astNode: arg
      };
    }
    return argConfigMap;
  }
  function buildInputFieldMap(nodes) {
    const inputFieldMap = /* @__PURE__ */ Object.create(null);
    for (const node of nodes) {
      var _node$fields2;
      const fieldsNodes = (_node$fields2 = node.fields) !== null && _node$fields2 !== void 0 ? _node$fields2 : [];
      for (const field2 of fieldsNodes) {
        var _field$description2;
        const type = getWrappedType(field2.type);
        inputFieldMap[field2.name.value] = {
          type,
          description: (_field$description2 = field2.description) === null || _field$description2 === void 0 ? void 0 : _field$description2.value,
          defaultValue: valueFromAST(field2.defaultValue, type),
          deprecationReason: getDeprecationReason(field2),
          astNode: field2
        };
      }
    }
    return inputFieldMap;
  }
  function buildEnumValueMap(nodes) {
    const enumValueMap = /* @__PURE__ */ Object.create(null);
    for (const node of nodes) {
      var _node$values;
      const valuesNodes = (_node$values = node.values) !== null && _node$values !== void 0 ? _node$values : [];
      for (const value of valuesNodes) {
        var _value$description;
        enumValueMap[value.name.value] = {
          description: (_value$description = value.description) === null || _value$description === void 0 ? void 0 : _value$description.value,
          deprecationReason: getDeprecationReason(value),
          astNode: value
        };
      }
    }
    return enumValueMap;
  }
  function buildInterfaces(nodes) {
    return nodes.flatMap(
      (node) => {
        var _node$interfaces$map, _node$interfaces;
        return (_node$interfaces$map = (_node$interfaces = node.interfaces) === null || _node$interfaces === void 0 ? void 0 : _node$interfaces.map(getNamedType2)) !== null && _node$interfaces$map !== void 0 ? _node$interfaces$map : [];
      }
    );
  }
  function buildUnionTypes(nodes) {
    return nodes.flatMap(
      (node) => {
        var _node$types$map, _node$types;
        return (_node$types$map = (_node$types = node.types) === null || _node$types === void 0 ? void 0 : _node$types.map(getNamedType2)) !== null && _node$types$map !== void 0 ? _node$types$map : [];
      }
    );
  }
  function buildType(astNode) {
    var _typeExtensionsMap$na;
    const name = astNode.name.value;
    const extensionASTNodes = (_typeExtensionsMap$na = typeExtensionsMap[name]) !== null && _typeExtensionsMap$na !== void 0 ? _typeExtensionsMap$na : [];
    switch (astNode.kind) {
      case Kind.OBJECT_TYPE_DEFINITION: {
        var _astNode$description;
        const allNodes = [astNode, ...extensionASTNodes];
        return new GraphQLObjectType({
          name,
          description: (_astNode$description = astNode.description) === null || _astNode$description === void 0 ? void 0 : _astNode$description.value,
          interfaces: () => buildInterfaces(allNodes),
          fields: () => buildFieldMap(allNodes),
          astNode,
          extensionASTNodes
        });
      }
      case Kind.INTERFACE_TYPE_DEFINITION: {
        var _astNode$description2;
        const allNodes = [astNode, ...extensionASTNodes];
        return new GraphQLInterfaceType({
          name,
          description: (_astNode$description2 = astNode.description) === null || _astNode$description2 === void 0 ? void 0 : _astNode$description2.value,
          interfaces: () => buildInterfaces(allNodes),
          fields: () => buildFieldMap(allNodes),
          astNode,
          extensionASTNodes
        });
      }
      case Kind.ENUM_TYPE_DEFINITION: {
        var _astNode$description3;
        const allNodes = [astNode, ...extensionASTNodes];
        return new GraphQLEnumType({
          name,
          description: (_astNode$description3 = astNode.description) === null || _astNode$description3 === void 0 ? void 0 : _astNode$description3.value,
          values: buildEnumValueMap(allNodes),
          astNode,
          extensionASTNodes
        });
      }
      case Kind.UNION_TYPE_DEFINITION: {
        var _astNode$description4;
        const allNodes = [astNode, ...extensionASTNodes];
        return new GraphQLUnionType({
          name,
          description: (_astNode$description4 = astNode.description) === null || _astNode$description4 === void 0 ? void 0 : _astNode$description4.value,
          types: () => buildUnionTypes(allNodes),
          astNode,
          extensionASTNodes
        });
      }
      case Kind.SCALAR_TYPE_DEFINITION: {
        var _astNode$description5;
        return new GraphQLScalarType({
          name,
          description: (_astNode$description5 = astNode.description) === null || _astNode$description5 === void 0 ? void 0 : _astNode$description5.value,
          specifiedByURL: getSpecifiedByURL(astNode),
          astNode,
          extensionASTNodes
        });
      }
      case Kind.INPUT_OBJECT_TYPE_DEFINITION: {
        var _astNode$description6;
        const allNodes = [astNode, ...extensionASTNodes];
        return new GraphQLInputObjectType({
          name,
          description: (_astNode$description6 = astNode.description) === null || _astNode$description6 === void 0 ? void 0 : _astNode$description6.value,
          fields: () => buildInputFieldMap(allNodes),
          astNode,
          extensionASTNodes
        });
      }
    }
  }
}
const stdTypeMap = keyMap(
  [...specifiedScalarTypes, ...introspectionTypes],
  (type) => type.name
);
function getDeprecationReason(node) {
  const deprecated = getDirectiveValues(GraphQLDeprecatedDirective, node);
  return deprecated === null || deprecated === void 0 ? void 0 : deprecated.reason;
}
function getSpecifiedByURL(node) {
  const specifiedBy = getDirectiveValues(GraphQLSpecifiedByDirective, node);
  return specifiedBy === null || specifiedBy === void 0 ? void 0 : specifiedBy.url;
}
function buildASTSchema(documentAST, options) {
  documentAST != null && documentAST.kind === Kind.DOCUMENT || devAssert(false, "Must provide valid Document AST.");
  if ((options === null || options === void 0 ? void 0 : options.assumeValid) !== true && (options === null || options === void 0 ? void 0 : options.assumeValidSDL) !== true) {
    assertValidSDL(documentAST);
  }
  const emptySchemaConfig = {
    description: void 0,
    types: [],
    directives: [],
    extensions: /* @__PURE__ */ Object.create(null),
    extensionASTNodes: [],
    assumeValid: false
  };
  const config = extendSchemaImpl(emptySchemaConfig, documentAST, options);
  if (config.astNode == null) {
    for (const type of config.types) {
      switch (type.name) {
        case "Query":
          config.query = type;
          break;
        case "Mutation":
          config.mutation = type;
          break;
        case "Subscription":
          config.subscription = type;
          break;
      }
    }
  }
  const directives = [
    ...config.directives,
    ...specifiedDirectives.filter(
      (stdDirective) => config.directives.every(
        (directive) => directive.name !== stdDirective.name
      )
    )
  ];
  return new GraphQLSchema({ ...config, directives });
}
function buildSchema(source, options) {
  const document2 = parse$1(source, {
    noLocation: options === null || options === void 0 ? void 0 : options.noLocation,
    allowLegacyFragmentVariables: options === null || options === void 0 ? void 0 : options.allowLegacyFragmentVariables
  });
  return buildASTSchema(document2, {
    assumeValidSDL: options === null || options === void 0 ? void 0 : options.assumeValidSDL,
    assumeValid: options === null || options === void 0 ? void 0 : options.assumeValid
  });
}
function lexicographicSortSchema(schema) {
  const schemaConfig = schema.toConfig();
  const typeMap = keyValMap(
    sortByName(schemaConfig.types),
    (type) => type.name,
    sortNamedType
  );
  return new GraphQLSchema({
    ...schemaConfig,
    types: Object.values(typeMap),
    directives: sortByName(schemaConfig.directives).map(sortDirective),
    query: replaceMaybeType(schemaConfig.query),
    mutation: replaceMaybeType(schemaConfig.mutation),
    subscription: replaceMaybeType(schemaConfig.subscription)
  });
  function replaceType(type) {
    if (isListType(type)) {
      return new GraphQLList(replaceType(type.ofType));
    } else if (isNonNullType(type)) {
      return new GraphQLNonNull(replaceType(type.ofType));
    }
    return replaceNamedType(type);
  }
  function replaceNamedType(type) {
    return typeMap[type.name];
  }
  function replaceMaybeType(maybeType) {
    return maybeType && replaceNamedType(maybeType);
  }
  function sortDirective(directive) {
    const config = directive.toConfig();
    return new GraphQLDirective({
      ...config,
      locations: sortBy(config.locations, (x) => x),
      args: sortArgs(config.args)
    });
  }
  function sortArgs(args) {
    return sortObjMap(args, (arg) => ({ ...arg, type: replaceType(arg.type) }));
  }
  function sortFields2(fieldsMap) {
    return sortObjMap(fieldsMap, (field2) => ({
      ...field2,
      type: replaceType(field2.type),
      args: field2.args && sortArgs(field2.args)
    }));
  }
  function sortInputFields(fieldsMap) {
    return sortObjMap(fieldsMap, (field2) => ({
      ...field2,
      type: replaceType(field2.type)
    }));
  }
  function sortTypes(array) {
    return sortByName(array).map(replaceNamedType);
  }
  function sortNamedType(type) {
    if (isScalarType(type) || isIntrospectionType(type)) {
      return type;
    }
    if (isObjectType(type)) {
      const config = type.toConfig();
      return new GraphQLObjectType({
        ...config,
        interfaces: () => sortTypes(config.interfaces),
        fields: () => sortFields2(config.fields)
      });
    }
    if (isInterfaceType(type)) {
      const config = type.toConfig();
      return new GraphQLInterfaceType({
        ...config,
        interfaces: () => sortTypes(config.interfaces),
        fields: () => sortFields2(config.fields)
      });
    }
    if (isUnionType(type)) {
      const config = type.toConfig();
      return new GraphQLUnionType({
        ...config,
        types: () => sortTypes(config.types)
      });
    }
    if (isEnumType(type)) {
      const config = type.toConfig();
      return new GraphQLEnumType({
        ...config,
        values: sortObjMap(config.values, (value) => value)
      });
    }
    if (isInputObjectType(type)) {
      const config = type.toConfig();
      return new GraphQLInputObjectType({
        ...config,
        fields: () => sortInputFields(config.fields)
      });
    }
    invariant(false, "Unexpected type: " + inspect(type));
  }
}
function sortObjMap(map, sortValueFn) {
  const sortedMap = /* @__PURE__ */ Object.create(null);
  for (const key of Object.keys(map).sort(naturalCompare)) {
    sortedMap[key] = sortValueFn(map[key]);
  }
  return sortedMap;
}
function sortByName(array) {
  return sortBy(array, (obj) => obj.name);
}
function sortBy(array, mapToKey) {
  return array.slice().sort((obj1, obj2) => {
    const key1 = mapToKey(obj1);
    const key2 = mapToKey(obj2);
    return naturalCompare(key1, key2);
  });
}
function printSchema(schema) {
  return printFilteredSchema(
    schema,
    (n) => !isSpecifiedDirective(n),
    isDefinedType
  );
}
function printIntrospectionSchema(schema) {
  return printFilteredSchema(schema, isSpecifiedDirective, isIntrospectionType);
}
function isDefinedType(type) {
  return !isSpecifiedScalarType(type) && !isIntrospectionType(type);
}
function printFilteredSchema(schema, directiveFilter, typeFilter) {
  const directives = schema.getDirectives().filter(directiveFilter);
  const types2 = Object.values(schema.getTypeMap()).filter(typeFilter);
  return [
    printSchemaDefinition(schema),
    ...directives.map((directive) => printDirective(directive)),
    ...types2.map((type) => printType(type))
  ].filter(Boolean).join("\n\n");
}
function printSchemaDefinition(schema) {
  if (schema.description == null && isSchemaOfCommonNames(schema)) {
    return;
  }
  const operationTypes = [];
  const queryType = schema.getQueryType();
  if (queryType) {
    operationTypes.push(`  query: ${queryType.name}`);
  }
  const mutationType = schema.getMutationType();
  if (mutationType) {
    operationTypes.push(`  mutation: ${mutationType.name}`);
  }
  const subscriptionType = schema.getSubscriptionType();
  if (subscriptionType) {
    operationTypes.push(`  subscription: ${subscriptionType.name}`);
  }
  return printDescription(schema) + `schema {
${operationTypes.join("\n")}
}`;
}
function isSchemaOfCommonNames(schema) {
  const queryType = schema.getQueryType();
  if (queryType && queryType.name !== "Query") {
    return false;
  }
  const mutationType = schema.getMutationType();
  if (mutationType && mutationType.name !== "Mutation") {
    return false;
  }
  const subscriptionType = schema.getSubscriptionType();
  if (subscriptionType && subscriptionType.name !== "Subscription") {
    return false;
  }
  return true;
}
function printType(type) {
  if (isScalarType(type)) {
    return printScalar(type);
  }
  if (isObjectType(type)) {
    return printObject(type);
  }
  if (isInterfaceType(type)) {
    return printInterface(type);
  }
  if (isUnionType(type)) {
    return printUnion(type);
  }
  if (isEnumType(type)) {
    return printEnum(type);
  }
  if (isInputObjectType(type)) {
    return printInputObject(type);
  }
  invariant(false, "Unexpected type: " + inspect(type));
}
function printScalar(type) {
  return printDescription(type) + `scalar ${type.name}` + printSpecifiedByURL(type);
}
function printImplementedInterfaces(type) {
  const interfaces = type.getInterfaces();
  return interfaces.length ? " implements " + interfaces.map((i) => i.name).join(" & ") : "";
}
function printObject(type) {
  return printDescription(type) + `type ${type.name}` + printImplementedInterfaces(type) + printFields(type);
}
function printInterface(type) {
  return printDescription(type) + `interface ${type.name}` + printImplementedInterfaces(type) + printFields(type);
}
function printUnion(type) {
  const types2 = type.getTypes();
  const possibleTypes = types2.length ? " = " + types2.join(" | ") : "";
  return printDescription(type) + "union " + type.name + possibleTypes;
}
function printEnum(type) {
  const values = type.getValues().map(
    (value, i) => printDescription(value, "  ", !i) + "  " + value.name + printDeprecated(value.deprecationReason)
  );
  return printDescription(type) + `enum ${type.name}` + printBlock(values);
}
function printInputObject(type) {
  const fields = Object.values(type.getFields()).map(
    (f, i) => printDescription(f, "  ", !i) + "  " + printInputValue(f)
  );
  return printDescription(type) + `input ${type.name}` + printBlock(fields);
}
function printFields(type) {
  const fields = Object.values(type.getFields()).map(
    (f, i) => printDescription(f, "  ", !i) + "  " + f.name + printArgs(f.args, "  ") + ": " + String(f.type) + printDeprecated(f.deprecationReason)
  );
  return printBlock(fields);
}
function printBlock(items) {
  return items.length !== 0 ? " {\n" + items.join("\n") + "\n}" : "";
}
function printArgs(args, indentation = "") {
  if (args.length === 0) {
    return "";
  }
  if (args.every((arg) => !arg.description)) {
    return "(" + args.map(printInputValue).join(", ") + ")";
  }
  return "(\n" + args.map(
    (arg, i) => printDescription(arg, "  " + indentation, !i) + "  " + indentation + printInputValue(arg)
  ).join("\n") + "\n" + indentation + ")";
}
function printInputValue(arg) {
  const defaultAST = astFromValue(arg.defaultValue, arg.type);
  let argDecl = arg.name + ": " + String(arg.type);
  if (defaultAST) {
    argDecl += ` = ${print(defaultAST)}`;
  }
  return argDecl + printDeprecated(arg.deprecationReason);
}
function printDirective(directive) {
  return printDescription(directive) + "directive @" + directive.name + printArgs(directive.args) + (directive.isRepeatable ? " repeatable" : "") + " on " + directive.locations.join(" | ");
}
function printDeprecated(reason) {
  if (reason == null) {
    return "";
  }
  if (reason !== DEFAULT_DEPRECATION_REASON) {
    const astValue = print({
      kind: Kind.STRING,
      value: reason
    });
    return ` @deprecated(reason: ${astValue})`;
  }
  return " @deprecated";
}
function printSpecifiedByURL(scalar) {
  if (scalar.specifiedByURL == null) {
    return "";
  }
  const astValue = print({
    kind: Kind.STRING,
    value: scalar.specifiedByURL
  });
  return ` @specifiedBy(url: ${astValue})`;
}
function printDescription(def, indentation = "", firstInBlock = true) {
  const { description } = def;
  if (description == null) {
    return "";
  }
  const blockString = print({
    kind: Kind.STRING,
    value: description,
    block: isPrintableAsBlockString(description)
  });
  const prefix = indentation && !firstInBlock ? "\n" + indentation : indentation;
  return prefix + blockString.replace(/\n/g, "\n" + indentation) + "\n";
}
function concatAST(documents) {
  const definitions = [];
  for (const doc of documents) {
    definitions.push(...doc.definitions);
  }
  return {
    kind: Kind.DOCUMENT,
    definitions
  };
}
function separateOperations(documentAST) {
  const operations = [];
  const depGraph = /* @__PURE__ */ Object.create(null);
  for (const definitionNode of documentAST.definitions) {
    switch (definitionNode.kind) {
      case Kind.OPERATION_DEFINITION:
        operations.push(definitionNode);
        break;
      case Kind.FRAGMENT_DEFINITION:
        depGraph[definitionNode.name.value] = collectDependencies(
          definitionNode.selectionSet
        );
        break;
    }
  }
  const separatedDocumentASTs = /* @__PURE__ */ Object.create(null);
  for (const operation of operations) {
    const dependencies = /* @__PURE__ */ new Set();
    for (const fragmentName of collectDependencies(operation.selectionSet)) {
      collectTransitiveDependencies(dependencies, depGraph, fragmentName);
    }
    const operationName = operation.name ? operation.name.value : "";
    separatedDocumentASTs[operationName] = {
      kind: Kind.DOCUMENT,
      definitions: documentAST.definitions.filter(
        (node) => node === operation || node.kind === Kind.FRAGMENT_DEFINITION && dependencies.has(node.name.value)
      )
    };
  }
  return separatedDocumentASTs;
}
function collectTransitiveDependencies(collected, depGraph, fromName) {
  if (!collected.has(fromName)) {
    collected.add(fromName);
    const immediateDeps = depGraph[fromName];
    if (immediateDeps !== void 0) {
      for (const toName of immediateDeps) {
        collectTransitiveDependencies(collected, depGraph, toName);
      }
    }
  }
}
function collectDependencies(selectionSet) {
  const dependencies = [];
  visit(selectionSet, {
    FragmentSpread(node) {
      dependencies.push(node.name.value);
    }
  });
  return dependencies;
}
function stripIgnoredCharacters(source) {
  const sourceObj = isSource(source) ? source : new Source(source);
  const body2 = sourceObj.body;
  const lexer2 = new Lexer(sourceObj);
  let strippedBody = "";
  let wasLastAddedTokenNonPunctuator = false;
  while (lexer2.advance().kind !== TokenKind.EOF) {
    const currentToken = lexer2.token;
    const tokenKind = currentToken.kind;
    const isNonPunctuator = !isPunctuatorTokenKind(currentToken.kind);
    if (wasLastAddedTokenNonPunctuator) {
      if (isNonPunctuator || currentToken.kind === TokenKind.SPREAD) {
        strippedBody += " ";
      }
    }
    const tokenBody = body2.slice(currentToken.start, currentToken.end);
    if (tokenKind === TokenKind.BLOCK_STRING) {
      strippedBody += printBlockString(currentToken.value, {
        minimize: true
      });
    } else {
      strippedBody += tokenBody;
    }
    wasLastAddedTokenNonPunctuator = isNonPunctuator;
  }
  return strippedBody;
}
function assertValidName(name) {
  const error2 = isValidNameError(name);
  if (error2) {
    throw error2;
  }
  return name;
}
function isValidNameError(name) {
  typeof name === "string" || devAssert(false, "Expected name to be a string.");
  if (name.startsWith("__")) {
    return new GraphQLError(
      `Name "${name}" must not begin with "__", which is reserved by GraphQL introspection.`
    );
  }
  try {
    assertName(name);
  } catch (error2) {
    return error2;
  }
}
var BreakingChangeType;
(function(BreakingChangeType2) {
  BreakingChangeType2["TYPE_REMOVED"] = "TYPE_REMOVED";
  BreakingChangeType2["TYPE_CHANGED_KIND"] = "TYPE_CHANGED_KIND";
  BreakingChangeType2["TYPE_REMOVED_FROM_UNION"] = "TYPE_REMOVED_FROM_UNION";
  BreakingChangeType2["VALUE_REMOVED_FROM_ENUM"] = "VALUE_REMOVED_FROM_ENUM";
  BreakingChangeType2["REQUIRED_INPUT_FIELD_ADDED"] = "REQUIRED_INPUT_FIELD_ADDED";
  BreakingChangeType2["IMPLEMENTED_INTERFACE_REMOVED"] = "IMPLEMENTED_INTERFACE_REMOVED";
  BreakingChangeType2["FIELD_REMOVED"] = "FIELD_REMOVED";
  BreakingChangeType2["FIELD_CHANGED_KIND"] = "FIELD_CHANGED_KIND";
  BreakingChangeType2["REQUIRED_ARG_ADDED"] = "REQUIRED_ARG_ADDED";
  BreakingChangeType2["ARG_REMOVED"] = "ARG_REMOVED";
  BreakingChangeType2["ARG_CHANGED_KIND"] = "ARG_CHANGED_KIND";
  BreakingChangeType2["DIRECTIVE_REMOVED"] = "DIRECTIVE_REMOVED";
  BreakingChangeType2["DIRECTIVE_ARG_REMOVED"] = "DIRECTIVE_ARG_REMOVED";
  BreakingChangeType2["REQUIRED_DIRECTIVE_ARG_ADDED"] = "REQUIRED_DIRECTIVE_ARG_ADDED";
  BreakingChangeType2["DIRECTIVE_REPEATABLE_REMOVED"] = "DIRECTIVE_REPEATABLE_REMOVED";
  BreakingChangeType2["DIRECTIVE_LOCATION_REMOVED"] = "DIRECTIVE_LOCATION_REMOVED";
})(BreakingChangeType || (BreakingChangeType = {}));
var DangerousChangeType;
(function(DangerousChangeType2) {
  DangerousChangeType2["VALUE_ADDED_TO_ENUM"] = "VALUE_ADDED_TO_ENUM";
  DangerousChangeType2["TYPE_ADDED_TO_UNION"] = "TYPE_ADDED_TO_UNION";
  DangerousChangeType2["OPTIONAL_INPUT_FIELD_ADDED"] = "OPTIONAL_INPUT_FIELD_ADDED";
  DangerousChangeType2["OPTIONAL_ARG_ADDED"] = "OPTIONAL_ARG_ADDED";
  DangerousChangeType2["IMPLEMENTED_INTERFACE_ADDED"] = "IMPLEMENTED_INTERFACE_ADDED";
  DangerousChangeType2["ARG_DEFAULT_VALUE_CHANGE"] = "ARG_DEFAULT_VALUE_CHANGE";
})(DangerousChangeType || (DangerousChangeType = {}));
function findBreakingChanges(oldSchema, newSchema) {
  return findSchemaChanges(oldSchema, newSchema).filter(
    (change) => change.type in BreakingChangeType
  );
}
function findDangerousChanges(oldSchema, newSchema) {
  return findSchemaChanges(oldSchema, newSchema).filter(
    (change) => change.type in DangerousChangeType
  );
}
function findSchemaChanges(oldSchema, newSchema) {
  return [
    ...findTypeChanges(oldSchema, newSchema),
    ...findDirectiveChanges(oldSchema, newSchema)
  ];
}
function findDirectiveChanges(oldSchema, newSchema) {
  const schemaChanges = [];
  const directivesDiff = diff(
    oldSchema.getDirectives(),
    newSchema.getDirectives()
  );
  for (const oldDirective of directivesDiff.removed) {
    schemaChanges.push({
      type: BreakingChangeType.DIRECTIVE_REMOVED,
      description: `${oldDirective.name} was removed.`
    });
  }
  for (const [oldDirective, newDirective] of directivesDiff.persisted) {
    const argsDiff = diff(oldDirective.args, newDirective.args);
    for (const newArg of argsDiff.added) {
      if (isRequiredArgument(newArg)) {
        schemaChanges.push({
          type: BreakingChangeType.REQUIRED_DIRECTIVE_ARG_ADDED,
          description: `A required arg ${newArg.name} on directive ${oldDirective.name} was added.`
        });
      }
    }
    for (const oldArg of argsDiff.removed) {
      schemaChanges.push({
        type: BreakingChangeType.DIRECTIVE_ARG_REMOVED,
        description: `${oldArg.name} was removed from ${oldDirective.name}.`
      });
    }
    if (oldDirective.isRepeatable && !newDirective.isRepeatable) {
      schemaChanges.push({
        type: BreakingChangeType.DIRECTIVE_REPEATABLE_REMOVED,
        description: `Repeatable flag was removed from ${oldDirective.name}.`
      });
    }
    for (const location2 of oldDirective.locations) {
      if (!newDirective.locations.includes(location2)) {
        schemaChanges.push({
          type: BreakingChangeType.DIRECTIVE_LOCATION_REMOVED,
          description: `${location2} was removed from ${oldDirective.name}.`
        });
      }
    }
  }
  return schemaChanges;
}
function findTypeChanges(oldSchema, newSchema) {
  const schemaChanges = [];
  const typesDiff = diff(
    Object.values(oldSchema.getTypeMap()),
    Object.values(newSchema.getTypeMap())
  );
  for (const oldType of typesDiff.removed) {
    schemaChanges.push({
      type: BreakingChangeType.TYPE_REMOVED,
      description: isSpecifiedScalarType(oldType) ? `Standard scalar ${oldType.name} was removed because it is not referenced anymore.` : `${oldType.name} was removed.`
    });
  }
  for (const [oldType, newType] of typesDiff.persisted) {
    if (isEnumType(oldType) && isEnumType(newType)) {
      schemaChanges.push(...findEnumTypeChanges(oldType, newType));
    } else if (isUnionType(oldType) && isUnionType(newType)) {
      schemaChanges.push(...findUnionTypeChanges(oldType, newType));
    } else if (isInputObjectType(oldType) && isInputObjectType(newType)) {
      schemaChanges.push(...findInputObjectTypeChanges(oldType, newType));
    } else if (isObjectType(oldType) && isObjectType(newType)) {
      schemaChanges.push(
        ...findFieldChanges(oldType, newType),
        ...findImplementedInterfacesChanges(oldType, newType)
      );
    } else if (isInterfaceType(oldType) && isInterfaceType(newType)) {
      schemaChanges.push(
        ...findFieldChanges(oldType, newType),
        ...findImplementedInterfacesChanges(oldType, newType)
      );
    } else if (oldType.constructor !== newType.constructor) {
      schemaChanges.push({
        type: BreakingChangeType.TYPE_CHANGED_KIND,
        description: `${oldType.name} changed from ${typeKindName(oldType)} to ${typeKindName(newType)}.`
      });
    }
  }
  return schemaChanges;
}
function findInputObjectTypeChanges(oldType, newType) {
  const schemaChanges = [];
  const fieldsDiff = diff(
    Object.values(oldType.getFields()),
    Object.values(newType.getFields())
  );
  for (const newField of fieldsDiff.added) {
    if (isRequiredInputField(newField)) {
      schemaChanges.push({
        type: BreakingChangeType.REQUIRED_INPUT_FIELD_ADDED,
        description: `A required field ${newField.name} on input type ${oldType.name} was added.`
      });
    } else {
      schemaChanges.push({
        type: DangerousChangeType.OPTIONAL_INPUT_FIELD_ADDED,
        description: `An optional field ${newField.name} on input type ${oldType.name} was added.`
      });
    }
  }
  for (const oldField of fieldsDiff.removed) {
    schemaChanges.push({
      type: BreakingChangeType.FIELD_REMOVED,
      description: `${oldType.name}.${oldField.name} was removed.`
    });
  }
  for (const [oldField, newField] of fieldsDiff.persisted) {
    const isSafe = isChangeSafeForInputObjectFieldOrFieldArg(
      oldField.type,
      newField.type
    );
    if (!isSafe) {
      schemaChanges.push({
        type: BreakingChangeType.FIELD_CHANGED_KIND,
        description: `${oldType.name}.${oldField.name} changed type from ${String(oldField.type)} to ${String(newField.type)}.`
      });
    }
  }
  return schemaChanges;
}
function findUnionTypeChanges(oldType, newType) {
  const schemaChanges = [];
  const possibleTypesDiff = diff(oldType.getTypes(), newType.getTypes());
  for (const newPossibleType of possibleTypesDiff.added) {
    schemaChanges.push({
      type: DangerousChangeType.TYPE_ADDED_TO_UNION,
      description: `${newPossibleType.name} was added to union type ${oldType.name}.`
    });
  }
  for (const oldPossibleType of possibleTypesDiff.removed) {
    schemaChanges.push({
      type: BreakingChangeType.TYPE_REMOVED_FROM_UNION,
      description: `${oldPossibleType.name} was removed from union type ${oldType.name}.`
    });
  }
  return schemaChanges;
}
function findEnumTypeChanges(oldType, newType) {
  const schemaChanges = [];
  const valuesDiff = diff(oldType.getValues(), newType.getValues());
  for (const newValue of valuesDiff.added) {
    schemaChanges.push({
      type: DangerousChangeType.VALUE_ADDED_TO_ENUM,
      description: `${newValue.name} was added to enum type ${oldType.name}.`
    });
  }
  for (const oldValue of valuesDiff.removed) {
    schemaChanges.push({
      type: BreakingChangeType.VALUE_REMOVED_FROM_ENUM,
      description: `${oldValue.name} was removed from enum type ${oldType.name}.`
    });
  }
  return schemaChanges;
}
function findImplementedInterfacesChanges(oldType, newType) {
  const schemaChanges = [];
  const interfacesDiff = diff(oldType.getInterfaces(), newType.getInterfaces());
  for (const newInterface of interfacesDiff.added) {
    schemaChanges.push({
      type: DangerousChangeType.IMPLEMENTED_INTERFACE_ADDED,
      description: `${newInterface.name} added to interfaces implemented by ${oldType.name}.`
    });
  }
  for (const oldInterface of interfacesDiff.removed) {
    schemaChanges.push({
      type: BreakingChangeType.IMPLEMENTED_INTERFACE_REMOVED,
      description: `${oldType.name} no longer implements interface ${oldInterface.name}.`
    });
  }
  return schemaChanges;
}
function findFieldChanges(oldType, newType) {
  const schemaChanges = [];
  const fieldsDiff = diff(
    Object.values(oldType.getFields()),
    Object.values(newType.getFields())
  );
  for (const oldField of fieldsDiff.removed) {
    schemaChanges.push({
      type: BreakingChangeType.FIELD_REMOVED,
      description: `${oldType.name}.${oldField.name} was removed.`
    });
  }
  for (const [oldField, newField] of fieldsDiff.persisted) {
    schemaChanges.push(...findArgChanges(oldType, oldField, newField));
    const isSafe = isChangeSafeForObjectOrInterfaceField(
      oldField.type,
      newField.type
    );
    if (!isSafe) {
      schemaChanges.push({
        type: BreakingChangeType.FIELD_CHANGED_KIND,
        description: `${oldType.name}.${oldField.name} changed type from ${String(oldField.type)} to ${String(newField.type)}.`
      });
    }
  }
  return schemaChanges;
}
function findArgChanges(oldType, oldField, newField) {
  const schemaChanges = [];
  const argsDiff = diff(oldField.args, newField.args);
  for (const oldArg of argsDiff.removed) {
    schemaChanges.push({
      type: BreakingChangeType.ARG_REMOVED,
      description: `${oldType.name}.${oldField.name} arg ${oldArg.name} was removed.`
    });
  }
  for (const [oldArg, newArg] of argsDiff.persisted) {
    const isSafe = isChangeSafeForInputObjectFieldOrFieldArg(
      oldArg.type,
      newArg.type
    );
    if (!isSafe) {
      schemaChanges.push({
        type: BreakingChangeType.ARG_CHANGED_KIND,
        description: `${oldType.name}.${oldField.name} arg ${oldArg.name} has changed type from ${String(oldArg.type)} to ${String(newArg.type)}.`
      });
    } else if (oldArg.defaultValue !== void 0) {
      if (newArg.defaultValue === void 0) {
        schemaChanges.push({
          type: DangerousChangeType.ARG_DEFAULT_VALUE_CHANGE,
          description: `${oldType.name}.${oldField.name} arg ${oldArg.name} defaultValue was removed.`
        });
      } else {
        const oldValueStr = stringifyValue(oldArg.defaultValue, oldArg.type);
        const newValueStr = stringifyValue(newArg.defaultValue, newArg.type);
        if (oldValueStr !== newValueStr) {
          schemaChanges.push({
            type: DangerousChangeType.ARG_DEFAULT_VALUE_CHANGE,
            description: `${oldType.name}.${oldField.name} arg ${oldArg.name} has changed defaultValue from ${oldValueStr} to ${newValueStr}.`
          });
        }
      }
    }
  }
  for (const newArg of argsDiff.added) {
    if (isRequiredArgument(newArg)) {
      schemaChanges.push({
        type: BreakingChangeType.REQUIRED_ARG_ADDED,
        description: `A required arg ${newArg.name} on ${oldType.name}.${oldField.name} was added.`
      });
    } else {
      schemaChanges.push({
        type: DangerousChangeType.OPTIONAL_ARG_ADDED,
        description: `An optional arg ${newArg.name} on ${oldType.name}.${oldField.name} was added.`
      });
    }
  }
  return schemaChanges;
}
function isChangeSafeForObjectOrInterfaceField(oldType, newType) {
  if (isListType(oldType)) {
    return isListType(newType) && isChangeSafeForObjectOrInterfaceField(
      oldType.ofType,
      newType.ofType
    ) || isNonNullType(newType) && isChangeSafeForObjectOrInterfaceField(oldType, newType.ofType);
  }
  if (isNonNullType(oldType)) {
    return isNonNullType(newType) && isChangeSafeForObjectOrInterfaceField(oldType.ofType, newType.ofType);
  }
  return isNamedType(newType) && oldType.name === newType.name || isNonNullType(newType) && isChangeSafeForObjectOrInterfaceField(oldType, newType.ofType);
}
function isChangeSafeForInputObjectFieldOrFieldArg(oldType, newType) {
  if (isListType(oldType)) {
    return isListType(newType) && isChangeSafeForInputObjectFieldOrFieldArg(oldType.ofType, newType.ofType);
  }
  if (isNonNullType(oldType)) {
    return isNonNullType(newType) && isChangeSafeForInputObjectFieldOrFieldArg(
      oldType.ofType,
      newType.ofType
    ) || !isNonNullType(newType) && isChangeSafeForInputObjectFieldOrFieldArg(oldType.ofType, newType);
  }
  return isNamedType(newType) && oldType.name === newType.name;
}
function typeKindName(type) {
  if (isScalarType(type)) {
    return "a Scalar type";
  }
  if (isObjectType(type)) {
    return "an Object type";
  }
  if (isInterfaceType(type)) {
    return "an Interface type";
  }
  if (isUnionType(type)) {
    return "a Union type";
  }
  if (isEnumType(type)) {
    return "an Enum type";
  }
  if (isInputObjectType(type)) {
    return "an Input type";
  }
  invariant(false, "Unexpected type: " + inspect(type));
}
function stringifyValue(value, type) {
  const ast = astFromValue(value, type);
  ast != null || invariant(false);
  return print(sortValueNode(ast));
}
function diff(oldArray, newArray) {
  const added = [];
  const removed = [];
  const persisted = [];
  const oldMap = keyMap(oldArray, ({ name }) => name);
  const newMap = keyMap(newArray, ({ name }) => name);
  for (const oldItem of oldArray) {
    const newItem = newMap[oldItem.name];
    if (newItem === void 0) {
      removed.push(oldItem);
    } else {
      persisted.push([oldItem, newItem]);
    }
  }
  for (const newItem of newArray) {
    if (oldMap[newItem.name] === void 0) {
      added.push(newItem);
    }
  }
  return {
    added,
    persisted,
    removed
  };
}
const _graphql_16_6_0_graphql = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  version,
  versionInfo,
  graphql: graphql$1,
  graphqlSync,
  resolveObjMapThunk,
  resolveReadonlyArrayThunk,
  GraphQLSchema,
  GraphQLDirective,
  GraphQLScalarType,
  GraphQLObjectType,
  GraphQLInterfaceType,
  GraphQLUnionType,
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLNonNull,
  specifiedScalarTypes,
  GraphQLInt,
  GraphQLFloat,
  GraphQLString,
  GraphQLBoolean,
  GraphQLID,
  GRAPHQL_MAX_INT,
  GRAPHQL_MIN_INT,
  specifiedDirectives,
  GraphQLIncludeDirective,
  GraphQLSkipDirective,
  GraphQLDeprecatedDirective,
  GraphQLSpecifiedByDirective,
  get TypeKind() {
    return TypeKind;
  },
  DEFAULT_DEPRECATION_REASON,
  introspectionTypes,
  __Schema,
  __Directive,
  __DirectiveLocation,
  __Type,
  __Field,
  __InputValue,
  __EnumValue,
  __TypeKind,
  SchemaMetaFieldDef,
  TypeMetaFieldDef,
  TypeNameMetaFieldDef,
  isSchema,
  isDirective,
  isType,
  isScalarType,
  isObjectType,
  isInterfaceType,
  isUnionType,
  isEnumType,
  isInputObjectType,
  isListType,
  isNonNullType,
  isInputType,
  isOutputType,
  isLeafType,
  isCompositeType,
  isAbstractType,
  isWrappingType,
  isNullableType,
  isNamedType,
  isRequiredArgument,
  isRequiredInputField,
  isSpecifiedScalarType,
  isIntrospectionType,
  isSpecifiedDirective,
  assertSchema,
  assertDirective,
  assertType,
  assertScalarType,
  assertObjectType,
  assertInterfaceType,
  assertUnionType,
  assertEnumType,
  assertInputObjectType,
  assertListType,
  assertNonNullType,
  assertInputType,
  assertOutputType,
  assertLeafType,
  assertCompositeType,
  assertAbstractType,
  assertWrappingType,
  assertNullableType,
  assertNamedType,
  getNullableType,
  getNamedType,
  validateSchema,
  assertValidSchema,
  assertName,
  assertEnumValueName,
  Token,
  Source,
  Location,
  get OperationTypeNode() {
    return OperationTypeNode;
  },
  getLocation,
  printLocation,
  printSourceLocation,
  Lexer,
  get TokenKind() {
    return TokenKind;
  },
  parse: parse$1,
  parseValue,
  parseConstValue,
  parseType,
  print,
  visit,
  visitInParallel,
  getVisitFn,
  getEnterLeaveForKind,
  BREAK,
  get Kind() {
    return Kind;
  },
  get DirectiveLocation() {
    return DirectiveLocation;
  },
  isDefinitionNode,
  isExecutableDefinitionNode,
  isSelectionNode,
  isValueNode,
  isConstValueNode,
  isTypeNode,
  isTypeSystemDefinitionNode,
  isTypeDefinitionNode,
  isTypeSystemExtensionNode,
  isTypeExtensionNode,
  execute,
  executeSync,
  defaultFieldResolver,
  defaultTypeResolver,
  responsePathAsArray: pathToArray,
  getArgumentValues,
  getVariableValues,
  getDirectiveValues,
  subscribe,
  createSourceEventStream,
  validate,
  ValidationContext,
  specifiedRules,
  ExecutableDefinitionsRule,
  FieldsOnCorrectTypeRule,
  FragmentsOnCompositeTypesRule,
  KnownArgumentNamesRule,
  KnownDirectivesRule,
  KnownFragmentNamesRule,
  KnownTypeNamesRule,
  LoneAnonymousOperationRule,
  NoFragmentCyclesRule,
  NoUndefinedVariablesRule,
  NoUnusedFragmentsRule,
  NoUnusedVariablesRule,
  OverlappingFieldsCanBeMergedRule,
  PossibleFragmentSpreadsRule,
  ProvidedRequiredArgumentsRule,
  ScalarLeafsRule,
  SingleFieldSubscriptionsRule,
  UniqueArgumentNamesRule,
  UniqueDirectivesPerLocationRule,
  UniqueFragmentNamesRule,
  UniqueInputFieldNamesRule,
  UniqueOperationNamesRule,
  UniqueVariableNamesRule,
  ValuesOfCorrectTypeRule,
  VariablesAreInputTypesRule,
  VariablesInAllowedPositionRule,
  LoneSchemaDefinitionRule,
  UniqueOperationTypesRule,
  UniqueTypeNamesRule,
  UniqueEnumValueNamesRule,
  UniqueFieldDefinitionNamesRule,
  UniqueArgumentDefinitionNamesRule,
  UniqueDirectiveNamesRule,
  PossibleTypeExtensionsRule,
  NoDeprecatedCustomRule,
  NoSchemaIntrospectionCustomRule,
  GraphQLError,
  syntaxError,
  locatedError,
  printError,
  formatError,
  getIntrospectionQuery,
  getOperationAST,
  getOperationRootType,
  introspectionFromSchema,
  buildClientSchema,
  buildASTSchema,
  buildSchema,
  extendSchema,
  lexicographicSortSchema,
  printSchema,
  printType,
  printIntrospectionSchema,
  typeFromAST,
  valueFromAST,
  valueFromASTUntyped,
  astFromValue,
  TypeInfo,
  visitWithTypeInfo,
  coerceInputValue,
  concatAST,
  separateOperations,
  stripIgnoredCharacters,
  isEqualType,
  isTypeSubTypeOf,
  doTypesOverlap,
  assertValidName,
  isValidNameError,
  get BreakingChangeType() {
    return BreakingChangeType;
  },
  get DangerousChangeType() {
    return DangerousChangeType;
  },
  findBreakingChanges,
  findDangerousChanges
}, Symbol.toStringTag, { value: "Module" }));
const require$$13 = /* @__PURE__ */ getAugmentedNamespace(_graphql_16_6_0_graphql);
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (code >= 48 && code <= 57 || code >= 65 && code <= 90 || code >= 97 && code <= 122 || code === 95) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a2 = options.prefixes, prefixes = _a2 === void 0 ? "./" : _a2;
  var defaultPattern = "[^".concat(escapeString(options.delimiter || "/#?"), "]+?");
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  };
  var mustConsume = function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a3 = tokens[i], nextType = _a3.type, index = _a3.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  };
  var consumeText = function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  };
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || defaultPattern,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? defaultPattern : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
function compile(str, options) {
  return tokensToFunction(parse(str, options), options);
}
function tokensToFunction(tokens, options) {
  if (options === void 0) {
    options = {};
  }
  var reFlags = flags(options);
  var _a2 = options.encode, encode2 = _a2 === void 0 ? function(x) {
    return x;
  } : _a2, _b2 = options.validate, validate2 = _b2 === void 0 ? true : _b2;
  var matches = tokens.map(function(token) {
    if (typeof token === "object") {
      return new RegExp("^(?:".concat(token.pattern, ")$"), reFlags);
    }
  });
  return function(data2) {
    var path = "";
    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i];
      if (typeof token === "string") {
        path += token;
        continue;
      }
      var value = data2 ? data2[token.name] : void 0;
      var optional = token.modifier === "?" || token.modifier === "*";
      var repeat = token.modifier === "*" || token.modifier === "+";
      if (Array.isArray(value)) {
        if (!repeat) {
          throw new TypeError('Expected "'.concat(token.name, '" to not repeat, but got an array'));
        }
        if (value.length === 0) {
          if (optional)
            continue;
          throw new TypeError('Expected "'.concat(token.name, '" to not be empty'));
        }
        for (var j = 0; j < value.length; j++) {
          var segment = encode2(value[j], token);
          if (validate2 && !matches[i].test(segment)) {
            throw new TypeError('Expected all "'.concat(token.name, '" to match "').concat(token.pattern, '", but got "').concat(segment, '"'));
          }
          path += token.prefix + segment + token.suffix;
        }
        continue;
      }
      if (typeof value === "string" || typeof value === "number") {
        var segment = encode2(String(value), token);
        if (validate2 && !matches[i].test(segment)) {
          throw new TypeError('Expected "'.concat(token.name, '" to match "').concat(token.pattern, '", but got "').concat(segment, '"'));
        }
        path += token.prefix + segment + token.suffix;
        continue;
      }
      if (optional)
        continue;
      var typeOfMessage = repeat ? "an array" : "a string";
      throw new TypeError('Expected "'.concat(token.name, '" to be ').concat(typeOfMessage));
    }
    return path;
  };
}
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a2 = options.decode, decode2 = _a2 === void 0 ? function(x) {
    return x;
  } : _a2;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode2(value, key);
        });
      } else {
        params[key.name] = decode2(m[i2], key);
      }
    };
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a2 = options.strict, strict = _a2 === void 0 ? false : _a2, _b2 = options.start, start = _b2 === void 0 ? true : _b2, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode2 = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode2(token));
    } else {
      var prefix = escapeString(encode2(token.prefix));
      var suffix = escapeString(encode2(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            route += "((?:".concat(token.pattern, ")").concat(token.modifier, ")");
          } else {
            route += "(".concat(token.pattern, ")").concat(token.modifier);
          }
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
const dist_es2015 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  parse,
  compile,
  tokensToFunction,
  match,
  regexpToFunction,
  tokensToRegexp,
  pathToRegexp
}, Symbol.toStringTag, { value: "Module" }));
const require$$14 = /* @__PURE__ */ getAugmentedNamespace(dist_es2015);
var fetch$2 = {};
var toIsoResponse = {};
var hasRequiredToIsoResponse;
function requireToIsoResponse() {
  if (hasRequiredToIsoResponse)
    return toIsoResponse;
  hasRequiredToIsoResponse = 1;
  Object.defineProperty(toIsoResponse, "__esModule", { value: true });
  toIsoResponse.toIsoResponse = void 0;
  var headers_polyfill_1 = lib$9;
  function toIsoResponse$1(response2) {
    var _a2;
    return {
      status: (_a2 = response2.status) !== null && _a2 !== void 0 ? _a2 : 200,
      statusText: response2.statusText || "OK",
      headers: headers_polyfill_1.objectToHeaders(response2.headers || {}),
      body: response2.body
    };
  }
  toIsoResponse.toIsoResponse = toIsoResponse$1;
  return toIsoResponse;
}
var hasRequiredFetch;
function requireFetch() {
  if (hasRequiredFetch)
    return fetch$2;
  hasRequiredFetch = 1;
  var __extends2 = commonjsGlobal && commonjsGlobal.__extends || function() {
    var extendStatics = function(d, b) {
      extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
        d2.__proto__ = b2;
      } || function(d2, b2) {
        for (var p in b2)
          if (Object.prototype.hasOwnProperty.call(b2, p))
            d2[p] = b2[p];
      };
      return extendStatics(d, b);
    };
    return function(d, b) {
      if (typeof b !== "function" && b !== null)
        throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
  }();
  var __assign = commonjsGlobal && commonjsGlobal.__assign || function() {
    __assign = Object.assign || function(t) {
      for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s)
          if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
      }
      return t;
    };
    return __assign.apply(this, arguments);
  };
  var __awaiter2 = commonjsGlobal && commonjsGlobal.__awaiter || function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve) {
        resolve(value);
      });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
  var __generator2 = commonjsGlobal && commonjsGlobal.__generator || function(thisArg, body2) {
    var _ = { label: 0, sent: function() {
      if (t[0] & 1)
        throw t[1];
      return t[1];
    }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
      return this;
    }), g;
    function verb(n) {
      return function(v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f)
        throw new TypeError("Generator is already executing.");
      while (_)
        try {
          if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done)
            return t;
          if (y = 0, t)
            op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2])
                _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body2.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5)
        throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
  var __read2 = commonjsGlobal && commonjsGlobal.__read || function(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m)
      return o;
    var i = m.call(o), r, ar = [], e;
    try {
      while ((n === void 0 || n-- > 0) && !(r = i.next()).done)
        ar.push(r.value);
    } catch (error2) {
      e = { error: error2 };
    } finally {
      try {
        if (r && !r.done && (m = i["return"]))
          m.call(i);
      } finally {
        if (e)
          throw e.error;
      }
    }
    return ar;
  };
  Object.defineProperty(fetch$2, "__esModule", { value: true });
  fetch$2.FetchInterceptor = void 0;
  var headers_polyfill_1 = lib$9;
  var outvariant_12 = lib$5;
  var IsomorphicRequest_12 = IsomorphicRequest$1;
  var glossary_1 = glossary;
  var Interceptor_12 = Interceptor;
  var toIsoResponse_1 = requireToIsoResponse();
  var InteractiveIsomorphicRequest_1 = InteractiveIsomorphicRequest$1;
  var FetchInterceptor = function(_super) {
    __extends2(FetchInterceptor2, _super);
    function FetchInterceptor2() {
      return _super.call(this, FetchInterceptor2.symbol) || this;
    }
    FetchInterceptor2.prototype.checkEnvironment = function() {
      return typeof globalThis !== "undefined" && typeof globalThis.fetch !== "undefined";
    };
    FetchInterceptor2.prototype.setup = function() {
      var _this = this;
      var pureFetch = globalThis.fetch;
      outvariant_12.invariant(!pureFetch[glossary_1.IS_PATCHED_MODULE], 'Failed to patch the "fetch" module: already patched.');
      globalThis.fetch = function(input, init2) {
        return __awaiter2(_this, void 0, void 0, function() {
          var request, url, method, body2, isomorphicRequest, interactiveIsomorphicRequest, _a2, mockedResponse, isomorphicResponse, response2;
          var _this2 = this;
          return __generator2(this, function(_b2) {
            switch (_b2.label) {
              case 0:
                request = new Request(input, init2);
                url = typeof input === "string" ? input : input.url;
                method = request.method;
                this.log("[%s] %s", method, url);
                return [4, request.clone().arrayBuffer()];
              case 1:
                body2 = _b2.sent();
                isomorphicRequest = new IsomorphicRequest_12.IsomorphicRequest(new URL(url, location.origin), {
                  body: body2,
                  method,
                  headers: new headers_polyfill_1.Headers(request.headers),
                  credentials: request.credentials
                });
                interactiveIsomorphicRequest = new InteractiveIsomorphicRequest_1.InteractiveIsomorphicRequest(isomorphicRequest);
                this.log("isomorphic request", interactiveIsomorphicRequest);
                this.log('emitting the "request" event for %d listener(s)...', this.emitter.listenerCount("request"));
                this.emitter.emit("request", interactiveIsomorphicRequest);
                this.log("awaiting for the mocked response...");
                return [4, this.emitter.untilIdle("request", function(_a3) {
                  var _b3 = __read2(_a3.args, 1), request2 = _b3[0];
                  return request2.id === interactiveIsomorphicRequest.id;
                })];
              case 2:
                _b2.sent();
                this.log("all request listeners have been resolved!");
                return [4, interactiveIsomorphicRequest.respondWith.invoked()];
              case 3:
                _a2 = __read2.apply(void 0, [_b2.sent(), 1]), mockedResponse = _a2[0];
                this.log("event.respondWith called with:", mockedResponse);
                if (mockedResponse) {
                  this.log("received mocked response:", mockedResponse);
                  isomorphicResponse = toIsoResponse_1.toIsoResponse(mockedResponse);
                  this.log("derived isomorphic response:", isomorphicResponse);
                  this.emitter.emit("response", interactiveIsomorphicRequest, isomorphicResponse);
                  response2 = new Response(mockedResponse.body, __assign(__assign({}, isomorphicResponse), {
                    headers: headers_polyfill_1.flattenHeadersObject(mockedResponse.headers || {})
                  }));
                  Object.defineProperty(response2, "url", {
                    writable: false,
                    enumerable: true,
                    configurable: false,
                    value: interactiveIsomorphicRequest.url.href
                  });
                  return [2, response2];
                }
                this.log("no mocked response received!");
                return [2, pureFetch(request).then(function(response3) {
                  return __awaiter2(_this2, void 0, void 0, function() {
                    var cloneResponse, _a3, _b3, _c;
                    return __generator2(this, function(_d) {
                      switch (_d.label) {
                        case 0:
                          cloneResponse = response3.clone();
                          this.log("original fetch performed", cloneResponse);
                          _b3 = (_a3 = this.emitter).emit;
                          _c = [
                            "response",
                            interactiveIsomorphicRequest
                          ];
                          return [4, normalizeFetchResponse(cloneResponse)];
                        case 1:
                          _b3.apply(_a3, _c.concat([_d.sent()]));
                          return [2, response3];
                      }
                    });
                  });
                })];
            }
          });
        });
      };
      Object.defineProperty(globalThis.fetch, glossary_1.IS_PATCHED_MODULE, {
        enumerable: true,
        configurable: true,
        value: true
      });
      this.subscriptions.push(function() {
        Object.defineProperty(globalThis.fetch, glossary_1.IS_PATCHED_MODULE, {
          value: void 0
        });
        globalThis.fetch = pureFetch;
        _this.log('restored native "globalThis.fetch"!', globalThis.fetch.name);
      });
    };
    FetchInterceptor2.symbol = Symbol("fetch");
    return FetchInterceptor2;
  }(Interceptor_12.Interceptor);
  fetch$2.FetchInterceptor = FetchInterceptor;
  function normalizeFetchResponse(response2) {
    return __awaiter2(this, void 0, void 0, function() {
      var _a2;
      return __generator2(this, function(_b2) {
        switch (_b2.label) {
          case 0:
            _a2 = {
              status: response2.status,
              statusText: response2.statusText,
              headers: headers_polyfill_1.objectToHeaders(headers_polyfill_1.headersToObject(response2.headers))
            };
            return [4, response2.text()];
          case 1:
            return [2, (_a2.body = _b2.sent(), _a2)];
        }
      });
    });
  }
  return fetch$2;
}
var XMLHttpRequest = {};
var XMLHttpRequestOverride = {};
var lib$1 = {};
var dom = {};
var conventions = {};
var hasRequiredConventions;
function requireConventions() {
  if (hasRequiredConventions)
    return conventions;
  hasRequiredConventions = 1;
  function freeze(object, oc) {
    if (oc === void 0) {
      oc = Object;
    }
    return oc && typeof oc.freeze === "function" ? oc.freeze(object) : object;
  }
  var MIME_TYPE = freeze({
    HTML: "text/html",
    isHTML: function(value) {
      return value === MIME_TYPE.HTML;
    },
    XML_APPLICATION: "application/xml",
    XML_TEXT: "text/xml",
    XML_XHTML_APPLICATION: "application/xhtml+xml",
    XML_SVG_IMAGE: "image/svg+xml"
  });
  var NAMESPACE = freeze({
    HTML: "http://www.w3.org/1999/xhtml",
    isHTML: function(uri) {
      return uri === NAMESPACE.HTML;
    },
    SVG: "http://www.w3.org/2000/svg",
    XML: "http://www.w3.org/XML/1998/namespace",
    XMLNS: "http://www.w3.org/2000/xmlns/"
  });
  conventions.freeze = freeze;
  conventions.MIME_TYPE = MIME_TYPE;
  conventions.NAMESPACE = NAMESPACE;
  return conventions;
}
var hasRequiredDom;
function requireDom() {
  if (hasRequiredDom)
    return dom;
  hasRequiredDom = 1;
  var conventions2 = requireConventions();
  var NAMESPACE = conventions2.NAMESPACE;
  function notEmptyString(input) {
    return input !== "";
  }
  function splitOnASCIIWhitespace(input) {
    return input ? input.split(/[\t\n\f\r ]+/).filter(notEmptyString) : [];
  }
  function orderedSetReducer(current, element2) {
    if (!current.hasOwnProperty(element2)) {
      current[element2] = true;
    }
    return current;
  }
  function toOrderedSet(input) {
    if (!input)
      return [];
    var list = splitOnASCIIWhitespace(input);
    return Object.keys(list.reduce(orderedSetReducer, {}));
  }
  function arrayIncludes(list) {
    return function(element2) {
      return list && list.indexOf(element2) !== -1;
    };
  }
  function copy(src2, dest) {
    for (var p in src2) {
      dest[p] = src2[p];
    }
  }
  function _extends(Class, Super) {
    var pt = Class.prototype;
    if (!(pt instanceof Super)) {
      let t = function() {
      };
      t.prototype = Super.prototype;
      t = new t();
      copy(pt, t);
      Class.prototype = pt = t;
    }
    if (pt.constructor != Class) {
      if (typeof Class != "function") {
        console.error("unknown Class:" + Class);
      }
      pt.constructor = Class;
    }
  }
  var NodeType = {};
  var ELEMENT_NODE = NodeType.ELEMENT_NODE = 1;
  var ATTRIBUTE_NODE = NodeType.ATTRIBUTE_NODE = 2;
  var TEXT_NODE = NodeType.TEXT_NODE = 3;
  var CDATA_SECTION_NODE = NodeType.CDATA_SECTION_NODE = 4;
  var ENTITY_REFERENCE_NODE = NodeType.ENTITY_REFERENCE_NODE = 5;
  var ENTITY_NODE = NodeType.ENTITY_NODE = 6;
  var PROCESSING_INSTRUCTION_NODE = NodeType.PROCESSING_INSTRUCTION_NODE = 7;
  var COMMENT_NODE = NodeType.COMMENT_NODE = 8;
  var DOCUMENT_NODE = NodeType.DOCUMENT_NODE = 9;
  var DOCUMENT_TYPE_NODE = NodeType.DOCUMENT_TYPE_NODE = 10;
  var DOCUMENT_FRAGMENT_NODE = NodeType.DOCUMENT_FRAGMENT_NODE = 11;
  var NOTATION_NODE = NodeType.NOTATION_NODE = 12;
  var ExceptionCode = {};
  var ExceptionMessage = {};
  ExceptionCode.INDEX_SIZE_ERR = (ExceptionMessage[1] = "Index size error", 1);
  ExceptionCode.DOMSTRING_SIZE_ERR = (ExceptionMessage[2] = "DOMString size error", 2);
  var HIERARCHY_REQUEST_ERR = ExceptionCode.HIERARCHY_REQUEST_ERR = (ExceptionMessage[3] = "Hierarchy request error", 3);
  ExceptionCode.WRONG_DOCUMENT_ERR = (ExceptionMessage[4] = "Wrong document", 4);
  ExceptionCode.INVALID_CHARACTER_ERR = (ExceptionMessage[5] = "Invalid character", 5);
  ExceptionCode.NO_DATA_ALLOWED_ERR = (ExceptionMessage[6] = "No data allowed", 6);
  ExceptionCode.NO_MODIFICATION_ALLOWED_ERR = (ExceptionMessage[7] = "No modification allowed", 7);
  var NOT_FOUND_ERR = ExceptionCode.NOT_FOUND_ERR = (ExceptionMessage[8] = "Not found", 8);
  ExceptionCode.NOT_SUPPORTED_ERR = (ExceptionMessage[9] = "Not supported", 9);
  var INUSE_ATTRIBUTE_ERR = ExceptionCode.INUSE_ATTRIBUTE_ERR = (ExceptionMessage[10] = "Attribute in use", 10);
  ExceptionCode.INVALID_STATE_ERR = (ExceptionMessage[11] = "Invalid state", 11);
  ExceptionCode.SYNTAX_ERR = (ExceptionMessage[12] = "Syntax error", 12);
  ExceptionCode.INVALID_MODIFICATION_ERR = (ExceptionMessage[13] = "Invalid modification", 13);
  ExceptionCode.NAMESPACE_ERR = (ExceptionMessage[14] = "Invalid namespace", 14);
  ExceptionCode.INVALID_ACCESS_ERR = (ExceptionMessage[15] = "Invalid access", 15);
  function DOMException(code, message) {
    if (message instanceof Error) {
      var error2 = message;
    } else {
      error2 = this;
      Error.call(this, ExceptionMessage[code]);
      this.message = ExceptionMessage[code];
      if (Error.captureStackTrace)
        Error.captureStackTrace(this, DOMException);
    }
    error2.code = code;
    if (message)
      this.message = this.message + ": " + message;
    return error2;
  }
  DOMException.prototype = Error.prototype;
  copy(ExceptionCode, DOMException);
  function NodeList() {
  }
  NodeList.prototype = {
    length: 0,
    item: function(index) {
      return this[index] || null;
    },
    toString: function(isHTML, nodeFilter) {
      for (var buf = [], i = 0; i < this.length; i++) {
        serializeToString(this[i], buf, isHTML, nodeFilter);
      }
      return buf.join("");
    }
  };
  function LiveNodeList(node, refresh) {
    this._node = node;
    this._refresh = refresh;
    _updateLiveList(this);
  }
  function _updateLiveList(list) {
    var inc = list._node._inc || list._node.ownerDocument._inc;
    if (list._inc != inc) {
      var ls = list._refresh(list._node);
      __set__(list, "length", ls.length);
      copy(ls, list);
      list._inc = inc;
    }
  }
  LiveNodeList.prototype.item = function(i) {
    _updateLiveList(this);
    return this[i];
  };
  _extends(LiveNodeList, NodeList);
  function NamedNodeMap() {
  }
  function _findNodeIndex(list, node) {
    var i = list.length;
    while (i--) {
      if (list[i] === node) {
        return i;
      }
    }
  }
  function _addNamedNode(el, list, newAttr, oldAttr) {
    if (oldAttr) {
      list[_findNodeIndex(list, oldAttr)] = newAttr;
    } else {
      list[list.length++] = newAttr;
    }
    if (el) {
      newAttr.ownerElement = el;
      var doc = el.ownerDocument;
      if (doc) {
        oldAttr && _onRemoveAttribute(doc, el, oldAttr);
        _onAddAttribute(doc, el, newAttr);
      }
    }
  }
  function _removeNamedNode(el, list, attr2) {
    var i = _findNodeIndex(list, attr2);
    if (i >= 0) {
      var lastIndex = list.length - 1;
      while (i < lastIndex) {
        list[i] = list[++i];
      }
      list.length = lastIndex;
      if (el) {
        var doc = el.ownerDocument;
        if (doc) {
          _onRemoveAttribute(doc, el, attr2);
          attr2.ownerElement = null;
        }
      }
    } else {
      throw DOMException(NOT_FOUND_ERR, new Error(el.tagName + "@" + attr2));
    }
  }
  NamedNodeMap.prototype = {
    length: 0,
    item: NodeList.prototype.item,
    getNamedItem: function(key) {
      var i = this.length;
      while (i--) {
        var attr2 = this[i];
        if (attr2.nodeName == key) {
          return attr2;
        }
      }
    },
    setNamedItem: function(attr2) {
      var el = attr2.ownerElement;
      if (el && el != this._ownerElement) {
        throw new DOMException(INUSE_ATTRIBUTE_ERR);
      }
      var oldAttr = this.getNamedItem(attr2.nodeName);
      _addNamedNode(this._ownerElement, this, attr2, oldAttr);
      return oldAttr;
    },
    setNamedItemNS: function(attr2) {
      var el = attr2.ownerElement, oldAttr;
      if (el && el != this._ownerElement) {
        throw new DOMException(INUSE_ATTRIBUTE_ERR);
      }
      oldAttr = this.getNamedItemNS(attr2.namespaceURI, attr2.localName);
      _addNamedNode(this._ownerElement, this, attr2, oldAttr);
      return oldAttr;
    },
    removeNamedItem: function(key) {
      var attr2 = this.getNamedItem(key);
      _removeNamedNode(this._ownerElement, this, attr2);
      return attr2;
    },
    removeNamedItemNS: function(namespaceURI, localName) {
      var attr2 = this.getNamedItemNS(namespaceURI, localName);
      _removeNamedNode(this._ownerElement, this, attr2);
      return attr2;
    },
    getNamedItemNS: function(namespaceURI, localName) {
      var i = this.length;
      while (i--) {
        var node = this[i];
        if (node.localName == localName && node.namespaceURI == namespaceURI) {
          return node;
        }
      }
      return null;
    }
  };
  function DOMImplementation() {
  }
  DOMImplementation.prototype = {
    hasFeature: function(feature, version2) {
      return true;
    },
    createDocument: function(namespaceURI, qualifiedName, doctype) {
      var doc = new Document();
      doc.implementation = this;
      doc.childNodes = new NodeList();
      doc.doctype = doctype || null;
      if (doctype) {
        doc.appendChild(doctype);
      }
      if (qualifiedName) {
        var root = doc.createElementNS(namespaceURI, qualifiedName);
        doc.appendChild(root);
      }
      return doc;
    },
    createDocumentType: function(qualifiedName, publicId, systemId) {
      var node = new DocumentType();
      node.name = qualifiedName;
      node.nodeName = qualifiedName;
      node.publicId = publicId || "";
      node.systemId = systemId || "";
      return node;
    }
  };
  function Node() {
  }
  Node.prototype = {
    firstChild: null,
    lastChild: null,
    previousSibling: null,
    nextSibling: null,
    attributes: null,
    parentNode: null,
    childNodes: null,
    ownerDocument: null,
    nodeValue: null,
    namespaceURI: null,
    prefix: null,
    localName: null,
    insertBefore: function(newChild, refChild) {
      return _insertBefore(this, newChild, refChild);
    },
    replaceChild: function(newChild, oldChild) {
      this.insertBefore(newChild, oldChild);
      if (oldChild) {
        this.removeChild(oldChild);
      }
    },
    removeChild: function(oldChild) {
      return _removeChild(this, oldChild);
    },
    appendChild: function(newChild) {
      return this.insertBefore(newChild, null);
    },
    hasChildNodes: function() {
      return this.firstChild != null;
    },
    cloneNode: function(deep) {
      return cloneNode(this.ownerDocument || this, this, deep);
    },
    normalize: function() {
      var child = this.firstChild;
      while (child) {
        var next = child.nextSibling;
        if (next && next.nodeType == TEXT_NODE && child.nodeType == TEXT_NODE) {
          this.removeChild(next);
          child.appendData(next.data);
        } else {
          child.normalize();
          child = next;
        }
      }
    },
    isSupported: function(feature, version2) {
      return this.ownerDocument.implementation.hasFeature(feature, version2);
    },
    hasAttributes: function() {
      return this.attributes.length > 0;
    },
    lookupPrefix: function(namespaceURI) {
      var el = this;
      while (el) {
        var map = el._nsMap;
        if (map) {
          for (var n in map) {
            if (map[n] == namespaceURI) {
              return n;
            }
          }
        }
        el = el.nodeType == ATTRIBUTE_NODE ? el.ownerDocument : el.parentNode;
      }
      return null;
    },
    lookupNamespaceURI: function(prefix) {
      var el = this;
      while (el) {
        var map = el._nsMap;
        if (map) {
          if (prefix in map) {
            return map[prefix];
          }
        }
        el = el.nodeType == ATTRIBUTE_NODE ? el.ownerDocument : el.parentNode;
      }
      return null;
    },
    isDefaultNamespace: function(namespaceURI) {
      var prefix = this.lookupPrefix(namespaceURI);
      return prefix == null;
    }
  };
  function _xmlEncoder(c) {
    return c == "<" && "&lt;" || c == ">" && "&gt;" || c == "&" && "&amp;" || c == '"' && "&quot;" || "&#" + c.charCodeAt() + ";";
  }
  copy(NodeType, Node);
  copy(NodeType, Node.prototype);
  function _visitNode(node, callback) {
    if (callback(node)) {
      return true;
    }
    if (node = node.firstChild) {
      do {
        if (_visitNode(node, callback)) {
          return true;
        }
      } while (node = node.nextSibling);
    }
  }
  function Document() {
  }
  function _onAddAttribute(doc, el, newAttr) {
    doc && doc._inc++;
    var ns = newAttr.namespaceURI;
    if (ns === NAMESPACE.XMLNS) {
      el._nsMap[newAttr.prefix ? newAttr.localName : ""] = newAttr.value;
    }
  }
  function _onRemoveAttribute(doc, el, newAttr, remove) {
    doc && doc._inc++;
    var ns = newAttr.namespaceURI;
    if (ns === NAMESPACE.XMLNS) {
      delete el._nsMap[newAttr.prefix ? newAttr.localName : ""];
    }
  }
  function _onUpdateChild(doc, el, newChild) {
    if (doc && doc._inc) {
      doc._inc++;
      var cs = el.childNodes;
      if (newChild) {
        cs[cs.length++] = newChild;
      } else {
        var child = el.firstChild;
        var i = 0;
        while (child) {
          cs[i++] = child;
          child = child.nextSibling;
        }
        cs.length = i;
      }
    }
  }
  function _removeChild(parentNode, child) {
    var previous = child.previousSibling;
    var next = child.nextSibling;
    if (previous) {
      previous.nextSibling = next;
    } else {
      parentNode.firstChild = next;
    }
    if (next) {
      next.previousSibling = previous;
    } else {
      parentNode.lastChild = previous;
    }
    _onUpdateChild(parentNode.ownerDocument, parentNode);
    return child;
  }
  function _insertBefore(parentNode, newChild, nextChild) {
    var cp = newChild.parentNode;
    if (cp) {
      cp.removeChild(newChild);
    }
    if (newChild.nodeType === DOCUMENT_FRAGMENT_NODE) {
      var newFirst = newChild.firstChild;
      if (newFirst == null) {
        return newChild;
      }
      var newLast = newChild.lastChild;
    } else {
      newFirst = newLast = newChild;
    }
    var pre = nextChild ? nextChild.previousSibling : parentNode.lastChild;
    newFirst.previousSibling = pre;
    newLast.nextSibling = nextChild;
    if (pre) {
      pre.nextSibling = newFirst;
    } else {
      parentNode.firstChild = newFirst;
    }
    if (nextChild == null) {
      parentNode.lastChild = newLast;
    } else {
      nextChild.previousSibling = newLast;
    }
    do {
      newFirst.parentNode = parentNode;
    } while (newFirst !== newLast && (newFirst = newFirst.nextSibling));
    _onUpdateChild(parentNode.ownerDocument || parentNode, parentNode);
    if (newChild.nodeType == DOCUMENT_FRAGMENT_NODE) {
      newChild.firstChild = newChild.lastChild = null;
    }
    return newChild;
  }
  function _appendSingleChild(parentNode, newChild) {
    var cp = newChild.parentNode;
    if (cp) {
      var pre = parentNode.lastChild;
      cp.removeChild(newChild);
      var pre = parentNode.lastChild;
    }
    var pre = parentNode.lastChild;
    newChild.parentNode = parentNode;
    newChild.previousSibling = pre;
    newChild.nextSibling = null;
    if (pre) {
      pre.nextSibling = newChild;
    } else {
      parentNode.firstChild = newChild;
    }
    parentNode.lastChild = newChild;
    _onUpdateChild(parentNode.ownerDocument, parentNode, newChild);
    return newChild;
  }
  Document.prototype = {
    nodeName: "#document",
    nodeType: DOCUMENT_NODE,
    doctype: null,
    documentElement: null,
    _inc: 1,
    insertBefore: function(newChild, refChild) {
      if (newChild.nodeType == DOCUMENT_FRAGMENT_NODE) {
        var child = newChild.firstChild;
        while (child) {
          var next = child.nextSibling;
          this.insertBefore(child, refChild);
          child = next;
        }
        return newChild;
      }
      if (this.documentElement == null && newChild.nodeType == ELEMENT_NODE) {
        this.documentElement = newChild;
      }
      return _insertBefore(this, newChild, refChild), newChild.ownerDocument = this, newChild;
    },
    removeChild: function(oldChild) {
      if (this.documentElement == oldChild) {
        this.documentElement = null;
      }
      return _removeChild(this, oldChild);
    },
    importNode: function(importedNode, deep) {
      return importNode(this, importedNode, deep);
    },
    getElementById: function(id) {
      var rtv = null;
      _visitNode(this.documentElement, function(node) {
        if (node.nodeType == ELEMENT_NODE) {
          if (node.getAttribute("id") == id) {
            rtv = node;
            return true;
          }
        }
      });
      return rtv;
    },
    getElementsByClassName: function(classNames) {
      var classNamesSet = toOrderedSet(classNames);
      return new LiveNodeList(this, function(base) {
        var ls = [];
        if (classNamesSet.length > 0) {
          _visitNode(base.documentElement, function(node) {
            if (node !== base && node.nodeType === ELEMENT_NODE) {
              var nodeClassNames = node.getAttribute("class");
              if (nodeClassNames) {
                var matches = classNames === nodeClassNames;
                if (!matches) {
                  var nodeClassNamesSet = toOrderedSet(nodeClassNames);
                  matches = classNamesSet.every(arrayIncludes(nodeClassNamesSet));
                }
                if (matches) {
                  ls.push(node);
                }
              }
            }
          });
        }
        return ls;
      });
    },
    createElement: function(tagName) {
      var node = new Element();
      node.ownerDocument = this;
      node.nodeName = tagName;
      node.tagName = tagName;
      node.localName = tagName;
      node.childNodes = new NodeList();
      var attrs = node.attributes = new NamedNodeMap();
      attrs._ownerElement = node;
      return node;
    },
    createDocumentFragment: function() {
      var node = new DocumentFragment();
      node.ownerDocument = this;
      node.childNodes = new NodeList();
      return node;
    },
    createTextNode: function(data2) {
      var node = new Text();
      node.ownerDocument = this;
      node.appendData(data2);
      return node;
    },
    createComment: function(data2) {
      var node = new Comment();
      node.ownerDocument = this;
      node.appendData(data2);
      return node;
    },
    createCDATASection: function(data2) {
      var node = new CDATASection();
      node.ownerDocument = this;
      node.appendData(data2);
      return node;
    },
    createProcessingInstruction: function(target, data2) {
      var node = new ProcessingInstruction();
      node.ownerDocument = this;
      node.tagName = node.target = target;
      node.nodeValue = node.data = data2;
      return node;
    },
    createAttribute: function(name) {
      var node = new Attr();
      node.ownerDocument = this;
      node.name = name;
      node.nodeName = name;
      node.localName = name;
      node.specified = true;
      return node;
    },
    createEntityReference: function(name) {
      var node = new EntityReference();
      node.ownerDocument = this;
      node.nodeName = name;
      return node;
    },
    createElementNS: function(namespaceURI, qualifiedName) {
      var node = new Element();
      var pl = qualifiedName.split(":");
      var attrs = node.attributes = new NamedNodeMap();
      node.childNodes = new NodeList();
      node.ownerDocument = this;
      node.nodeName = qualifiedName;
      node.tagName = qualifiedName;
      node.namespaceURI = namespaceURI;
      if (pl.length == 2) {
        node.prefix = pl[0];
        node.localName = pl[1];
      } else {
        node.localName = qualifiedName;
      }
      attrs._ownerElement = node;
      return node;
    },
    createAttributeNS: function(namespaceURI, qualifiedName) {
      var node = new Attr();
      var pl = qualifiedName.split(":");
      node.ownerDocument = this;
      node.nodeName = qualifiedName;
      node.name = qualifiedName;
      node.namespaceURI = namespaceURI;
      node.specified = true;
      if (pl.length == 2) {
        node.prefix = pl[0];
        node.localName = pl[1];
      } else {
        node.localName = qualifiedName;
      }
      return node;
    }
  };
  _extends(Document, Node);
  function Element() {
    this._nsMap = {};
  }
  Element.prototype = {
    nodeType: ELEMENT_NODE,
    hasAttribute: function(name) {
      return this.getAttributeNode(name) != null;
    },
    getAttribute: function(name) {
      var attr2 = this.getAttributeNode(name);
      return attr2 && attr2.value || "";
    },
    getAttributeNode: function(name) {
      return this.attributes.getNamedItem(name);
    },
    setAttribute: function(name, value) {
      var attr2 = this.ownerDocument.createAttribute(name);
      attr2.value = attr2.nodeValue = "" + value;
      this.setAttributeNode(attr2);
    },
    removeAttribute: function(name) {
      var attr2 = this.getAttributeNode(name);
      attr2 && this.removeAttributeNode(attr2);
    },
    appendChild: function(newChild) {
      if (newChild.nodeType === DOCUMENT_FRAGMENT_NODE) {
        return this.insertBefore(newChild, null);
      } else {
        return _appendSingleChild(this, newChild);
      }
    },
    setAttributeNode: function(newAttr) {
      return this.attributes.setNamedItem(newAttr);
    },
    setAttributeNodeNS: function(newAttr) {
      return this.attributes.setNamedItemNS(newAttr);
    },
    removeAttributeNode: function(oldAttr) {
      return this.attributes.removeNamedItem(oldAttr.nodeName);
    },
    removeAttributeNS: function(namespaceURI, localName) {
      var old = this.getAttributeNodeNS(namespaceURI, localName);
      old && this.removeAttributeNode(old);
    },
    hasAttributeNS: function(namespaceURI, localName) {
      return this.getAttributeNodeNS(namespaceURI, localName) != null;
    },
    getAttributeNS: function(namespaceURI, localName) {
      var attr2 = this.getAttributeNodeNS(namespaceURI, localName);
      return attr2 && attr2.value || "";
    },
    setAttributeNS: function(namespaceURI, qualifiedName, value) {
      var attr2 = this.ownerDocument.createAttributeNS(namespaceURI, qualifiedName);
      attr2.value = attr2.nodeValue = "" + value;
      this.setAttributeNode(attr2);
    },
    getAttributeNodeNS: function(namespaceURI, localName) {
      return this.attributes.getNamedItemNS(namespaceURI, localName);
    },
    getElementsByTagName: function(tagName) {
      return new LiveNodeList(this, function(base) {
        var ls = [];
        _visitNode(base, function(node) {
          if (node !== base && node.nodeType == ELEMENT_NODE && (tagName === "*" || node.tagName == tagName)) {
            ls.push(node);
          }
        });
        return ls;
      });
    },
    getElementsByTagNameNS: function(namespaceURI, localName) {
      return new LiveNodeList(this, function(base) {
        var ls = [];
        _visitNode(base, function(node) {
          if (node !== base && node.nodeType === ELEMENT_NODE && (namespaceURI === "*" || node.namespaceURI === namespaceURI) && (localName === "*" || node.localName == localName)) {
            ls.push(node);
          }
        });
        return ls;
      });
    }
  };
  Document.prototype.getElementsByTagName = Element.prototype.getElementsByTagName;
  Document.prototype.getElementsByTagNameNS = Element.prototype.getElementsByTagNameNS;
  _extends(Element, Node);
  function Attr() {
  }
  Attr.prototype.nodeType = ATTRIBUTE_NODE;
  _extends(Attr, Node);
  function CharacterData() {
  }
  CharacterData.prototype = {
    data: "",
    substringData: function(offset, count) {
      return this.data.substring(offset, offset + count);
    },
    appendData: function(text2) {
      text2 = this.data + text2;
      this.nodeValue = this.data = text2;
      this.length = text2.length;
    },
    insertData: function(offset, text2) {
      this.replaceData(offset, 0, text2);
    },
    appendChild: function(newChild) {
      throw new Error(ExceptionMessage[HIERARCHY_REQUEST_ERR]);
    },
    deleteData: function(offset, count) {
      this.replaceData(offset, count, "");
    },
    replaceData: function(offset, count, text2) {
      var start = this.data.substring(0, offset);
      var end = this.data.substring(offset + count);
      text2 = start + text2 + end;
      this.nodeValue = this.data = text2;
      this.length = text2.length;
    }
  };
  _extends(CharacterData, Node);
  function Text() {
  }
  Text.prototype = {
    nodeName: "#text",
    nodeType: TEXT_NODE,
    splitText: function(offset) {
      var text2 = this.data;
      var newText = text2.substring(offset);
      text2 = text2.substring(0, offset);
      this.data = this.nodeValue = text2;
      this.length = text2.length;
      var newNode = this.ownerDocument.createTextNode(newText);
      if (this.parentNode) {
        this.parentNode.insertBefore(newNode, this.nextSibling);
      }
      return newNode;
    }
  };
  _extends(Text, CharacterData);
  function Comment() {
  }
  Comment.prototype = {
    nodeName: "#comment",
    nodeType: COMMENT_NODE
  };
  _extends(Comment, CharacterData);
  function CDATASection() {
  }
  CDATASection.prototype = {
    nodeName: "#cdata-section",
    nodeType: CDATA_SECTION_NODE
  };
  _extends(CDATASection, CharacterData);
  function DocumentType() {
  }
  DocumentType.prototype.nodeType = DOCUMENT_TYPE_NODE;
  _extends(DocumentType, Node);
  function Notation() {
  }
  Notation.prototype.nodeType = NOTATION_NODE;
  _extends(Notation, Node);
  function Entity() {
  }
  Entity.prototype.nodeType = ENTITY_NODE;
  _extends(Entity, Node);
  function EntityReference() {
  }
  EntityReference.prototype.nodeType = ENTITY_REFERENCE_NODE;
  _extends(EntityReference, Node);
  function DocumentFragment() {
  }
  DocumentFragment.prototype.nodeName = "#document-fragment";
  DocumentFragment.prototype.nodeType = DOCUMENT_FRAGMENT_NODE;
  _extends(DocumentFragment, Node);
  function ProcessingInstruction() {
  }
  ProcessingInstruction.prototype.nodeType = PROCESSING_INSTRUCTION_NODE;
  _extends(ProcessingInstruction, Node);
  function XMLSerializer() {
  }
  XMLSerializer.prototype.serializeToString = function(node, isHtml, nodeFilter) {
    return nodeSerializeToString.call(node, isHtml, nodeFilter);
  };
  Node.prototype.toString = nodeSerializeToString;
  function nodeSerializeToString(isHtml, nodeFilter) {
    var buf = [];
    var refNode = this.nodeType == 9 && this.documentElement || this;
    var prefix = refNode.prefix;
    var uri = refNode.namespaceURI;
    if (uri && prefix == null) {
      var prefix = refNode.lookupPrefix(uri);
      if (prefix == null) {
        var visibleNamespaces = [
          { namespace: uri, prefix: null }
        ];
      }
    }
    serializeToString(this, buf, isHtml, nodeFilter, visibleNamespaces);
    return buf.join("");
  }
  function needNamespaceDefine(node, isHTML, visibleNamespaces) {
    var prefix = node.prefix || "";
    var uri = node.namespaceURI;
    if (!uri) {
      return false;
    }
    if (prefix === "xml" && uri === NAMESPACE.XML || uri === NAMESPACE.XMLNS) {
      return false;
    }
    var i = visibleNamespaces.length;
    while (i--) {
      var ns = visibleNamespaces[i];
      if (ns.prefix === prefix) {
        return ns.namespace !== uri;
      }
    }
    return true;
  }
  function addSerializedAttribute(buf, qualifiedName, value) {
    buf.push(" ", qualifiedName, '="', value.replace(/[<&"]/g, _xmlEncoder), '"');
  }
  function serializeToString(node, buf, isHTML, nodeFilter, visibleNamespaces) {
    if (!visibleNamespaces) {
      visibleNamespaces = [];
    }
    if (nodeFilter) {
      node = nodeFilter(node);
      if (node) {
        if (typeof node == "string") {
          buf.push(node);
          return;
        }
      } else {
        return;
      }
    }
    switch (node.nodeType) {
      case ELEMENT_NODE:
        var attrs = node.attributes;
        var len = attrs.length;
        var child = node.firstChild;
        var nodeName = node.tagName;
        isHTML = NAMESPACE.isHTML(node.namespaceURI) || isHTML;
        var prefixedNodeName = nodeName;
        if (!isHTML && !node.prefix && node.namespaceURI) {
          var defaultNS;
          for (var ai = 0; ai < attrs.length; ai++) {
            if (attrs.item(ai).name === "xmlns") {
              defaultNS = attrs.item(ai).value;
              break;
            }
          }
          if (!defaultNS) {
            for (var nsi = visibleNamespaces.length - 1; nsi >= 0; nsi--) {
              var namespace = visibleNamespaces[nsi];
              if (namespace.prefix === "" && namespace.namespace === node.namespaceURI) {
                defaultNS = namespace.namespace;
                break;
              }
            }
          }
          if (defaultNS !== node.namespaceURI) {
            for (var nsi = visibleNamespaces.length - 1; nsi >= 0; nsi--) {
              var namespace = visibleNamespaces[nsi];
              if (namespace.namespace === node.namespaceURI) {
                if (namespace.prefix) {
                  prefixedNodeName = namespace.prefix + ":" + nodeName;
                }
                break;
              }
            }
          }
        }
        buf.push("<", prefixedNodeName);
        for (var i = 0; i < len; i++) {
          var attr2 = attrs.item(i);
          if (attr2.prefix == "xmlns") {
            visibleNamespaces.push({ prefix: attr2.localName, namespace: attr2.value });
          } else if (attr2.nodeName == "xmlns") {
            visibleNamespaces.push({ prefix: "", namespace: attr2.value });
          }
        }
        for (var i = 0; i < len; i++) {
          var attr2 = attrs.item(i);
          if (needNamespaceDefine(attr2, isHTML, visibleNamespaces)) {
            var prefix = attr2.prefix || "";
            var uri = attr2.namespaceURI;
            addSerializedAttribute(buf, prefix ? "xmlns:" + prefix : "xmlns", uri);
            visibleNamespaces.push({ prefix, namespace: uri });
          }
          serializeToString(attr2, buf, isHTML, nodeFilter, visibleNamespaces);
        }
        if (nodeName === prefixedNodeName && needNamespaceDefine(node, isHTML, visibleNamespaces)) {
          var prefix = node.prefix || "";
          var uri = node.namespaceURI;
          addSerializedAttribute(buf, prefix ? "xmlns:" + prefix : "xmlns", uri);
          visibleNamespaces.push({ prefix, namespace: uri });
        }
        if (child || isHTML && !/^(?:meta|link|img|br|hr|input)$/i.test(nodeName)) {
          buf.push(">");
          if (isHTML && /^script$/i.test(nodeName)) {
            while (child) {
              if (child.data) {
                buf.push(child.data);
              } else {
                serializeToString(child, buf, isHTML, nodeFilter, visibleNamespaces.slice());
              }
              child = child.nextSibling;
            }
          } else {
            while (child) {
              serializeToString(child, buf, isHTML, nodeFilter, visibleNamespaces.slice());
              child = child.nextSibling;
            }
          }
          buf.push("</", prefixedNodeName, ">");
        } else {
          buf.push("/>");
        }
        return;
      case DOCUMENT_NODE:
      case DOCUMENT_FRAGMENT_NODE:
        var child = node.firstChild;
        while (child) {
          serializeToString(child, buf, isHTML, nodeFilter, visibleNamespaces.slice());
          child = child.nextSibling;
        }
        return;
      case ATTRIBUTE_NODE:
        return addSerializedAttribute(buf, node.name, node.value);
      case TEXT_NODE:
        return buf.push(
          node.data.replace(/[<&]/g, _xmlEncoder).replace(/]]>/g, "]]&gt;")
        );
      case CDATA_SECTION_NODE:
        return buf.push("<![CDATA[", node.data, "]]>");
      case COMMENT_NODE:
        return buf.push("<!--", node.data, "-->");
      case DOCUMENT_TYPE_NODE:
        var pubid = node.publicId;
        var sysid = node.systemId;
        buf.push("<!DOCTYPE ", node.name);
        if (pubid) {
          buf.push(" PUBLIC ", pubid);
          if (sysid && sysid != ".") {
            buf.push(" ", sysid);
          }
          buf.push(">");
        } else if (sysid && sysid != ".") {
          buf.push(" SYSTEM ", sysid, ">");
        } else {
          var sub = node.internalSubset;
          if (sub) {
            buf.push(" [", sub, "]");
          }
          buf.push(">");
        }
        return;
      case PROCESSING_INSTRUCTION_NODE:
        return buf.push("<?", node.target, " ", node.data, "?>");
      case ENTITY_REFERENCE_NODE:
        return buf.push("&", node.nodeName, ";");
      default:
        buf.push("??", node.nodeName);
    }
  }
  function importNode(doc, node, deep) {
    var node2;
    switch (node.nodeType) {
      case ELEMENT_NODE:
        node2 = node.cloneNode(false);
        node2.ownerDocument = doc;
      case DOCUMENT_FRAGMENT_NODE:
        break;
      case ATTRIBUTE_NODE:
        deep = true;
        break;
    }
    if (!node2) {
      node2 = node.cloneNode(false);
    }
    node2.ownerDocument = doc;
    node2.parentNode = null;
    if (deep) {
      var child = node.firstChild;
      while (child) {
        node2.appendChild(importNode(doc, child, deep));
        child = child.nextSibling;
      }
    }
    return node2;
  }
  function cloneNode(doc, node, deep) {
    var node2 = new node.constructor();
    for (var n in node) {
      var v = node[n];
      if (typeof v != "object") {
        if (v != node2[n]) {
          node2[n] = v;
        }
      }
    }
    if (node.childNodes) {
      node2.childNodes = new NodeList();
    }
    node2.ownerDocument = doc;
    switch (node2.nodeType) {
      case ELEMENT_NODE:
        var attrs = node.attributes;
        var attrs2 = node2.attributes = new NamedNodeMap();
        var len = attrs.length;
        attrs2._ownerElement = node2;
        for (var i = 0; i < len; i++) {
          node2.setAttributeNode(cloneNode(doc, attrs.item(i), true));
        }
        break;
      case ATTRIBUTE_NODE:
        deep = true;
    }
    if (deep) {
      var child = node.firstChild;
      while (child) {
        node2.appendChild(cloneNode(doc, child, deep));
        child = child.nextSibling;
      }
    }
    return node2;
  }
  function __set__(object, key, value) {
    object[key] = value;
  }
  try {
    if (Object.defineProperty) {
      let getTextContent = function(node) {
        switch (node.nodeType) {
          case ELEMENT_NODE:
          case DOCUMENT_FRAGMENT_NODE:
            var buf = [];
            node = node.firstChild;
            while (node) {
              if (node.nodeType !== 7 && node.nodeType !== 8) {
                buf.push(getTextContent(node));
              }
              node = node.nextSibling;
            }
            return buf.join("");
          default:
            return node.nodeValue;
        }
      };
      Object.defineProperty(LiveNodeList.prototype, "length", {
        get: function() {
          _updateLiveList(this);
          return this.$$length;
        }
      });
      Object.defineProperty(Node.prototype, "textContent", {
        get: function() {
          return getTextContent(this);
        },
        set: function(data2) {
          switch (this.nodeType) {
            case ELEMENT_NODE:
            case DOCUMENT_FRAGMENT_NODE:
              while (this.firstChild) {
                this.removeChild(this.firstChild);
              }
              if (data2 || String(data2)) {
                this.appendChild(this.ownerDocument.createTextNode(data2));
              }
              break;
            default:
              this.data = data2;
              this.value = data2;
              this.nodeValue = data2;
          }
        }
      });
      __set__ = function(object, key, value) {
        object["$$" + key] = value;
      };
    }
  } catch (e) {
  }
  dom.DocumentType = DocumentType;
  dom.DOMException = DOMException;
  dom.DOMImplementation = DOMImplementation;
  dom.Element = Element;
  dom.Node = Node;
  dom.NodeList = NodeList;
  dom.XMLSerializer = XMLSerializer;
  return dom;
}
var domParser = {};
var entities = {};
var hasRequiredEntities;
function requireEntities() {
  if (hasRequiredEntities)
    return entities;
  hasRequiredEntities = 1;
  (function(exports) {
    var freeze = requireConventions().freeze;
    exports.XML_ENTITIES = freeze({ amp: "&", apos: "'", gt: ">", lt: "<", quot: '"' });
    exports.HTML_ENTITIES = freeze({
      lt: "<",
      gt: ">",
      amp: "&",
      quot: '"',
      apos: "'",
      Agrave: "\xC0",
      Aacute: "\xC1",
      Acirc: "\xC2",
      Atilde: "\xC3",
      Auml: "\xC4",
      Aring: "\xC5",
      AElig: "\xC6",
      Ccedil: "\xC7",
      Egrave: "\xC8",
      Eacute: "\xC9",
      Ecirc: "\xCA",
      Euml: "\xCB",
      Igrave: "\xCC",
      Iacute: "\xCD",
      Icirc: "\xCE",
      Iuml: "\xCF",
      ETH: "\xD0",
      Ntilde: "\xD1",
      Ograve: "\xD2",
      Oacute: "\xD3",
      Ocirc: "\xD4",
      Otilde: "\xD5",
      Ouml: "\xD6",
      Oslash: "\xD8",
      Ugrave: "\xD9",
      Uacute: "\xDA",
      Ucirc: "\xDB",
      Uuml: "\xDC",
      Yacute: "\xDD",
      THORN: "\xDE",
      szlig: "\xDF",
      agrave: "\xE0",
      aacute: "\xE1",
      acirc: "\xE2",
      atilde: "\xE3",
      auml: "\xE4",
      aring: "\xE5",
      aelig: "\xE6",
      ccedil: "\xE7",
      egrave: "\xE8",
      eacute: "\xE9",
      ecirc: "\xEA",
      euml: "\xEB",
      igrave: "\xEC",
      iacute: "\xED",
      icirc: "\xEE",
      iuml: "\xEF",
      eth: "\xF0",
      ntilde: "\xF1",
      ograve: "\xF2",
      oacute: "\xF3",
      ocirc: "\xF4",
      otilde: "\xF5",
      ouml: "\xF6",
      oslash: "\xF8",
      ugrave: "\xF9",
      uacute: "\xFA",
      ucirc: "\xFB",
      uuml: "\xFC",
      yacute: "\xFD",
      thorn: "\xFE",
      yuml: "\xFF",
      nbsp: "\xA0",
      iexcl: "\xA1",
      cent: "\xA2",
      pound: "\xA3",
      curren: "\xA4",
      yen: "\xA5",
      brvbar: "\xA6",
      sect: "\xA7",
      uml: "\xA8",
      copy: "\xA9",
      ordf: "\xAA",
      laquo: "\xAB",
      not: "\xAC",
      shy: "\xAD\xAD",
      reg: "\xAE",
      macr: "\xAF",
      deg: "\xB0",
      plusmn: "\xB1",
      sup2: "\xB2",
      sup3: "\xB3",
      acute: "\xB4",
      micro: "\xB5",
      para: "\xB6",
      middot: "\xB7",
      cedil: "\xB8",
      sup1: "\xB9",
      ordm: "\xBA",
      raquo: "\xBB",
      frac14: "\xBC",
      frac12: "\xBD",
      frac34: "\xBE",
      iquest: "\xBF",
      times: "\xD7",
      divide: "\xF7",
      forall: "\u2200",
      part: "\u2202",
      exist: "\u2203",
      empty: "\u2205",
      nabla: "\u2207",
      isin: "\u2208",
      notin: "\u2209",
      ni: "\u220B",
      prod: "\u220F",
      sum: "\u2211",
      minus: "\u2212",
      lowast: "\u2217",
      radic: "\u221A",
      prop: "\u221D",
      infin: "\u221E",
      ang: "\u2220",
      and: "\u2227",
      or: "\u2228",
      cap: "\u2229",
      cup: "\u222A",
      "int": "\u222B",
      there4: "\u2234",
      sim: "\u223C",
      cong: "\u2245",
      asymp: "\u2248",
      ne: "\u2260",
      equiv: "\u2261",
      le: "\u2264",
      ge: "\u2265",
      sub: "\u2282",
      sup: "\u2283",
      nsub: "\u2284",
      sube: "\u2286",
      supe: "\u2287",
      oplus: "\u2295",
      otimes: "\u2297",
      perp: "\u22A5",
      sdot: "\u22C5",
      Alpha: "\u0391",
      Beta: "\u0392",
      Gamma: "\u0393",
      Delta: "\u0394",
      Epsilon: "\u0395",
      Zeta: "\u0396",
      Eta: "\u0397",
      Theta: "\u0398",
      Iota: "\u0399",
      Kappa: "\u039A",
      Lambda: "\u039B",
      Mu: "\u039C",
      Nu: "\u039D",
      Xi: "\u039E",
      Omicron: "\u039F",
      Pi: "\u03A0",
      Rho: "\u03A1",
      Sigma: "\u03A3",
      Tau: "\u03A4",
      Upsilon: "\u03A5",
      Phi: "\u03A6",
      Chi: "\u03A7",
      Psi: "\u03A8",
      Omega: "\u03A9",
      alpha: "\u03B1",
      beta: "\u03B2",
      gamma: "\u03B3",
      delta: "\u03B4",
      epsilon: "\u03B5",
      zeta: "\u03B6",
      eta: "\u03B7",
      theta: "\u03B8",
      iota: "\u03B9",
      kappa: "\u03BA",
      lambda: "\u03BB",
      mu: "\u03BC",
      nu: "\u03BD",
      xi: "\u03BE",
      omicron: "\u03BF",
      pi: "\u03C0",
      rho: "\u03C1",
      sigmaf: "\u03C2",
      sigma: "\u03C3",
      tau: "\u03C4",
      upsilon: "\u03C5",
      phi: "\u03C6",
      chi: "\u03C7",
      psi: "\u03C8",
      omega: "\u03C9",
      thetasym: "\u03D1",
      upsih: "\u03D2",
      piv: "\u03D6",
      OElig: "\u0152",
      oelig: "\u0153",
      Scaron: "\u0160",
      scaron: "\u0161",
      Yuml: "\u0178",
      fnof: "\u0192",
      circ: "\u02C6",
      tilde: "\u02DC",
      ensp: "\u2002",
      emsp: "\u2003",
      thinsp: "\u2009",
      zwnj: "\u200C",
      zwj: "\u200D",
      lrm: "\u200E",
      rlm: "\u200F",
      ndash: "\u2013",
      mdash: "\u2014",
      lsquo: "\u2018",
      rsquo: "\u2019",
      sbquo: "\u201A",
      ldquo: "\u201C",
      rdquo: "\u201D",
      bdquo: "\u201E",
      dagger: "\u2020",
      Dagger: "\u2021",
      bull: "\u2022",
      hellip: "\u2026",
      permil: "\u2030",
      prime: "\u2032",
      Prime: "\u2033",
      lsaquo: "\u2039",
      rsaquo: "\u203A",
      oline: "\u203E",
      euro: "\u20AC",
      trade: "\u2122",
      larr: "\u2190",
      uarr: "\u2191",
      rarr: "\u2192",
      darr: "\u2193",
      harr: "\u2194",
      crarr: "\u21B5",
      lceil: "\u2308",
      rceil: "\u2309",
      lfloor: "\u230A",
      rfloor: "\u230B",
      loz: "\u25CA",
      spades: "\u2660",
      clubs: "\u2663",
      hearts: "\u2665",
      diams: "\u2666"
    });
    exports.entityMap = exports.HTML_ENTITIES;
  })(entities);
  return entities;
}
var sax = {};
var hasRequiredSax;
function requireSax() {
  if (hasRequiredSax)
    return sax;
  hasRequiredSax = 1;
  var NAMESPACE = requireConventions().NAMESPACE;
  var nameStartChar = /[A-Z_a-z\xC0-\xD6\xD8-\xF6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/;
  var nameChar = new RegExp("[\\-\\.0-9" + nameStartChar.source.slice(1, -1) + "\\u00B7\\u0300-\\u036F\\u203F-\\u2040]");
  var tagNamePattern = new RegExp("^" + nameStartChar.source + nameChar.source + "*(?::" + nameStartChar.source + nameChar.source + "*)?$");
  var S_TAG = 0;
  var S_ATTR = 1;
  var S_ATTR_SPACE = 2;
  var S_EQ = 3;
  var S_ATTR_NOQUOT_VALUE = 4;
  var S_ATTR_END = 5;
  var S_TAG_SPACE = 6;
  var S_TAG_CLOSE = 7;
  function ParseError(message, locator) {
    this.message = message;
    this.locator = locator;
    if (Error.captureStackTrace)
      Error.captureStackTrace(this, ParseError);
  }
  ParseError.prototype = new Error();
  ParseError.prototype.name = ParseError.name;
  function XMLReader() {
  }
  XMLReader.prototype = {
    parse: function(source, defaultNSMap, entityMap) {
      var domBuilder = this.domBuilder;
      domBuilder.startDocument();
      _copy(defaultNSMap, defaultNSMap = {});
      parse2(
        source,
        defaultNSMap,
        entityMap,
        domBuilder,
        this.errorHandler
      );
      domBuilder.endDocument();
    }
  };
  function parse2(source, defaultNSMapCopy, entityMap, domBuilder, errorHandler) {
    function fixedFromCharCode(code) {
      if (code > 65535) {
        code -= 65536;
        var surrogate1 = 55296 + (code >> 10), surrogate2 = 56320 + (code & 1023);
        return String.fromCharCode(surrogate1, surrogate2);
      } else {
        return String.fromCharCode(code);
      }
    }
    function entityReplacer(a2) {
      var k = a2.slice(1, -1);
      if (k in entityMap) {
        return entityMap[k];
      } else if (k.charAt(0) === "#") {
        return fixedFromCharCode(parseInt(k.substr(1).replace("x", "0x")));
      } else {
        errorHandler.error("entity not found:" + a2);
        return a2;
      }
    }
    function appendText(end2) {
      if (end2 > start) {
        var xt = source.substring(start, end2).replace(/&#?\w+;/g, entityReplacer);
        locator && position(start);
        domBuilder.characters(xt, 0, end2 - start);
        start = end2;
      }
    }
    function position(p, m) {
      while (p >= lineEnd && (m = linePattern.exec(source))) {
        lineStart = m.index;
        lineEnd = lineStart + m[0].length;
        locator.lineNumber++;
      }
      locator.columnNumber = p - lineStart + 1;
    }
    var lineStart = 0;
    var lineEnd = 0;
    var linePattern = /.*(?:\r\n?|\n)|.*$/g;
    var locator = domBuilder.locator;
    var parseStack = [{ currentNSMap: defaultNSMapCopy }];
    var closeMap = {};
    var start = 0;
    while (true) {
      try {
        var tagStart = source.indexOf("<", start);
        if (tagStart < 0) {
          if (!source.substr(start).match(/^\s*$/)) {
            var doc = domBuilder.doc;
            var text2 = doc.createTextNode(source.substr(start));
            doc.appendChild(text2);
            domBuilder.currentElement = text2;
          }
          return;
        }
        if (tagStart > start) {
          appendText(tagStart);
        }
        switch (source.charAt(tagStart + 1)) {
          case "/":
            var end = source.indexOf(">", tagStart + 3);
            var tagName = source.substring(tagStart + 2, end).replace(/[ \t\n\r]+$/g, "");
            var config = parseStack.pop();
            if (end < 0) {
              tagName = source.substring(tagStart + 2).replace(/[\s<].*/, "");
              errorHandler.error("end tag name: " + tagName + " is not complete:" + config.tagName);
              end = tagStart + 1 + tagName.length;
            } else if (tagName.match(/\s</)) {
              tagName = tagName.replace(/[\s<].*/, "");
              errorHandler.error("end tag name: " + tagName + " maybe not complete");
              end = tagStart + 1 + tagName.length;
            }
            var localNSMap = config.localNSMap;
            var endMatch = config.tagName == tagName;
            var endIgnoreCaseMach = endMatch || config.tagName && config.tagName.toLowerCase() == tagName.toLowerCase();
            if (endIgnoreCaseMach) {
              domBuilder.endElement(config.uri, config.localName, tagName);
              if (localNSMap) {
                for (var prefix in localNSMap) {
                  domBuilder.endPrefixMapping(prefix);
                }
              }
              if (!endMatch) {
                errorHandler.fatalError("end tag name: " + tagName + " is not match the current start tagName:" + config.tagName);
              }
            } else {
              parseStack.push(config);
            }
            end++;
            break;
          case "?":
            locator && position(tagStart);
            end = parseInstruction(source, tagStart, domBuilder);
            break;
          case "!":
            locator && position(tagStart);
            end = parseDCC(source, tagStart, domBuilder, errorHandler);
            break;
          default:
            locator && position(tagStart);
            var el = new ElementAttributes();
            var currentNSMap = parseStack[parseStack.length - 1].currentNSMap;
            var end = parseElementStartPart(source, tagStart, el, currentNSMap, entityReplacer, errorHandler);
            var len = el.length;
            if (!el.closed && fixSelfClosed(source, end, el.tagName, closeMap)) {
              el.closed = true;
              if (!entityMap.nbsp) {
                errorHandler.warning("unclosed xml attribute");
              }
            }
            if (locator && len) {
              var locator2 = copyLocator(locator, {});
              for (var i = 0; i < len; i++) {
                var a = el[i];
                position(a.offset);
                a.locator = copyLocator(locator, {});
              }
              domBuilder.locator = locator2;
              if (appendElement(el, domBuilder, currentNSMap)) {
                parseStack.push(el);
              }
              domBuilder.locator = locator;
            } else {
              if (appendElement(el, domBuilder, currentNSMap)) {
                parseStack.push(el);
              }
            }
            if (NAMESPACE.isHTML(el.uri) && !el.closed) {
              end = parseHtmlSpecialContent(source, end, el.tagName, entityReplacer, domBuilder);
            } else {
              end++;
            }
        }
      } catch (e) {
        if (e instanceof ParseError) {
          throw e;
        }
        errorHandler.error("element parse error: " + e);
        end = -1;
      }
      if (end > start) {
        start = end;
      } else {
        appendText(Math.max(tagStart, start) + 1);
      }
    }
  }
  function copyLocator(f, t) {
    t.lineNumber = f.lineNumber;
    t.columnNumber = f.columnNumber;
    return t;
  }
  function parseElementStartPart(source, start, el, currentNSMap, entityReplacer, errorHandler) {
    function addAttribute(qname, value2, startIndex) {
      if (el.attributeNames.hasOwnProperty(qname)) {
        errorHandler.fatalError("Attribute " + qname + " redefined");
      }
      el.addValue(qname, value2, startIndex);
    }
    var attrName;
    var value;
    var p = ++start;
    var s = S_TAG;
    while (true) {
      var c = source.charAt(p);
      switch (c) {
        case "=":
          if (s === S_ATTR) {
            attrName = source.slice(start, p);
            s = S_EQ;
          } else if (s === S_ATTR_SPACE) {
            s = S_EQ;
          } else {
            throw new Error("attribute equal must after attrName");
          }
          break;
        case "'":
        case '"':
          if (s === S_EQ || s === S_ATTR) {
            if (s === S_ATTR) {
              errorHandler.warning('attribute value must after "="');
              attrName = source.slice(start, p);
            }
            start = p + 1;
            p = source.indexOf(c, start);
            if (p > 0) {
              value = source.slice(start, p).replace(/&#?\w+;/g, entityReplacer);
              addAttribute(attrName, value, start - 1);
              s = S_ATTR_END;
            } else {
              throw new Error("attribute value no end '" + c + "' match");
            }
          } else if (s == S_ATTR_NOQUOT_VALUE) {
            value = source.slice(start, p).replace(/&#?\w+;/g, entityReplacer);
            addAttribute(attrName, value, start);
            errorHandler.warning('attribute "' + attrName + '" missed start quot(' + c + ")!!");
            start = p + 1;
            s = S_ATTR_END;
          } else {
            throw new Error('attribute value must after "="');
          }
          break;
        case "/":
          switch (s) {
            case S_TAG:
              el.setTagName(source.slice(start, p));
            case S_ATTR_END:
            case S_TAG_SPACE:
            case S_TAG_CLOSE:
              s = S_TAG_CLOSE;
              el.closed = true;
            case S_ATTR_NOQUOT_VALUE:
            case S_ATTR:
            case S_ATTR_SPACE:
              break;
            default:
              throw new Error("attribute invalid close char('/')");
          }
          break;
        case "":
          errorHandler.error("unexpected end of input");
          if (s == S_TAG) {
            el.setTagName(source.slice(start, p));
          }
          return p;
        case ">":
          switch (s) {
            case S_TAG:
              el.setTagName(source.slice(start, p));
            case S_ATTR_END:
            case S_TAG_SPACE:
            case S_TAG_CLOSE:
              break;
            case S_ATTR_NOQUOT_VALUE:
            case S_ATTR:
              value = source.slice(start, p);
              if (value.slice(-1) === "/") {
                el.closed = true;
                value = value.slice(0, -1);
              }
            case S_ATTR_SPACE:
              if (s === S_ATTR_SPACE) {
                value = attrName;
              }
              if (s == S_ATTR_NOQUOT_VALUE) {
                errorHandler.warning('attribute "' + value + '" missed quot(")!');
                addAttribute(attrName, value.replace(/&#?\w+;/g, entityReplacer), start);
              } else {
                if (!NAMESPACE.isHTML(currentNSMap[""]) || !value.match(/^(?:disabled|checked|selected)$/i)) {
                  errorHandler.warning('attribute "' + value + '" missed value!! "' + value + '" instead!!');
                }
                addAttribute(value, value, start);
              }
              break;
            case S_EQ:
              throw new Error("attribute value missed!!");
          }
          return p;
        case "\x80":
          c = " ";
        default:
          if (c <= " ") {
            switch (s) {
              case S_TAG:
                el.setTagName(source.slice(start, p));
                s = S_TAG_SPACE;
                break;
              case S_ATTR:
                attrName = source.slice(start, p);
                s = S_ATTR_SPACE;
                break;
              case S_ATTR_NOQUOT_VALUE:
                var value = source.slice(start, p).replace(/&#?\w+;/g, entityReplacer);
                errorHandler.warning('attribute "' + value + '" missed quot(")!!');
                addAttribute(attrName, value, start);
              case S_ATTR_END:
                s = S_TAG_SPACE;
                break;
            }
          } else {
            switch (s) {
              case S_ATTR_SPACE:
                el.tagName;
                if (!NAMESPACE.isHTML(currentNSMap[""]) || !attrName.match(/^(?:disabled|checked|selected)$/i)) {
                  errorHandler.warning('attribute "' + attrName + '" missed value!! "' + attrName + '" instead2!!');
                }
                addAttribute(attrName, attrName, start);
                start = p;
                s = S_ATTR;
                break;
              case S_ATTR_END:
                errorHandler.warning('attribute space is required"' + attrName + '"!!');
              case S_TAG_SPACE:
                s = S_ATTR;
                start = p;
                break;
              case S_EQ:
                s = S_ATTR_NOQUOT_VALUE;
                start = p;
                break;
              case S_TAG_CLOSE:
                throw new Error("elements closed character '/' and '>' must be connected to");
            }
          }
      }
      p++;
    }
  }
  function appendElement(el, domBuilder, currentNSMap) {
    var tagName = el.tagName;
    var localNSMap = null;
    var i = el.length;
    while (i--) {
      var a = el[i];
      var qName = a.qName;
      var value = a.value;
      var nsp = qName.indexOf(":");
      if (nsp > 0) {
        var prefix = a.prefix = qName.slice(0, nsp);
        var localName = qName.slice(nsp + 1);
        var nsPrefix = prefix === "xmlns" && localName;
      } else {
        localName = qName;
        prefix = null;
        nsPrefix = qName === "xmlns" && "";
      }
      a.localName = localName;
      if (nsPrefix !== false) {
        if (localNSMap == null) {
          localNSMap = {};
          _copy(currentNSMap, currentNSMap = {});
        }
        currentNSMap[nsPrefix] = localNSMap[nsPrefix] = value;
        a.uri = NAMESPACE.XMLNS;
        domBuilder.startPrefixMapping(nsPrefix, value);
      }
    }
    var i = el.length;
    while (i--) {
      a = el[i];
      var prefix = a.prefix;
      if (prefix) {
        if (prefix === "xml") {
          a.uri = NAMESPACE.XML;
        }
        if (prefix !== "xmlns") {
          a.uri = currentNSMap[prefix || ""];
        }
      }
    }
    var nsp = tagName.indexOf(":");
    if (nsp > 0) {
      prefix = el.prefix = tagName.slice(0, nsp);
      localName = el.localName = tagName.slice(nsp + 1);
    } else {
      prefix = null;
      localName = el.localName = tagName;
    }
    var ns = el.uri = currentNSMap[prefix || ""];
    domBuilder.startElement(ns, localName, tagName, el);
    if (el.closed) {
      domBuilder.endElement(ns, localName, tagName);
      if (localNSMap) {
        for (prefix in localNSMap) {
          domBuilder.endPrefixMapping(prefix);
        }
      }
    } else {
      el.currentNSMap = currentNSMap;
      el.localNSMap = localNSMap;
      return true;
    }
  }
  function parseHtmlSpecialContent(source, elStartEnd, tagName, entityReplacer, domBuilder) {
    if (/^(?:script|textarea)$/i.test(tagName)) {
      var elEndStart = source.indexOf("</" + tagName + ">", elStartEnd);
      var text2 = source.substring(elStartEnd + 1, elEndStart);
      if (/[&<]/.test(text2)) {
        if (/^script$/i.test(tagName)) {
          domBuilder.characters(text2, 0, text2.length);
          return elEndStart;
        }
        text2 = text2.replace(/&#?\w+;/g, entityReplacer);
        domBuilder.characters(text2, 0, text2.length);
        return elEndStart;
      }
    }
    return elStartEnd + 1;
  }
  function fixSelfClosed(source, elStartEnd, tagName, closeMap) {
    var pos = closeMap[tagName];
    if (pos == null) {
      pos = source.lastIndexOf("</" + tagName + ">");
      if (pos < elStartEnd) {
        pos = source.lastIndexOf("</" + tagName);
      }
      closeMap[tagName] = pos;
    }
    return pos < elStartEnd;
  }
  function _copy(source, target) {
    for (var n in source) {
      target[n] = source[n];
    }
  }
  function parseDCC(source, start, domBuilder, errorHandler) {
    var next = source.charAt(start + 2);
    switch (next) {
      case "-":
        if (source.charAt(start + 3) === "-") {
          var end = source.indexOf("-->", start + 4);
          if (end > start) {
            domBuilder.comment(source, start + 4, end - start - 4);
            return end + 3;
          } else {
            errorHandler.error("Unclosed comment");
            return -1;
          }
        } else {
          return -1;
        }
      default:
        if (source.substr(start + 3, 6) == "CDATA[") {
          var end = source.indexOf("]]>", start + 9);
          domBuilder.startCDATA();
          domBuilder.characters(source, start + 9, end - start - 9);
          domBuilder.endCDATA();
          return end + 3;
        }
        var matchs = split(source, start);
        var len = matchs.length;
        if (len > 1 && /!doctype/i.test(matchs[0][0])) {
          var name = matchs[1][0];
          var pubid = false;
          var sysid = false;
          if (len > 3) {
            if (/^public$/i.test(matchs[2][0])) {
              pubid = matchs[3][0];
              sysid = len > 4 && matchs[4][0];
            } else if (/^system$/i.test(matchs[2][0])) {
              sysid = matchs[3][0];
            }
          }
          var lastMatch = matchs[len - 1];
          domBuilder.startDTD(name, pubid, sysid);
          domBuilder.endDTD();
          return lastMatch.index + lastMatch[0].length;
        }
    }
    return -1;
  }
  function parseInstruction(source, start, domBuilder) {
    var end = source.indexOf("?>", start);
    if (end) {
      var match2 = source.substring(start, end).match(/^<\?(\S*)\s*([\s\S]*?)\s*$/);
      if (match2) {
        match2[0].length;
        domBuilder.processingInstruction(match2[1], match2[2]);
        return end + 2;
      } else {
        return -1;
      }
    }
    return -1;
  }
  function ElementAttributes() {
    this.attributeNames = {};
  }
  ElementAttributes.prototype = {
    setTagName: function(tagName) {
      if (!tagNamePattern.test(tagName)) {
        throw new Error("invalid tagName:" + tagName);
      }
      this.tagName = tagName;
    },
    addValue: function(qName, value, offset) {
      if (!tagNamePattern.test(qName)) {
        throw new Error("invalid attribute:" + qName);
      }
      this.attributeNames[qName] = this.length;
      this[this.length++] = { qName, value, offset };
    },
    length: 0,
    getLocalName: function(i) {
      return this[i].localName;
    },
    getLocator: function(i) {
      return this[i].locator;
    },
    getQName: function(i) {
      return this[i].qName;
    },
    getURI: function(i) {
      return this[i].uri;
    },
    getValue: function(i) {
      return this[i].value;
    }
  };
  function split(source, start) {
    var match2;
    var buf = [];
    var reg = /'[^']+'|"[^"]+"|[^\s<>\/=]+=?|(\/?\s*>|<)/g;
    reg.lastIndex = start;
    reg.exec(source);
    while (match2 = reg.exec(source)) {
      buf.push(match2);
      if (match2[1])
        return buf;
    }
  }
  sax.XMLReader = XMLReader;
  sax.ParseError = ParseError;
  return sax;
}
var hasRequiredDomParser;
function requireDomParser() {
  if (hasRequiredDomParser)
    return domParser;
  hasRequiredDomParser = 1;
  var conventions2 = requireConventions();
  var dom2 = requireDom();
  var entities2 = requireEntities();
  var sax2 = requireSax();
  var DOMImplementation = dom2.DOMImplementation;
  var NAMESPACE = conventions2.NAMESPACE;
  var ParseError = sax2.ParseError;
  var XMLReader = sax2.XMLReader;
  function DOMParser(options) {
    this.options = options || { locator: {} };
  }
  DOMParser.prototype.parseFromString = function(source, mimeType) {
    var options = this.options;
    var sax3 = new XMLReader();
    var domBuilder = options.domBuilder || new DOMHandler();
    var errorHandler = options.errorHandler;
    var locator = options.locator;
    var defaultNSMap = options.xmlns || {};
    var isHTML = /\/x?html?$/.test(mimeType);
    var entityMap = isHTML ? entities2.HTML_ENTITIES : entities2.XML_ENTITIES;
    if (locator) {
      domBuilder.setDocumentLocator(locator);
    }
    sax3.errorHandler = buildErrorHandler(errorHandler, domBuilder, locator);
    sax3.domBuilder = options.domBuilder || domBuilder;
    if (isHTML) {
      defaultNSMap[""] = NAMESPACE.HTML;
    }
    defaultNSMap.xml = defaultNSMap.xml || NAMESPACE.XML;
    if (source && typeof source === "string") {
      sax3.parse(source, defaultNSMap, entityMap);
    } else {
      sax3.errorHandler.error("invalid doc source");
    }
    return domBuilder.doc;
  };
  function buildErrorHandler(errorImpl, domBuilder, locator) {
    if (!errorImpl) {
      if (domBuilder instanceof DOMHandler) {
        return domBuilder;
      }
      errorImpl = domBuilder;
    }
    var errorHandler = {};
    var isCallback = errorImpl instanceof Function;
    locator = locator || {};
    function build(key) {
      var fn = errorImpl[key];
      if (!fn && isCallback) {
        fn = errorImpl.length == 2 ? function(msg) {
          errorImpl(key, msg);
        } : errorImpl;
      }
      errorHandler[key] = fn && function(msg) {
        fn("[xmldom " + key + "]	" + msg + _locator(locator));
      } || function() {
      };
    }
    build("warning");
    build("error");
    build("fatalError");
    return errorHandler;
  }
  function DOMHandler() {
    this.cdata = false;
  }
  function position(locator, node) {
    node.lineNumber = locator.lineNumber;
    node.columnNumber = locator.columnNumber;
  }
  DOMHandler.prototype = {
    startDocument: function() {
      this.doc = new DOMImplementation().createDocument(null, null, null);
      if (this.locator) {
        this.doc.documentURI = this.locator.systemId;
      }
    },
    startElement: function(namespaceURI, localName, qName, attrs) {
      var doc = this.doc;
      var el = doc.createElementNS(namespaceURI, qName || localName);
      var len = attrs.length;
      appendElement(this, el);
      this.currentElement = el;
      this.locator && position(this.locator, el);
      for (var i = 0; i < len; i++) {
        var namespaceURI = attrs.getURI(i);
        var value = attrs.getValue(i);
        var qName = attrs.getQName(i);
        var attr2 = doc.createAttributeNS(namespaceURI, qName);
        this.locator && position(attrs.getLocator(i), attr2);
        attr2.value = attr2.nodeValue = value;
        el.setAttributeNode(attr2);
      }
    },
    endElement: function(namespaceURI, localName, qName) {
      var current = this.currentElement;
      current.tagName;
      this.currentElement = current.parentNode;
    },
    startPrefixMapping: function(prefix, uri) {
    },
    endPrefixMapping: function(prefix) {
    },
    processingInstruction: function(target, data2) {
      var ins = this.doc.createProcessingInstruction(target, data2);
      this.locator && position(this.locator, ins);
      appendElement(this, ins);
    },
    ignorableWhitespace: function(ch, start, length) {
    },
    characters: function(chars, start, length) {
      chars = _toString.apply(this, arguments);
      if (chars) {
        if (this.cdata) {
          var charNode = this.doc.createCDATASection(chars);
        } else {
          var charNode = this.doc.createTextNode(chars);
        }
        if (this.currentElement) {
          this.currentElement.appendChild(charNode);
        } else if (/^\s*$/.test(chars)) {
          this.doc.appendChild(charNode);
        }
        this.locator && position(this.locator, charNode);
      }
    },
    skippedEntity: function(name) {
    },
    endDocument: function() {
      this.doc.normalize();
    },
    setDocumentLocator: function(locator) {
      if (this.locator = locator) {
        locator.lineNumber = 0;
      }
    },
    comment: function(chars, start, length) {
      chars = _toString.apply(this, arguments);
      var comm = this.doc.createComment(chars);
      this.locator && position(this.locator, comm);
      appendElement(this, comm);
    },
    startCDATA: function() {
      this.cdata = true;
    },
    endCDATA: function() {
      this.cdata = false;
    },
    startDTD: function(name, publicId, systemId) {
      var impl = this.doc.implementation;
      if (impl && impl.createDocumentType) {
        var dt = impl.createDocumentType(name, publicId, systemId);
        this.locator && position(this.locator, dt);
        appendElement(this, dt);
        this.doc.doctype = dt;
      }
    },
    warning: function(error2) {
      console.warn("[xmldom warning]	" + error2, _locator(this.locator));
    },
    error: function(error2) {
      console.error("[xmldom error]	" + error2, _locator(this.locator));
    },
    fatalError: function(error2) {
      throw new ParseError(error2, this.locator);
    }
  };
  function _locator(l) {
    if (l) {
      return "\n@" + (l.systemId || "") + "#[line:" + l.lineNumber + ",col:" + l.columnNumber + "]";
    }
  }
  function _toString(chars, start, length) {
    if (typeof chars == "string") {
      return chars.substr(start, length);
    } else {
      if (chars.length >= start + length || start) {
        return new java.lang.String(chars, start, length) + "";
      }
      return chars;
    }
  }
  "endDTD,startEntity,endEntity,attributeDecl,elementDecl,externalEntityDecl,internalEntityDecl,resolveEntity,getExternalSubset,notationDecl,unparsedEntityDecl".replace(/\w+/g, function(key) {
    DOMHandler.prototype[key] = function() {
      return null;
    };
  });
  function appendElement(hander, node) {
    if (!hander.currentElement) {
      hander.doc.appendChild(node);
    } else {
      hander.currentElement.appendChild(node);
    }
  }
  domParser.__DOMHandler = DOMHandler;
  domParser.DOMParser = DOMParser;
  domParser.DOMImplementation = dom2.DOMImplementation;
  domParser.XMLSerializer = dom2.XMLSerializer;
  return domParser;
}
var hasRequiredLib;
function requireLib() {
  if (hasRequiredLib)
    return lib$1;
  hasRequiredLib = 1;
  var dom2 = requireDom();
  lib$1.DOMImplementation = dom2.DOMImplementation;
  lib$1.XMLSerializer = dom2.XMLSerializer;
  lib$1.DOMParser = requireDomParser().DOMParser;
  return lib$1;
}
var parseJson = {};
var hasRequiredParseJson;
function requireParseJson() {
  if (hasRequiredParseJson)
    return parseJson;
  hasRequiredParseJson = 1;
  Object.defineProperty(parseJson, "__esModule", { value: true });
  parseJson.parseJson = void 0;
  function parseJson$1(data2) {
    try {
      var json2 = JSON.parse(data2);
      return json2;
    } catch (_) {
      return null;
    }
  }
  parseJson.parseJson = parseJson$1;
  return parseJson;
}
var bufferFrom = {};
var hasRequiredBufferFrom;
function requireBufferFrom() {
  if (hasRequiredBufferFrom)
    return bufferFrom;
  hasRequiredBufferFrom = 1;
  Object.defineProperty(bufferFrom, "__esModule", { value: true });
  bufferFrom.bufferFrom = void 0;
  function bufferFrom$1(init2) {
    var encodedString = encodeURIComponent(init2);
    var binaryString = encodedString.replace(/%([0-9A-F]{2})/g, function(_, char) {
      return String.fromCharCode("0x" + char);
    });
    var buffer = new Uint8Array(binaryString.length);
    Array.prototype.forEach.call(binaryString, function(char, index) {
      buffer[index] = char.charCodeAt(0);
    });
    return buffer;
  }
  bufferFrom.bufferFrom = bufferFrom$1;
  return bufferFrom;
}
var createEvent = {};
var EventPolyfill = {};
var hasRequiredEventPolyfill;
function requireEventPolyfill() {
  if (hasRequiredEventPolyfill)
    return EventPolyfill;
  hasRequiredEventPolyfill = 1;
  Object.defineProperty(EventPolyfill, "__esModule", { value: true });
  EventPolyfill.EventPolyfill = void 0;
  var EventPolyfill$1 = function() {
    function EventPolyfill2(type, options) {
      this.AT_TARGET = 0;
      this.BUBBLING_PHASE = 0;
      this.CAPTURING_PHASE = 0;
      this.NONE = 0;
      this.type = "";
      this.srcElement = null;
      this.currentTarget = null;
      this.eventPhase = 0;
      this.isTrusted = true;
      this.composed = false;
      this.cancelable = true;
      this.defaultPrevented = false;
      this.bubbles = true;
      this.lengthComputable = true;
      this.loaded = 0;
      this.total = 0;
      this.cancelBubble = false;
      this.returnValue = true;
      this.type = type;
      this.target = (options === null || options === void 0 ? void 0 : options.target) || null;
      this.currentTarget = (options === null || options === void 0 ? void 0 : options.currentTarget) || null;
      this.timeStamp = Date.now();
    }
    EventPolyfill2.prototype.composedPath = function() {
      return [];
    };
    EventPolyfill2.prototype.initEvent = function(type, bubbles, cancelable) {
      this.type = type;
      this.bubbles = !!bubbles;
      this.cancelable = !!cancelable;
    };
    EventPolyfill2.prototype.preventDefault = function() {
      this.defaultPrevented = true;
    };
    EventPolyfill2.prototype.stopPropagation = function() {
    };
    EventPolyfill2.prototype.stopImmediatePropagation = function() {
    };
    return EventPolyfill2;
  }();
  EventPolyfill.EventPolyfill = EventPolyfill$1;
  return EventPolyfill;
}
var ProgressEventPolyfill = {};
var hasRequiredProgressEventPolyfill;
function requireProgressEventPolyfill() {
  if (hasRequiredProgressEventPolyfill)
    return ProgressEventPolyfill;
  hasRequiredProgressEventPolyfill = 1;
  var __extends2 = commonjsGlobal && commonjsGlobal.__extends || function() {
    var extendStatics = function(d, b) {
      extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
        d2.__proto__ = b2;
      } || function(d2, b2) {
        for (var p in b2)
          if (Object.prototype.hasOwnProperty.call(b2, p))
            d2[p] = b2[p];
      };
      return extendStatics(d, b);
    };
    return function(d, b) {
      if (typeof b !== "function" && b !== null)
        throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
  }();
  Object.defineProperty(ProgressEventPolyfill, "__esModule", { value: true });
  ProgressEventPolyfill.ProgressEventPolyfill = void 0;
  var EventPolyfill_1 = requireEventPolyfill();
  var ProgressEventPolyfill$1 = function(_super) {
    __extends2(ProgressEventPolyfill2, _super);
    function ProgressEventPolyfill2(type, init2) {
      var _this = _super.call(this, type) || this;
      _this.lengthComputable = (init2 === null || init2 === void 0 ? void 0 : init2.lengthComputable) || false;
      _this.composed = (init2 === null || init2 === void 0 ? void 0 : init2.composed) || false;
      _this.loaded = (init2 === null || init2 === void 0 ? void 0 : init2.loaded) || 0;
      _this.total = (init2 === null || init2 === void 0 ? void 0 : init2.total) || 0;
      return _this;
    }
    return ProgressEventPolyfill2;
  }(EventPolyfill_1.EventPolyfill);
  ProgressEventPolyfill.ProgressEventPolyfill = ProgressEventPolyfill$1;
  return ProgressEventPolyfill;
}
var hasRequiredCreateEvent;
function requireCreateEvent() {
  if (hasRequiredCreateEvent)
    return createEvent;
  hasRequiredCreateEvent = 1;
  Object.defineProperty(createEvent, "__esModule", { value: true });
  createEvent.createEvent = void 0;
  var EventPolyfill_1 = requireEventPolyfill();
  var ProgressEventPolyfill_1 = requireProgressEventPolyfill();
  var SUPPORTS_PROGRESS_EVENT = typeof ProgressEvent !== "undefined";
  function createEvent$1(target, type, init2) {
    var progressEvents = [
      "error",
      "progress",
      "loadstart",
      "loadend",
      "load",
      "timeout",
      "abort"
    ];
    var ProgressEventClass = SUPPORTS_PROGRESS_EVENT ? ProgressEvent : ProgressEventPolyfill_1.ProgressEventPolyfill;
    var event = progressEvents.includes(type) ? new ProgressEventClass(type, {
      lengthComputable: true,
      loaded: (init2 === null || init2 === void 0 ? void 0 : init2.loaded) || 0,
      total: (init2 === null || init2 === void 0 ? void 0 : init2.total) || 0
    }) : new EventPolyfill_1.EventPolyfill(type, {
      target,
      currentTarget: target
    });
    return event;
  }
  createEvent.createEvent = createEvent$1;
  return createEvent;
}
var hasRequiredXMLHttpRequestOverride;
function requireXMLHttpRequestOverride() {
  if (hasRequiredXMLHttpRequestOverride)
    return XMLHttpRequestOverride;
  hasRequiredXMLHttpRequestOverride = 1;
  var __awaiter2 = commonjsGlobal && commonjsGlobal.__awaiter || function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve) {
        resolve(value);
      });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
  var __generator2 = commonjsGlobal && commonjsGlobal.__generator || function(thisArg, body2) {
    var _ = { label: 0, sent: function() {
      if (t[0] & 1)
        throw t[1];
      return t[1];
    }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
      return this;
    }), g;
    function verb(n) {
      return function(v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f)
        throw new TypeError("Generator is already executing.");
      while (_)
        try {
          if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done)
            return t;
          if (y = 0, t)
            op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2])
                _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body2.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5)
        throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
  var __values2 = commonjsGlobal && commonjsGlobal.__values || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m)
      return m.call(o);
    if (o && typeof o.length === "number")
      return {
        next: function() {
          if (o && i >= o.length)
            o = void 0;
          return { value: o && o[i++], done: !o };
        }
      };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
  };
  var __read2 = commonjsGlobal && commonjsGlobal.__read || function(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m)
      return o;
    var i = m.call(o), r, ar = [], e;
    try {
      while ((n === void 0 || n-- > 0) && !(r = i.next()).done)
        ar.push(r.value);
    } catch (error2) {
      e = { error: error2 };
    } finally {
      try {
        if (r && !r.done && (m = i["return"]))
          m.call(i);
      } finally {
        if (e)
          throw e.error;
      }
    }
    return ar;
  };
  Object.defineProperty(XMLHttpRequestOverride, "__esModule", { value: true });
  XMLHttpRequestOverride.createXMLHttpRequestOverride = void 0;
  var until_12 = lib$6;
  var headers_polyfill_1 = lib$9;
  var xmldom_1 = requireLib();
  var parseJson_1 = requireParseJson();
  var toIsoResponse_1 = requireToIsoResponse();
  var bufferFrom_1 = requireBufferFrom();
  var createEvent_1 = requireCreateEvent();
  var IsomorphicRequest_12 = IsomorphicRequest$1;
  var bufferUtils_12 = bufferUtils;
  var InteractiveIsomorphicRequest_1 = InteractiveIsomorphicRequest$1;
  var createXMLHttpRequestOverride = function(options) {
    var _a2;
    var XMLHttpRequest2 = options.XMLHttpRequest, emitter = options.emitter, log = options.log;
    return _a2 = function() {
      function XMLHttpRequestOverride2() {
        this._events = [];
        this.log = log;
        this.UNSENT = 0;
        this.OPENED = 1;
        this.HEADERS_RECEIVED = 2;
        this.LOADING = 3;
        this.DONE = 4;
        this.onreadystatechange = null;
        this.onabort = null;
        this.onerror = null;
        this.onload = null;
        this.onloadend = null;
        this.onloadstart = null;
        this.onprogress = null;
        this.ontimeout = null;
        this.url = "";
        this.method = "GET";
        this.readyState = this.UNSENT;
        this.withCredentials = false;
        this.status = 200;
        this.statusText = "OK";
        this.response = "";
        this.responseType = "text";
        this.responseText = "";
        this.responseXML = null;
        this.responseURL = "";
        this.upload = {};
        this.timeout = 0;
        this._requestHeaders = new headers_polyfill_1.Headers();
        this._responseHeaders = new headers_polyfill_1.Headers();
      }
      XMLHttpRequestOverride2.prototype.setReadyState = function(nextState) {
        if (nextState === this.readyState) {
          return;
        }
        this.log("readyState change %d -> %d", this.readyState, nextState);
        this.readyState = nextState;
        if (nextState !== this.UNSENT) {
          this.log("triggering readystate change...");
          this.trigger("readystatechange");
        }
      };
      XMLHttpRequestOverride2.prototype.trigger = function(eventName, options2) {
        var e_1, _a3;
        this.log('trigger "%s" (%d)', eventName, this.readyState);
        this.log('resolve listener for event "%s"', eventName);
        var callback = this["on" + eventName];
        callback === null || callback === void 0 ? void 0 : callback.call(this, createEvent_1.createEvent(this, eventName, options2));
        try {
          for (var _b2 = __values2(this._events), _c = _b2.next(); !_c.done; _c = _b2.next()) {
            var event_1 = _c.value;
            if (event_1.name === eventName) {
              log('calling mock event listener "%s" (%d)', eventName, this.readyState);
              event_1.listener.call(this, createEvent_1.createEvent(this, eventName, options2));
            }
          }
        } catch (e_1_1) {
          e_1 = { error: e_1_1 };
        } finally {
          try {
            if (_c && !_c.done && (_a3 = _b2.return))
              _a3.call(_b2);
          } finally {
            if (e_1)
              throw e_1.error;
          }
        }
        return this;
      };
      XMLHttpRequestOverride2.prototype.reset = function() {
        this.log("reset");
        this.setReadyState(this.UNSENT);
        this.status = 200;
        this.statusText = "OK";
        this.response = null;
        this.responseText = null;
        this.responseXML = null;
        this._requestHeaders = new headers_polyfill_1.Headers();
        this._responseHeaders = new headers_polyfill_1.Headers();
      };
      XMLHttpRequestOverride2.prototype.open = function(method, url, async, user, password) {
        if (async === void 0) {
          async = true;
        }
        return __awaiter2(this, void 0, void 0, function() {
          return __generator2(this, function(_a3) {
            this.log = this.log.extend("request " + method + " " + url);
            this.log("open", { method, url, async, user, password });
            this.reset();
            this.setReadyState(this.OPENED);
            if (typeof url === "undefined") {
              this.url = method;
              this.method = "GET";
            } else {
              this.url = url;
              this.method = method;
              this.async = async;
              this.user = user;
              this.password = password;
            }
            return [2];
          });
        });
      };
      XMLHttpRequestOverride2.prototype.send = function(data2) {
        var _this = this;
        this.log("send %s %s", this.method, this.url);
        var buffer;
        if (typeof data2 === "string") {
          buffer = bufferUtils_12.encodeBuffer(data2);
        } else {
          buffer = data2 || new ArrayBuffer(0);
        }
        var url;
        try {
          url = new URL(this.url);
        } catch (error2) {
          url = new URL(this.url, window.location.href);
        }
        this.log("request headers", this._requestHeaders);
        var isomorphicRequest = new IsomorphicRequest_12.IsomorphicRequest(url, {
          body: buffer,
          method: this.method,
          headers: this._requestHeaders,
          credentials: this.withCredentials ? "include" : "omit"
        });
        var interactiveIsomorphicRequest = new InteractiveIsomorphicRequest_1.InteractiveIsomorphicRequest(isomorphicRequest);
        this.log('emitting the "request" event for %d listener(s)...', emitter.listenerCount("request"));
        emitter.emit("request", interactiveIsomorphicRequest);
        this.log("awaiting mocked response...");
        Promise.resolve(until_12.until(function() {
          return __awaiter2(_this, void 0, void 0, function() {
            var _a3, mockedResponse;
            return __generator2(this, function(_b2) {
              switch (_b2.label) {
                case 0:
                  return [4, emitter.untilIdle("request", function(_a4) {
                    var _b3 = __read2(_a4.args, 1), request = _b3[0];
                    return request.id === interactiveIsomorphicRequest.id;
                  })];
                case 1:
                  _b2.sent();
                  this.log("all request listeners have been resolved!");
                  return [4, interactiveIsomorphicRequest.respondWith.invoked()];
                case 2:
                  _a3 = __read2.apply(void 0, [_b2.sent(), 1]), mockedResponse = _a3[0];
                  this.log("event.respondWith called with:", mockedResponse);
                  return [2, mockedResponse];
              }
            });
          });
        })).then(function(_a3) {
          var _b2, _c;
          var _d = __read2(_a3, 2), middlewareException = _d[0], mockedResponse = _d[1];
          if (middlewareException) {
            _this.log("middleware function threw an exception!", middlewareException);
            _this.trigger("error");
            _this.abort();
            return;
          }
          if (mockedResponse) {
            _this.log("received mocked response", mockedResponse);
            _this.trigger("loadstart");
            _this.status = (_b2 = mockedResponse.status) !== null && _b2 !== void 0 ? _b2 : 200;
            _this.statusText = mockedResponse.statusText || "OK";
            _this._responseHeaders = mockedResponse.headers ? headers_polyfill_1.objectToHeaders(mockedResponse.headers) : new headers_polyfill_1.Headers();
            _this.log("set response status", _this.status, _this.statusText);
            _this.log("set response headers", _this._responseHeaders);
            _this.setReadyState(_this.HEADERS_RECEIVED);
            _this.log("response type", _this.responseType);
            _this.response = _this.getResponseBody(mockedResponse.body);
            _this.responseURL = _this.url;
            _this.responseText = mockedResponse.body || "";
            _this.responseXML = _this.getResponseXML();
            _this.log("set response body", _this.response);
            if (mockedResponse.body && _this.response) {
              _this.setReadyState(_this.LOADING);
              var bodyBuffer = bufferFrom_1.bufferFrom(mockedResponse.body);
              _this.trigger("progress", {
                loaded: bodyBuffer.length,
                total: bodyBuffer.length
              });
            }
            _this.setReadyState(_this.DONE);
            _this.trigger("load");
            _this.trigger("loadend");
            emitter.emit("response", isomorphicRequest, toIsoResponse_1.toIsoResponse(mockedResponse));
          } else {
            _this.log("no mocked response received!");
            var originalRequest_1 = new XMLHttpRequest2();
            _this.log("opening an original request %s %s", _this.method, _this.url);
            originalRequest_1.open(_this.method, _this.url, (_c = _this.async) !== null && _c !== void 0 ? _c : true, _this.user, _this.password);
            originalRequest_1.addEventListener("load", function() {
              _this.log('original "onload"');
              _this.status = originalRequest_1.status;
              _this.statusText = originalRequest_1.statusText;
              _this.responseURL = originalRequest_1.responseURL;
              _this.responseType = originalRequest_1.responseType;
              _this.response = originalRequest_1.response;
              _this.responseText = originalRequest_1.responseText;
              _this.responseXML = originalRequest_1.responseXML;
              _this.log("set mock request readyState to DONE");
              _this.setReadyState(_this.DONE);
              _this.log("received original response", _this.status, _this.statusText);
              _this.log("original response body:", _this.response);
              var responseHeaders = originalRequest_1.getAllResponseHeaders();
              _this.log("original response headers:\n", responseHeaders);
              _this._responseHeaders = headers_polyfill_1.stringToHeaders(responseHeaders);
              _this.log("original response headers (normalized)", _this._responseHeaders);
              _this.log("original response finished");
              emitter.emit("response", isomorphicRequest, {
                status: originalRequest_1.status,
                statusText: originalRequest_1.statusText,
                headers: _this._responseHeaders,
                body: originalRequest_1.response
              });
            });
            _this.propagateCallbacks(originalRequest_1);
            _this.propagateListeners(originalRequest_1);
            _this.propagateHeaders(originalRequest_1, _this._requestHeaders);
            if (_this.async) {
              originalRequest_1.timeout = _this.timeout;
            }
            _this.log("send", data2);
            originalRequest_1.send(data2);
          }
        });
      };
      XMLHttpRequestOverride2.prototype.abort = function() {
        this.log("abort");
        if (this.readyState > this.UNSENT && this.readyState < this.DONE) {
          this.setReadyState(this.UNSENT);
          this.trigger("abort");
        }
      };
      XMLHttpRequestOverride2.prototype.dispatchEvent = function() {
        return false;
      };
      XMLHttpRequestOverride2.prototype.setRequestHeader = function(name, value) {
        this.log('set request header "%s" to "%s"', name, value);
        this._requestHeaders.append(name, value);
      };
      XMLHttpRequestOverride2.prototype.getResponseHeader = function(name) {
        this.log('get response header "%s"', name);
        if (this.readyState < this.HEADERS_RECEIVED) {
          this.log("cannot return a header: headers not received (state: %s)", this.readyState);
          return null;
        }
        var headerValue = this._responseHeaders.get(name);
        this.log('resolved response header "%s" to "%s"', name, headerValue, this._responseHeaders);
        return headerValue;
      };
      XMLHttpRequestOverride2.prototype.getAllResponseHeaders = function() {
        this.log("get all response headers");
        if (this.readyState < this.HEADERS_RECEIVED) {
          this.log("cannot return headers: headers not received (state: %s)", this.readyState);
          return "";
        }
        return headers_polyfill_1.headersToString(this._responseHeaders);
      };
      XMLHttpRequestOverride2.prototype.addEventListener = function(name, listener) {
        this.log("addEventListener", name, listener);
        this._events.push({
          name,
          listener
        });
      };
      XMLHttpRequestOverride2.prototype.removeEventListener = function(name, listener) {
        this.log("removeEventListener", name, listener);
        this._events = this._events.filter(function(storedEvent) {
          return storedEvent.name !== name && storedEvent.listener !== listener;
        });
      };
      XMLHttpRequestOverride2.prototype.overrideMimeType = function() {
      };
      XMLHttpRequestOverride2.prototype.getResponseBody = function(body2) {
        var textBody = body2 !== null && body2 !== void 0 ? body2 : "";
        this.log("coerced response body to", textBody);
        switch (this.responseType) {
          case "json": {
            this.log("resolving response body as JSON");
            return parseJson_1.parseJson(textBody);
          }
          case "blob": {
            var blobType = this.getResponseHeader("content-type") || "text/plain";
            this.log("resolving response body as Blob", { type: blobType });
            return new Blob([textBody], {
              type: blobType
            });
          }
          case "arraybuffer": {
            this.log("resolving response body as ArrayBuffer");
            var arrayBuffer = bufferFrom_1.bufferFrom(textBody);
            return arrayBuffer;
          }
          default:
            return textBody;
        }
      };
      XMLHttpRequestOverride2.prototype.getResponseXML = function() {
        var contentType = this.getResponseHeader("Content-Type");
        if (contentType === "application/xml" || contentType === "text/xml") {
          return new xmldom_1.DOMParser().parseFromString(this.responseText, contentType);
        }
        return null;
      };
      XMLHttpRequestOverride2.prototype.propagateCallbacks = function(request) {
        var e_2, _a3;
        this.log("propagating request callbacks to the original request");
        var callbackNames = [
          "abort",
          "onerror",
          "ontimeout",
          "onload",
          "onloadstart",
          "onloadend",
          "onprogress",
          "onreadystatechange"
        ];
        try {
          for (var callbackNames_1 = __values2(callbackNames), callbackNames_1_1 = callbackNames_1.next(); !callbackNames_1_1.done; callbackNames_1_1 = callbackNames_1.next()) {
            var callbackName = callbackNames_1_1.value;
            var callback = this[callbackName];
            if (callback) {
              request[callbackName] = this[callbackName];
              this.log('propagated the "%s" callback', callbackName, callback);
            }
          }
        } catch (e_2_1) {
          e_2 = { error: e_2_1 };
        } finally {
          try {
            if (callbackNames_1_1 && !callbackNames_1_1.done && (_a3 = callbackNames_1.return))
              _a3.call(callbackNames_1);
          } finally {
            if (e_2)
              throw e_2.error;
          }
        }
        request.onabort = this.abort;
        request.onerror = this.onerror;
        request.ontimeout = this.ontimeout;
        request.onload = this.onload;
        request.onloadstart = this.onloadstart;
        request.onloadend = this.onloadend;
        request.onprogress = this.onprogress;
        request.onreadystatechange = this.onreadystatechange;
      };
      XMLHttpRequestOverride2.prototype.propagateListeners = function(request) {
        this.log("propagating request listeners (%d) to the original request", this._events.length, this._events);
        this._events.forEach(function(_a3) {
          var name = _a3.name, listener = _a3.listener;
          request.addEventListener(name, listener);
        });
      };
      XMLHttpRequestOverride2.prototype.propagateHeaders = function(request, headers) {
        var _this = this;
        this.log("propagating request headers to the original request", headers);
        Object.entries(headers.raw()).forEach(function(_a3) {
          var _b2 = __read2(_a3, 2), name = _b2[0], value = _b2[1];
          _this.log('setting "%s" (%s) header on the original request', name, value);
          request.setRequestHeader(name, value);
        });
      };
      return XMLHttpRequestOverride2;
    }(), _a2.UNSENT = 0, _a2.OPENED = 1, _a2.HEADERS_RECEIVED = 2, _a2.LOADING = 3, _a2.DONE = 4, _a2;
  };
  XMLHttpRequestOverride.createXMLHttpRequestOverride = createXMLHttpRequestOverride;
  return XMLHttpRequestOverride;
}
var hasRequiredXMLHttpRequest;
function requireXMLHttpRequest() {
  if (hasRequiredXMLHttpRequest)
    return XMLHttpRequest;
  hasRequiredXMLHttpRequest = 1;
  var __extends2 = commonjsGlobal && commonjsGlobal.__extends || function() {
    var extendStatics = function(d, b) {
      extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
        d2.__proto__ = b2;
      } || function(d2, b2) {
        for (var p in b2)
          if (Object.prototype.hasOwnProperty.call(b2, p))
            d2[p] = b2[p];
      };
      return extendStatics(d, b);
    };
    return function(d, b) {
      if (typeof b !== "function" && b !== null)
        throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
  }();
  Object.defineProperty(XMLHttpRequest, "__esModule", { value: true });
  XMLHttpRequest.XMLHttpRequestInterceptor = void 0;
  var outvariant_12 = lib$5;
  var glossary_1 = glossary;
  var Interceptor_12 = Interceptor;
  var XMLHttpRequestOverride_1 = requireXMLHttpRequestOverride();
  var XMLHttpRequestInterceptor = function(_super) {
    __extends2(XMLHttpRequestInterceptor2, _super);
    function XMLHttpRequestInterceptor2() {
      return _super.call(this, XMLHttpRequestInterceptor2.symbol) || this;
    }
    XMLHttpRequestInterceptor2.prototype.checkEnvironment = function() {
      return typeof window !== "undefined" && typeof window.XMLHttpRequest !== "undefined";
    };
    XMLHttpRequestInterceptor2.prototype.setup = function() {
      var log = this.log.extend("setup");
      log('patching "XMLHttpRequest" module...');
      var PureXMLHttpRequest = window.XMLHttpRequest;
      outvariant_12.invariant(!PureXMLHttpRequest[glossary_1.IS_PATCHED_MODULE], 'Failed to patch the "XMLHttpRequest" module: already patched.');
      window.XMLHttpRequest = XMLHttpRequestOverride_1.createXMLHttpRequestOverride({
        XMLHttpRequest: PureXMLHttpRequest,
        emitter: this.emitter,
        log: this.log
      });
      log('native "XMLHttpRequest" module patched!', window.XMLHttpRequest.name);
      Object.defineProperty(window.XMLHttpRequest, glossary_1.IS_PATCHED_MODULE, {
        enumerable: true,
        configurable: true,
        value: true
      });
      this.subscriptions.push(function() {
        Object.defineProperty(window.XMLHttpRequest, glossary_1.IS_PATCHED_MODULE, {
          value: void 0
        });
        window.XMLHttpRequest = PureXMLHttpRequest;
        log('native "XMLHttpRequest" module restored!', window.XMLHttpRequest.name);
      });
    };
    XMLHttpRequestInterceptor2.symbol = Symbol("xhr");
    return XMLHttpRequestInterceptor2;
  }(Interceptor_12.Interceptor);
  XMLHttpRequest.XMLHttpRequestInterceptor = XMLHttpRequestInterceptor;
  return XMLHttpRequest;
}
var __create = Object.create;
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __objRest = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target, mod));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var src_exports = {};
__export(src_exports, {
  GraphQLHandler: () => GraphQLHandler,
  MockedRequest: () => MockedRequest,
  RESTMethods: () => RESTMethods,
  RequestHandler: () => RequestHandler,
  RestHandler: () => RestHandler,
  cleanUrl: () => cleanUrl,
  compose: () => compose,
  context: () => context_exports,
  createResponseComposition: () => createResponseComposition,
  defaultContext: () => defaultContext,
  defaultResponse: () => defaultResponse,
  graphql: () => graphql,
  graphqlContext: () => graphqlContext,
  handleRequest: () => handleRequest,
  matchRequestUrl: () => matchRequestUrl,
  response: () => response,
  rest: () => rest,
  restContext: () => restContext,
  setupWorker: () => setupWorker
});
var lib = __toCommonJS(src_exports);
var context_exports = {};
__export(context_exports, {
  body: () => body,
  cookie: () => cookie,
  data: () => data,
  delay: () => delay,
  errors: () => errors,
  extensions: () => extensions,
  fetch: () => fetch$1,
  json: () => json,
  set: () => set,
  status: () => status,
  text: () => text,
  xml: () => xml
});
var import_codes = __toESM(require$$0);
var status = (statusCode, statusText) => {
  return (res) => {
    res.status = statusCode;
    res.statusText = statusText || import_codes.default[String(statusCode)];
    return res;
  };
};
var import_headers_polyfill = lib$9;
function set(...args) {
  return (res) => {
    const [name, value] = args;
    if (typeof name === "string") {
      res.headers.append(name, value);
    } else {
      const headers = (0, import_headers_polyfill.objectToHeaders)(name);
      headers.forEach((value2, name2) => {
        res.headers.append(name2, value2);
      });
    }
    return res;
  };
}
var cookieUtils = __toESM(_cookie_0_4_2_cookie);
var cookie = (name, value, options) => {
  return (res) => {
    const serializedCookie = cookieUtils.serialize(name, value, options);
    res.headers.append("Set-Cookie", serializedCookie);
    if (typeof document !== "undefined") {
      document.cookie = serializedCookie;
    }
    return res;
  };
};
var body = (value) => {
  return (res) => {
    res.body = value;
    return res;
  };
};
function jsonParse(value) {
  try {
    return JSON.parse(value);
  } catch (error2) {
    return void 0;
  }
}
function isObject(value) {
  return value != null && typeof value === "object" && !Array.isArray(value);
}
function mergeRight(left, right) {
  return Object.entries(right).reduce((result, [key, rightValue]) => {
    const leftValue = result[key];
    if (Array.isArray(leftValue) && Array.isArray(rightValue)) {
      result[key] = leftValue.concat(rightValue);
      return result;
    }
    if (isObject(leftValue) && isObject(rightValue)) {
      result[key] = mergeRight(leftValue, rightValue);
      return result;
    }
    result[key] = rightValue;
    return result;
  }, Object.assign({}, left));
}
var json = (body2) => {
  return (res) => {
    res.headers.set("Content-Type", "application/json");
    res.body = JSON.stringify(body2);
    return res;
  };
};
var data = (payload) => {
  return (res) => {
    const prevBody = jsonParse(res.body) || {};
    const nextBody = mergeRight(prevBody, { data: payload });
    return json(nextBody)(res);
  };
};
var extensions = (payload) => {
  return (res) => {
    const prevBody = jsonParse(res.body) || {};
    const nextBody = mergeRight(prevBody, { extensions: payload });
    return json(nextBody)(res);
  };
};
var import_is_node_process = lib$8.exports;
var SET_TIMEOUT_MAX_ALLOWED_INT = 2147483647;
var MIN_SERVER_RESPONSE_TIME = 100;
var MAX_SERVER_RESPONSE_TIME = 400;
var NODE_SERVER_RESPONSE_TIME = 5;
var getRandomServerResponseTime = () => {
  if ((0, import_is_node_process.isNodeProcess)()) {
    return NODE_SERVER_RESPONSE_TIME;
  }
  return Math.floor(Math.random() * (MAX_SERVER_RESPONSE_TIME - MIN_SERVER_RESPONSE_TIME) + MIN_SERVER_RESPONSE_TIME);
};
var delay = (durationOrMode) => {
  return (res) => {
    let delayTime;
    if (typeof durationOrMode === "string") {
      switch (durationOrMode) {
        case "infinite": {
          delayTime = SET_TIMEOUT_MAX_ALLOWED_INT;
          break;
        }
        case "real": {
          delayTime = getRandomServerResponseTime();
          break;
        }
        default: {
          throw new Error(`Failed to delay a response: unknown delay mode "${durationOrMode}". Please make sure you provide one of the supported modes ("real", "infinite") or a number to "ctx.delay".`);
        }
      }
    } else if (typeof durationOrMode === "undefined") {
      delayTime = getRandomServerResponseTime();
    } else {
      if (durationOrMode > SET_TIMEOUT_MAX_ALLOWED_INT) {
        throw new Error(`Failed to delay a response: provided delay duration (${durationOrMode}) exceeds the maximum allowed duration for "setTimeout" (${SET_TIMEOUT_MAX_ALLOWED_INT}). This will cause the response to be returned immediately. Please use a number within the allowed range to delay the response by exact duration, or consider the "infinite" delay mode to delay the response indefinitely.`);
      }
      delayTime = durationOrMode;
    }
    res.delay = delayTime;
    return res;
  };
};
var errors = (errorsList) => {
  return (res) => {
    if (errorsList == null) {
      return res;
    }
    const prevBody = jsonParse(res.body) || {};
    const nextBody = mergeRight(prevBody, { errors: errorsList });
    return json(nextBody)(res);
  };
};
var import_is_node_process2 = lib$8.exports;
var import_headers_polyfill2 = lib$9;
var useFetch = (0, import_is_node_process2.isNodeProcess)() ? requireBrowser() : window.fetch;
var augmentRequestInit = (requestInit) => {
  const headers = new import_headers_polyfill2.Headers(requestInit.headers);
  headers.set("x-msw-bypass", "true");
  return __spreadProps(__spreadValues({}, requestInit), {
    headers: headers.all()
  });
};
var createFetchRequestParameters = (input) => {
  const { body: body2, method } = input;
  const requestParameters = __spreadProps(__spreadValues({}, input), {
    body: void 0
  });
  if (["GET", "HEAD"].includes(method)) {
    return requestParameters;
  }
  if (typeof body2 === "object" || typeof body2 === "number" || typeof body2 === "boolean") {
    requestParameters.body = JSON.stringify(body2);
  } else {
    requestParameters.body = body2;
  }
  return requestParameters;
};
var fetch$1 = (input, requestInit = {}) => {
  if (typeof input === "string") {
    return useFetch(input, augmentRequestInit(requestInit));
  }
  const requestParameters = createFetchRequestParameters(input);
  const derivedRequestInit = augmentRequestInit(requestParameters);
  return useFetch(input.url.href, derivedRequestInit);
};
var text = (body2) => {
  return (res) => {
    res.headers.set("Content-Type", "text/plain");
    res.body = body2;
    return res;
  };
};
var xml = (body2) => {
  return (res) => {
    res.headers.set("Content-Type", "text/xml");
    res.body = body2;
    return res;
  };
};
var import_is_node_process3 = lib$8.exports;
var import_strict_event_emitter = lib$7;
var import_until4 = lib$6;
var import_until = lib$6;
var getWorkerByRegistration = (registration, absoluteWorkerUrl, findWorker) => {
  const allStates = [
    registration.active,
    registration.installing,
    registration.waiting
  ];
  const existingStates = allStates.filter(Boolean);
  const mockWorker = existingStates.find((worker) => {
    return findWorker(worker.scriptURL, absoluteWorkerUrl);
  });
  return mockWorker || null;
};
function getAbsoluteWorkerUrl(relativeUrl) {
  return new URL(relativeUrl, location.origin).href;
}
var import_outvariant = lib$5;
var LIBRARY_PREFIX = "[MSW]";
function formatMessage(message, ...positionals) {
  const interpolatedMessage = (0, import_outvariant.format)(message, ...positionals);
  return `${LIBRARY_PREFIX} ${interpolatedMessage}`;
}
function warn(message, ...positionals) {
  console.warn(formatMessage(message, ...positionals));
}
function error(message, ...positionals) {
  console.error(formatMessage(message, ...positionals));
}
var devUtils = {
  formatMessage,
  warn,
  error
};
var getWorkerInstance = async (url, options = {}, findWorker) => {
  const absoluteWorkerUrl = getAbsoluteWorkerUrl(url);
  const mockRegistrations = await navigator.serviceWorker.getRegistrations().then((registrations) => registrations.filter((registration) => getWorkerByRegistration(registration, absoluteWorkerUrl, findWorker)));
  if (!navigator.serviceWorker.controller && mockRegistrations.length > 0) {
    location.reload();
  }
  const [existingRegistration] = mockRegistrations;
  if (existingRegistration) {
    return existingRegistration.update().then(() => {
      return [
        getWorkerByRegistration(existingRegistration, absoluteWorkerUrl, findWorker),
        existingRegistration
      ];
    });
  }
  const [error2, instance2] = await (0, import_until.until)(async () => {
    const registration = await navigator.serviceWorker.register(url, options);
    return [
      getWorkerByRegistration(registration, absoluteWorkerUrl, findWorker),
      registration
    ];
  });
  if (error2) {
    const isWorkerMissing = error2.message.includes("(404)");
    if (isWorkerMissing) {
      const scopeUrl = new URL((options == null ? void 0 : options.scope) || "/", location.href);
      throw new Error(devUtils.formatMessage(`Failed to register a Service Worker for scope ('${scopeUrl.href}') with script ('${absoluteWorkerUrl}'): Service Worker script does not exist at the given path.

Did you forget to run "npx msw init <PUBLIC_DIR>"?

Learn more about creating the Service Worker script: https://mswjs.io/docs/cli/init`));
    }
    throw new Error(devUtils.formatMessage("Failed to register the Service Worker:\n\n%s", error2.message));
  }
  return instance2;
};
function printStartMessage(args = {}) {
  if (args.quiet) {
    return;
  }
  const message = args.message || "Mocking enabled.";
  console.groupCollapsed(`%c${devUtils.formatMessage(message)}`, "color:orangered;font-weight:bold;");
  console.log("%cDocumentation: %chttps://mswjs.io/docs", "font-weight:bold", "font-weight:normal");
  console.log("Found an issue? https://github.com/mswjs/msw/issues");
  if (args.workerUrl) {
    console.log("Worker script URL:", args.workerUrl);
  }
  if (args.workerScope) {
    console.log("Worker scope:", args.workerScope);
  }
  console.groupEnd();
}
async function enableMocking(context, options) {
  var _a2, _b2;
  context.workerChannel.send("MOCK_ACTIVATE");
  await context.events.once("MOCKING_ENABLED");
  if (context.isMockingEnabled) {
    devUtils.warn(`Found a redundant "worker.start()" call. Note that starting the worker while mocking is already enabled will have no effect. Consider removing this "worker.start()" call.`);
    return;
  }
  context.isMockingEnabled = true;
  printStartMessage({
    quiet: options.quiet,
    workerScope: (_a2 = context.registration) == null ? void 0 : _a2.scope,
    workerUrl: (_b2 = context.worker) == null ? void 0 : _b2.scriptURL
  });
}
var WorkerChannel = class {
  constructor(port) {
    this.port = port;
  }
  postMessage(event, ...rest2) {
    const [data2, transfer] = rest2;
    this.port.postMessage({ type: event, data: data2 }, { transfer });
  }
};
var NetworkError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "NetworkError";
  }
};
var import_interceptors2 = lib$4;
var import_headers_polyfill4 = lib$9;
var cookieUtils3 = __toESM(_cookie_0_4_2_cookie);
var import_cookies = lib$2;
var import_interceptors = lib$4;
var import_bufferUtils = bufferUtils;
var import_lib = lib$9;
var cookieUtils2 = __toESM(_cookie_0_4_2_cookie);
function getAllCookies() {
  return cookieUtils2.parse(document.cookie);
}
function getRequestCookies(request) {
  if (typeof document === "undefined" || typeof location === "undefined") {
    return {};
  }
  switch (request.credentials) {
    case "same-origin": {
      return location.origin === request.url.origin ? getAllCookies() : {};
    }
    case "include": {
      return getAllCookies();
    }
    default: {
      return {};
    }
  }
}
var import_headers_polyfill3 = lib$9;
function parseContentHeaders(headersString) {
  var _a2, _b2;
  const headers = (0, import_headers_polyfill3.stringToHeaders)(headersString);
  const contentType = headers.get("content-type") || "text/plain";
  const disposition = headers.get("content-disposition");
  if (!disposition) {
    throw new Error('"Content-Disposition" header is required.');
  }
  const directives = disposition.split(";").reduce((acc, chunk) => {
    const [name2, ...rest2] = chunk.trim().split("=");
    acc[name2] = rest2.join("=");
    return acc;
  }, {});
  const name = (_a2 = directives.name) == null ? void 0 : _a2.slice(1, -1);
  const filename = (_b2 = directives.filename) == null ? void 0 : _b2.slice(1, -1);
  return {
    name,
    filename,
    contentType
  };
}
function parseMultipartData(data2, headers) {
  const contentType = headers == null ? void 0 : headers.get("content-type");
  if (!contentType) {
    return void 0;
  }
  const [, ...directives] = contentType.split(/; */);
  const boundary = directives.filter((d) => d.startsWith("boundary=")).map((s) => s.replace(/^boundary=/, ""))[0];
  if (!boundary) {
    return void 0;
  }
  const boundaryRegExp = new RegExp(`--+${boundary}`);
  const fields = data2.split(boundaryRegExp).filter((chunk) => chunk.startsWith("\r\n") && chunk.endsWith("\r\n")).map((chunk) => chunk.trimStart().replace(/\r\n$/, ""));
  if (!fields.length) {
    return void 0;
  }
  const parsedBody = {};
  try {
    for (const field2 of fields) {
      const [contentHeaders, ...rest2] = field2.split("\r\n\r\n");
      const contentBody = rest2.join("\r\n\r\n");
      const { contentType: contentType2, filename, name } = parseContentHeaders(contentHeaders);
      const value = filename === void 0 ? contentBody : new File([contentBody], filename, { type: contentType2 });
      const parsedValue = parsedBody[name];
      if (parsedValue === void 0) {
        parsedBody[name] = value;
      } else if (Array.isArray(parsedValue)) {
        parsedBody[name] = [...parsedValue, value];
      } else {
        parsedBody[name] = [parsedValue, value];
      }
    }
    return parsedBody;
  } catch (error2) {
    return void 0;
  }
}
function parseBody(body2, headers) {
  var _a2;
  if (!body2) {
    return body2;
  }
  const contentType = ((_a2 = headers == null ? void 0 : headers.get("content-type")) == null ? void 0 : _a2.toLowerCase()) || "";
  const hasMultipartContent = contentType.startsWith("multipart/form-data");
  if (hasMultipartContent && typeof body2 !== "object") {
    return parseMultipartData(body2.toString(), headers) || body2;
  }
  const hasJsonContent = contentType.includes("json");
  if (hasJsonContent && typeof body2 !== "object") {
    return jsonParse(body2.toString()) || body2;
  }
  return body2;
}
function isStringEqual(actual, expected) {
  return actual.toLowerCase() === expected.toLowerCase();
}
var MockedRequest = class extends import_interceptors.IsomorphicRequest {
  constructor(url, init2 = {}) {
    super(url, init2);
    if (init2.id) {
      this.id = init2.id;
    }
    this.cache = init2.cache || "default";
    this.destination = init2.destination || "";
    this.integrity = init2.integrity || "";
    this.keepalive = init2.keepalive || false;
    this.mode = init2.mode || "cors";
    this.priority = init2.priority || "auto";
    this.redirect = init2.redirect || "follow";
    this.referrer = init2.referrer || "";
    this.referrerPolicy = init2.referrerPolicy || "no-referrer";
    this.cookies = init2.cookies || this.getCookies();
  }
  get body() {
    const text2 = (0, import_bufferUtils.decodeBuffer)(this["_body"]);
    const body2 = parseBody(text2, this.headers);
    if (isStringEqual(this.method, "GET") && body2 === "") {
      return void 0;
    }
    return body2;
  }
  passthrough() {
    return {
      status: 101,
      statusText: "Continue",
      headers: new import_lib.Headers(),
      body: null,
      passthrough: true,
      once: false
    };
  }
  getCookies() {
    var _a2;
    const requestCookiesString = this.headers.get("cookie");
    const ownCookies = requestCookiesString ? cookieUtils3.parse(requestCookiesString) : {};
    import_cookies.store.hydrate();
    const cookiesFromStore = Array.from((_a2 = import_cookies.store.get(__spreadProps(__spreadValues({}, this), { url: this.url.href }))) == null ? void 0 : _a2.entries()).reduce((cookies, [name, { value }]) => {
      return Object.assign(cookies, { [name.trim()]: value });
    }, {});
    const cookiesFromDocument = getRequestCookies(this);
    const forwardedCookies = __spreadValues(__spreadValues({}, cookiesFromDocument), cookiesFromStore);
    for (const [name, value] of Object.entries(forwardedCookies)) {
      this.headers.append("cookie", `${name}=${value}`);
    }
    return __spreadValues(__spreadValues({}, forwardedCookies), ownCookies);
  }
};
function parseWorkerRequest(rawRequest) {
  const url = new URL(rawRequest.url);
  const headers = new import_headers_polyfill4.Headers(rawRequest.headers);
  return new MockedRequest(url, __spreadProps(__spreadValues({}, rawRequest), {
    body: (0, import_interceptors2.encodeBuffer)(rawRequest.body || ""),
    headers
  }));
}
var import_until2 = lib$6;
var getResponse = async (request, handlers2, resolutionContext) => {
  const relevantHandlers = handlers2.filter((handler) => {
    return handler.test(request, resolutionContext);
  });
  if (relevantHandlers.length === 0) {
    return {
      handler: void 0,
      response: void 0
    };
  }
  const result = await relevantHandlers.reduce(async (executionResult, handler) => {
    const previousResults = await executionResult;
    if (!!(previousResults == null ? void 0 : previousResults.response)) {
      return executionResult;
    }
    const result2 = await handler.run(request, resolutionContext);
    if (result2 === null || result2.handler.shouldSkip) {
      return null;
    }
    if (!result2.response) {
      return {
        request: result2.request,
        handler: result2.handler,
        response: void 0,
        parsedResult: result2.parsedResult
      };
    }
    if (result2.response.once) {
      handler.markAsSkipped(true);
    }
    return result2;
  }, Promise.resolve(null));
  if (!result) {
    return {
      handler: void 0,
      response: void 0
    };
  }
  return {
    handler: result.handler,
    publicRequest: result.request,
    parsedRequest: result.parsedResult,
    response: result.response
  };
};
var import_js_levenshtein = __toESM(require_jsLevenshtein_1_1_6_jsLevenshtein());
var import_graphql = require$$13;
var getPublicUrlFromRequest = (request) => {
  return request.referrer.startsWith(request.url.origin) ? request.url.pathname : new URL(request.url.pathname, `${request.url.protocol}//${request.url.host}`).href;
};
function parseDocumentNode(node) {
  var _a2;
  const operationDef = node.definitions.find((def) => {
    return def.kind === "OperationDefinition";
  });
  return {
    operationType: operationDef == null ? void 0 : operationDef.operation,
    operationName: (_a2 = operationDef == null ? void 0 : operationDef.name) == null ? void 0 : _a2.value
  };
}
function parseQuery(query) {
  try {
    const ast = (0, import_graphql.parse)(query);
    return parseDocumentNode(ast);
  } catch (error2) {
    return error2;
  }
}
function extractMultipartVariables(variables, map, files) {
  const operations = { variables };
  for (const [key, pathArray] of Object.entries(map)) {
    if (!(key in files)) {
      throw new Error(`Given files do not have a key '${key}' .`);
    }
    for (const dotPath of pathArray) {
      const [lastPath, ...reversedPaths] = dotPath.split(".").reverse();
      const paths = reversedPaths.reverse();
      let target = operations;
      for (const path of paths) {
        if (!(path in target)) {
          throw new Error(`Property '${paths}' is not in operations.`);
        }
        target = target[path];
      }
      target[lastPath] = files[key];
    }
  }
  return operations.variables;
}
function getGraphQLInput(request) {
  var _a2, _b2;
  switch (request.method) {
    case "GET": {
      const query = request.url.searchParams.get("query");
      const variables = request.url.searchParams.get("variables") || "";
      return {
        query,
        variables: jsonParse(variables)
      };
    }
    case "POST": {
      if ((_a2 = request.body) == null ? void 0 : _a2.query) {
        const { query, variables } = request.body;
        return {
          query,
          variables
        };
      }
      if ((_b2 = request.body) == null ? void 0 : _b2.operations) {
        const _c = request.body, { operations, map } = _c, files = __objRest(_c, ["operations", "map"]);
        const parsedOperations = jsonParse(operations) || {};
        if (!parsedOperations.query) {
          return null;
        }
        const parsedMap = jsonParse(map || "") || {};
        const variables = parsedOperations.variables ? extractMultipartVariables(parsedOperations.variables, parsedMap, files) : {};
        return {
          query: parsedOperations.query,
          variables
        };
      }
    }
    default:
      return null;
  }
}
function parseGraphQLRequest(request) {
  const input = getGraphQLInput(request);
  if (!input || !input.query) {
    return void 0;
  }
  const { query, variables } = input;
  const parsedResult = parseQuery(query);
  if (parsedResult instanceof Error) {
    const requestPublicUrl = getPublicUrlFromRequest(request);
    throw new Error(devUtils.formatMessage('Failed to intercept a GraphQL request to "%s %s": cannot parse query. See the error message from the parser below.\n\n%s', request.method, requestPublicUrl, parsedResult.message));
  }
  return {
    operationType: parsedResult.operationType,
    operationName: parsedResult.operationName,
    variables
  };
}
function getStatusCodeColor(status2) {
  if (status2 < 300) {
    return "#69AB32";
  }
  if (status2 < 400) {
    return "#F0BB4B";
  }
  return "#E95F5D";
}
function getTimestamp() {
  const now2 = new Date();
  return [now2.getHours(), now2.getMinutes(), now2.getSeconds()].map(String).map((chunk) => chunk.slice(0, 2)).map((chunk) => chunk.padStart(2, "0")).join(":");
}
function prepareRequest(request) {
  return __spreadProps(__spreadValues({}, request), {
    body: request.body,
    headers: request.headers.all()
  });
}
var import_headers_polyfill5 = lib$9;
function prepareResponse(res) {
  const responseHeaders = (0, import_headers_polyfill5.objectToHeaders)(res.headers);
  return __spreadProps(__spreadValues({}, res), {
    body: parseBody(res.body, responseHeaders)
  });
}
var import_path_to_regexp = require$$14;
var import_getCleanUrl = getCleanUrl$1;
var REDUNDANT_CHARACTERS_EXP = /[\?|#].*$/g;
function getSearchParams(path) {
  return new URL(`/${path}`, "http://localhost").searchParams;
}
function cleanUrl(path) {
  return path.replace(REDUNDANT_CHARACTERS_EXP, "");
}
function isAbsoluteUrl(url) {
  return /^([a-z][a-z\d\+\-\.]*:)?\/\//i.test(url);
}
function getAbsoluteUrl(path, baseUrl) {
  if (isAbsoluteUrl(path)) {
    return path;
  }
  if (path.startsWith("*")) {
    return path;
  }
  const origin = baseUrl || typeof document !== "undefined" && document.baseURI;
  return origin ? decodeURI(new URL(encodeURI(path), origin).href) : path;
}
function normalizePath(path, baseUrl) {
  if (path instanceof RegExp) {
    return path;
  }
  const maybeAbsoluteUrl = getAbsoluteUrl(path, baseUrl);
  return cleanUrl(maybeAbsoluteUrl);
}
function coercePath(path) {
  return path.replace(/([:a-zA-Z_-]*)(\*{1,2})+/g, (_, parameterName, wildcard) => {
    const expression = "(.*)";
    if (!parameterName) {
      return expression;
    }
    return parameterName.startsWith(":") ? `${parameterName}${wildcard}` : `${parameterName}${expression}`;
  }).replace(/([^\/])(:)(?=\d+)/, "$1\\$2").replace(/^([^\/]+)(:)(?=\/\/)/, "$1\\$2");
}
function matchRequestUrl(url, path, baseUrl) {
  const normalizedPath = normalizePath(path, baseUrl);
  const cleanPath = typeof normalizedPath === "string" ? coercePath(normalizedPath) : normalizedPath;
  const cleanUrl2 = (0, import_getCleanUrl.getCleanUrl)(url);
  const result = (0, import_path_to_regexp.match)(cleanPath, { decode: decodeURIComponent })(cleanUrl2);
  const params = result && result.params || {};
  return {
    matches: result !== false,
    params
  };
}
var import_headers_polyfill6 = lib$9;
function compose(...fns) {
  return (...args) => {
    return fns.reduceRight((leftFn, rightFn) => {
      return leftFn instanceof Promise ? Promise.resolve(leftFn).then(rightFn) : rightFn(leftFn);
    }, args[0]);
  };
}
var defaultResponse = {
  status: 200,
  statusText: "OK",
  body: null,
  delay: 0,
  once: false,
  passthrough: false
};
var defaultResponseTransformers = [];
function createResponseComposition(responseOverrides, defaultTransformers = defaultResponseTransformers) {
  return async (...transformers) => {
    const initialResponse = Object.assign({}, defaultResponse, {
      headers: new import_headers_polyfill6.Headers({
        "x-powered-by": "msw"
      })
    }, responseOverrides);
    const resolvedTransformers = [
      ...defaultTransformers,
      ...transformers
    ].filter(Boolean);
    const resolvedResponse = resolvedTransformers.length > 0 ? compose(...resolvedTransformers)(initialResponse) : initialResponse;
    return resolvedResponse;
  };
}
var response = Object.assign(createResponseComposition(), {
  once: createResponseComposition({ once: true }),
  networkError(message) {
    throw new NetworkError(message);
  }
});
var SOURCE_FRAME = /\/msw\/src\/(.+)/;
var BUILD_FRAME = /(node_modules)?[\/\\]lib[\/\\](umd|esm|iief|cjs)[\/\\]|^[^\/\\]*$/;
function getCallFrame(error2) {
  const stack = error2.stack;
  if (!stack) {
    return;
  }
  const frames = stack.split("\n").slice(1);
  const declarationFrame = frames.find((frame) => {
    return !(SOURCE_FRAME.test(frame) || BUILD_FRAME.test(frame));
  });
  if (!declarationFrame) {
    return;
  }
  const declarationPath = declarationFrame.replace(/\s*at [^()]*\(([^)]+)\)/, "$1").replace(/^@/, "");
  return declarationPath;
}
function isIterable(fn) {
  if (!fn) {
    return false;
  }
  return typeof fn[Symbol.iterator] == "function";
}
var defaultContext = {
  status,
  set,
  delay,
  fetch: fetch$1
};
var RequestHandler = class {
  constructor(options) {
    this.shouldSkip = false;
    this.ctx = options.ctx || defaultContext;
    this.resolver = options.resolver;
    const callFrame = getCallFrame(new Error());
    this.info = __spreadProps(__spreadValues({}, options.info), {
      callFrame
    });
  }
  parse(_request, _resolutionContext) {
    return null;
  }
  test(request, resolutionContext) {
    return this.predicate(request, this.parse(request, resolutionContext), resolutionContext);
  }
  getPublicRequest(request, _parsedResult) {
    return request;
  }
  markAsSkipped(shouldSkip = true) {
    this.shouldSkip = shouldSkip;
  }
  async run(request, resolutionContext) {
    if (this.shouldSkip) {
      return null;
    }
    const parsedResult = this.parse(request, resolutionContext);
    const shouldIntercept = this.predicate(request, parsedResult, resolutionContext);
    if (!shouldIntercept) {
      return null;
    }
    const publicRequest = this.getPublicRequest(request, parsedResult);
    const executeResolver = this.wrapResolver(this.resolver);
    const mockedResponse = await executeResolver(publicRequest, response, this.ctx);
    return this.createExecutionResult(parsedResult, publicRequest, mockedResponse);
  }
  wrapResolver(resolver) {
    return async (req, res, ctx) => {
      const result = this.resolverGenerator || await resolver(req, res, ctx);
      if (isIterable(result)) {
        const { value, done } = result[Symbol.iterator]().next();
        const nextResponse = await value;
        if (!nextResponse && done) {
          return this.resolverGeneratorResult;
        }
        if (!this.resolverGenerator) {
          this.resolverGenerator = result;
        }
        this.resolverGeneratorResult = nextResponse;
        return nextResponse;
      }
      return result;
    };
  }
  createExecutionResult(parsedResult, request, response2) {
    return {
      handler: this,
      parsedResult: parsedResult || null,
      request,
      response: response2 || null
    };
  }
};
var RESTMethods = /* @__PURE__ */ ((RESTMethods2) => {
  RESTMethods2["HEAD"] = "HEAD";
  RESTMethods2["GET"] = "GET";
  RESTMethods2["POST"] = "POST";
  RESTMethods2["PUT"] = "PUT";
  RESTMethods2["PATCH"] = "PATCH";
  RESTMethods2["OPTIONS"] = "OPTIONS";
  RESTMethods2["DELETE"] = "DELETE";
  return RESTMethods2;
})(RESTMethods || {});
var restContext = __spreadProps(__spreadValues({}, defaultContext), {
  cookie,
  body,
  text,
  json,
  xml
});
var RestRequest = class extends MockedRequest {
  constructor(request, params) {
    super(request.url, __spreadProps(__spreadValues({}, request), {
      body: request["_body"]
    }));
    this.params = params;
    this.id = request.id;
  }
};
var RestHandler = class extends RequestHandler {
  constructor(method, path, resolver) {
    super({
      info: {
        header: `${method} ${path}`,
        path,
        method
      },
      ctx: restContext,
      resolver
    });
    this.checkRedundantQueryParameters();
  }
  checkRedundantQueryParameters() {
    const { method, path } = this.info;
    if (path instanceof RegExp) {
      return;
    }
    const url = cleanUrl(path);
    if (url === path) {
      return;
    }
    const searchParams = getSearchParams(path);
    searchParams.forEach((_, paramName) => {
    });
    devUtils.warn(`Found a redundant usage of query parameters in the request handler URL for "${method} ${path}". Please match against a path instead and access query parameters in the response resolver function using "req.url.searchParams".`);
  }
  parse(request, resolutionContext) {
    return matchRequestUrl(request.url, this.info.path, resolutionContext == null ? void 0 : resolutionContext.baseUrl);
  }
  getPublicRequest(request, parsedResult) {
    return new RestRequest(request, parsedResult.params || {});
  }
  predicate(request, parsedResult) {
    const matchesMethod = this.info.method instanceof RegExp ? this.info.method.test(request.method) : isStringEqual(this.info.method, request.method);
    return matchesMethod && parsedResult.matches;
  }
  log(request, response2) {
    const publicUrl = getPublicUrlFromRequest(request);
    const loggedRequest = prepareRequest(request);
    const loggedResponse = prepareResponse(response2);
    const statusColor = getStatusCodeColor(response2.status);
    console.groupCollapsed(devUtils.formatMessage("%s %s %s (%c%s%c)"), getTimestamp(), request.method, publicUrl, `color:${statusColor}`, `${response2.status} ${response2.statusText}`, "color:inherit");
    console.log("Request", loggedRequest);
    console.log("Handler:", this);
    console.log("Response", loggedResponse);
    console.groupEnd();
  }
};
var import_outvariant2 = lib$5;
var field = (fieldName, fieldValue) => {
  return (res) => {
    validateFieldName(fieldName);
    const prevBody = jsonParse(res.body) || {};
    const nextBody = mergeRight(prevBody, { [fieldName]: fieldValue });
    return json(nextBody)(res);
  };
};
function validateFieldName(fieldName) {
  (0, import_outvariant2.invariant)(fieldName.trim() !== "", devUtils.formatMessage("Failed to set a custom field on a GraphQL response: field name cannot be empty."));
  (0, import_outvariant2.invariant)(fieldName !== "data", devUtils.formatMessage('Failed to set a custom "%s" field on a mocked GraphQL response: forbidden field name. Did you mean to call "ctx.data()" instead?', fieldName));
  (0, import_outvariant2.invariant)(fieldName !== "errors", devUtils.formatMessage('Failed to set a custom "%s" field on a mocked GraphQL response: forbidden field name. Did you mean to call "ctx.errors()" instead?', fieldName));
  (0, import_outvariant2.invariant)(fieldName !== "extensions", devUtils.formatMessage('Failed to set a custom "%s" field on a mocked GraphQL response: forbidden field name. Did you mean to call "ctx.extensions()" instead?', fieldName));
}
function tryCatch(fn, onException) {
  try {
    const result = fn();
    return result;
  } catch (error2) {
    onException == null ? void 0 : onException(error2);
  }
}
var graphqlContext = __spreadProps(__spreadValues({}, defaultContext), {
  data,
  extensions,
  errors,
  cookie,
  field
});
function isDocumentNode(value) {
  if (value == null) {
    return false;
  }
  return typeof value === "object" && "kind" in value && "definitions" in value;
}
var GraphQLRequest = class extends MockedRequest {
  constructor(request, variables) {
    super(request.url, __spreadProps(__spreadValues({}, request), {
      body: request["_body"]
    }));
    this.variables = variables;
  }
};
var GraphQLHandler = class extends RequestHandler {
  constructor(operationType, operationName, endpoint, resolver) {
    let resolvedOperationName = operationName;
    if (isDocumentNode(operationName)) {
      const parsedNode = parseDocumentNode(operationName);
      if (parsedNode.operationType !== operationType) {
        throw new Error(`Failed to create a GraphQL handler: provided a DocumentNode with a mismatched operation type (expected "${operationType}", but got "${parsedNode.operationType}").`);
      }
      if (!parsedNode.operationName) {
        throw new Error(`Failed to create a GraphQL handler: provided a DocumentNode with no operation name.`);
      }
      resolvedOperationName = parsedNode.operationName;
    }
    const header = operationType === "all" ? `${operationType} (origin: ${endpoint.toString()})` : `${operationType} ${resolvedOperationName} (origin: ${endpoint.toString()})`;
    super({
      info: {
        header,
        operationType,
        operationName: resolvedOperationName
      },
      ctx: graphqlContext,
      resolver
    });
    this.endpoint = endpoint;
  }
  parse(request) {
    return tryCatch(() => parseGraphQLRequest(request), (error2) => console.error(error2.message));
  }
  getPublicRequest(request, parsedResult) {
    return new GraphQLRequest(request, (parsedResult == null ? void 0 : parsedResult.variables) || {});
  }
  predicate(request, parsedResult) {
    if (!parsedResult) {
      return false;
    }
    if (!parsedResult.operationName && this.info.operationType !== "all") {
      const publicUrl = getPublicUrlFromRequest(request);
      devUtils.warn(`Failed to intercept a GraphQL request at "${request.method} ${publicUrl}": anonymous GraphQL operations are not supported.

Consider naming this operation or using "graphql.operation" request handler to intercept GraphQL requests regardless of their operation name/type. Read more: https://mswjs.io/docs/api/graphql/operation      `);
      return false;
    }
    const hasMatchingUrl = matchRequestUrl(request.url, this.endpoint);
    const hasMatchingOperationType = this.info.operationType === "all" || parsedResult.operationType === this.info.operationType;
    const hasMatchingOperationName = this.info.operationName instanceof RegExp ? this.info.operationName.test(parsedResult.operationName || "") : parsedResult.operationName === this.info.operationName;
    return hasMatchingUrl.matches && hasMatchingOperationType && hasMatchingOperationName;
  }
  log(request, response2, parsedRequest) {
    const loggedRequest = prepareRequest(request);
    const loggedResponse = prepareResponse(response2);
    const statusColor = getStatusCodeColor(response2.status);
    const requestInfo = (parsedRequest == null ? void 0 : parsedRequest.operationName) ? `${parsedRequest == null ? void 0 : parsedRequest.operationType} ${parsedRequest == null ? void 0 : parsedRequest.operationName}` : `anonymous ${parsedRequest == null ? void 0 : parsedRequest.operationType}`;
    console.groupCollapsed(devUtils.formatMessage("%s %s (%c%s%c)"), getTimestamp(), `${requestInfo}`, `color:${statusColor}`, `${response2.status} ${response2.statusText}`, "color:inherit");
    console.log("Request:", loggedRequest);
    console.log("Handler:", this);
    console.log("Response:", loggedResponse);
    console.groupEnd();
  }
};
var MAX_MATCH_SCORE = 3;
var MAX_SUGGESTION_COUNT = 4;
var TYPE_MATCH_DELTA = 0.5;
function groupHandlersByType(handlers2) {
  return handlers2.reduce((groups, handler) => {
    if (handler instanceof RestHandler) {
      groups.rest.push(handler);
    }
    if (handler instanceof GraphQLHandler) {
      groups.graphql.push(handler);
    }
    return groups;
  }, {
    rest: [],
    graphql: []
  });
}
function getRestHandlerScore() {
  return (request, handler) => {
    const { path, method } = handler.info;
    if (path instanceof RegExp || method instanceof RegExp) {
      return Infinity;
    }
    const hasSameMethod = isStringEqual(request.method, method);
    const methodScoreDelta = hasSameMethod ? TYPE_MATCH_DELTA : 0;
    const requestPublicUrl = getPublicUrlFromRequest(request);
    const score = (0, import_js_levenshtein.default)(requestPublicUrl, path);
    return score - methodScoreDelta;
  };
}
function getGraphQLHandlerScore(parsedQuery) {
  return (_, handler) => {
    if (typeof parsedQuery.operationName === "undefined") {
      return Infinity;
    }
    const { operationType, operationName } = handler.info;
    if (typeof operationName !== "string") {
      return Infinity;
    }
    const hasSameOperationType = parsedQuery.operationType === operationType;
    const operationTypeScoreDelta = hasSameOperationType ? TYPE_MATCH_DELTA : 0;
    const score = (0, import_js_levenshtein.default)(parsedQuery.operationName, operationName);
    return score - operationTypeScoreDelta;
  };
}
function getSuggestedHandler(request, handlers2, getScore) {
  const suggestedHandlers = handlers2.reduce((suggestions, handler) => {
    const score = getScore(request, handler);
    return suggestions.concat([[score, handler]]);
  }, []).sort(([leftScore], [rightScore]) => leftScore - rightScore).filter(([score]) => score <= MAX_MATCH_SCORE).slice(0, MAX_SUGGESTION_COUNT).map(([, handler]) => handler);
  return suggestedHandlers;
}
function getSuggestedHandlersMessage(handlers2) {
  if (handlers2.length > 1) {
    return `Did you mean to request one of the following resources instead?

${handlers2.map((handler) => `  \u2022 ${handler.info.header}`).join("\n")}`;
  }
  return `Did you mean to request "${handlers2[0].info.header}" instead?`;
}
function onUnhandledRequest(request, handlers2, strategy = "warn") {
  const parsedGraphQLQuery = tryCatch(() => parseGraphQLRequest(request));
  function generateHandlerSuggestion() {
    const handlerGroups = groupHandlersByType(handlers2);
    const relevantHandlers = parsedGraphQLQuery ? handlerGroups.graphql : handlerGroups.rest;
    const suggestedHandlers = getSuggestedHandler(request, relevantHandlers, parsedGraphQLQuery ? getGraphQLHandlerScore(parsedGraphQLQuery) : getRestHandlerScore());
    return suggestedHandlers.length > 0 ? getSuggestedHandlersMessage(suggestedHandlers) : "";
  }
  function generateUnhandledRequestMessage() {
    const publicUrl = getPublicUrlFromRequest(request);
    const requestHeader = parsedGraphQLQuery ? `${parsedGraphQLQuery.operationType} ${parsedGraphQLQuery.operationName} (${request.method} ${publicUrl})` : `${request.method} ${publicUrl}`;
    const handlerSuggestion = generateHandlerSuggestion();
    const messageTemplate = [
      `captured a request without a matching request handler:`,
      `  \u2022 ${requestHeader}`,
      handlerSuggestion,
      `If you still wish to intercept this unhandled request, please create a request handler for it.
Read more: https://mswjs.io/docs/getting-started/mocks`
    ].filter(Boolean);
    return messageTemplate.join("\n\n");
  }
  function applyStrategy(strategy2) {
    const message = generateUnhandledRequestMessage();
    switch (strategy2) {
      case "error": {
        devUtils.error("Error: %s", message);
        throw new Error(devUtils.formatMessage('Cannot bypass a request when using the "error" strategy for the "onUnhandledRequest" option.'));
      }
      case "warn": {
        devUtils.warn("Warning: %s", message);
        break;
      }
      case "bypass":
        break;
      default:
        throw new Error(devUtils.formatMessage('Failed to react to an unhandled request: unknown strategy "%s". Please provide one of the supported strategies ("bypass", "warn", "error") or a custom callback function as the value of the "onUnhandledRequest" option.', strategy2));
    }
  }
  if (typeof strategy === "function") {
    strategy(request, {
      warning: applyStrategy.bind(null, "warn"),
      error: applyStrategy.bind(null, "error")
    });
    return;
  }
  applyStrategy(strategy);
}
var import_cookies2 = lib$2;
function readResponseCookies(request, response2) {
  import_cookies2.store.add(__spreadProps(__spreadValues({}, request), { url: request.url.toString() }), response2);
  import_cookies2.store.persist();
}
async function handleRequest(request, handlers2, options, emitter, handleRequestOptions) {
  var _a2, _b2, _c, _d, _e, _f;
  emitter.emit("request:start", request);
  if (request.headers.get("x-msw-bypass") === "true") {
    emitter.emit("request:end", request);
    (_a2 = handleRequestOptions == null ? void 0 : handleRequestOptions.onPassthroughResponse) == null ? void 0 : _a2.call(handleRequestOptions, request);
    return;
  }
  const [lookupError, lookupResult] = await (0, import_until2.until)(() => {
    return getResponse(request, handlers2, handleRequestOptions == null ? void 0 : handleRequestOptions.resolutionContext);
  });
  if (lookupError) {
    emitter.emit("unhandledException", lookupError, request);
    throw lookupError;
  }
  const { handler, response: response2 } = lookupResult;
  if (!handler) {
    onUnhandledRequest(request, handlers2, options.onUnhandledRequest);
    emitter.emit("request:unhandled", request);
    emitter.emit("request:end", request);
    (_b2 = handleRequestOptions == null ? void 0 : handleRequestOptions.onPassthroughResponse) == null ? void 0 : _b2.call(handleRequestOptions, request);
    return;
  }
  if (!response2) {
    devUtils.warn(`Expected response resolver to return a mocked response Object, but got %s. The original response is going to be used instead.

  \u2022 %s
    %s`, response2, handler.info.header, handler.info.callFrame);
    emitter.emit("request:end", request);
    (_c = handleRequestOptions == null ? void 0 : handleRequestOptions.onPassthroughResponse) == null ? void 0 : _c.call(handleRequestOptions, request);
    return;
  }
  if (response2.passthrough) {
    emitter.emit("request:end", request);
    (_d = handleRequestOptions == null ? void 0 : handleRequestOptions.onPassthroughResponse) == null ? void 0 : _d.call(handleRequestOptions, request);
    return;
  }
  readResponseCookies(request, response2);
  emitter.emit("request:match", request);
  const requiredLookupResult = lookupResult;
  const transformedResponse = ((_e = handleRequestOptions == null ? void 0 : handleRequestOptions.transformResponse) == null ? void 0 : _e.call(handleRequestOptions, response2)) || response2;
  (_f = handleRequestOptions == null ? void 0 : handleRequestOptions.onMockedResponse) == null ? void 0 : _f.call(handleRequestOptions, transformedResponse, requiredLookupResult);
  emitter.emit("request:end", request);
  return transformedResponse;
}
var import_headers_polyfill8 = lib$9;
function serializeResponse(source) {
  return {
    status: source.status,
    statusText: source.statusText,
    headers: (0, import_headers_polyfill8.flattenHeadersObject)((0, import_headers_polyfill8.headersToObject)(source.headers)),
    body: source.body
  };
}
var createRequestListener = (context, options) => {
  return async (event, message) => {
    const messageChannel = new WorkerChannel(event.ports[0]);
    const request = parseWorkerRequest(message.payload);
    try {
      await handleRequest(request, context.requestHandlers, options, context.emitter, {
        transformResponse,
        onPassthroughResponse() {
          messageChannel.postMessage("NOT_FOUND");
        },
        async onMockedResponse(response2, { handler, publicRequest, parsedRequest }) {
          if (response2.body instanceof ReadableStream) {
            throw new Error(devUtils.formatMessage('Failed to construct a mocked response with a "ReadableStream" body: mocked streams are not supported. Follow https://github.com/mswjs/msw/issues/1336 for more details.'));
          }
          const responseInstance = new Response(response2.body, response2);
          const responseBodyBuffer = await responseInstance.arrayBuffer();
          const responseBody = response2.body == null ? null : responseBodyBuffer;
          messageChannel.postMessage("MOCK_RESPONSE", __spreadProps(__spreadValues({}, response2), {
            body: responseBody
          }), [responseBodyBuffer]);
          if (!options.quiet) {
            context.emitter.once("response:mocked", (response3) => {
              handler.log(publicRequest, serializeResponse(response3), parsedRequest);
            });
          }
        }
      });
    } catch (error2) {
      if (error2 instanceof NetworkError) {
        messageChannel.postMessage("NETWORK_ERROR", {
          name: error2.name,
          message: error2.message
        });
        return;
      }
      if (error2 instanceof Error) {
        devUtils.error(`Uncaught exception in the request handler for "%s %s":

%s

This exception has been gracefully handled as a 500 response, however, it's strongly recommended to resolve this error, as it indicates a mistake in your code. If you wish to mock an error response, please see this guide: https://mswjs.io/docs/recipes/mocking-error-responses`, request.method, request.url, error2);
        messageChannel.postMessage("MOCK_RESPONSE", {
          status: 500,
          statusText: "Request Handler Error",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: error2.name,
            message: error2.message,
            stack: error2.stack
          })
        });
      }
    }
  };
};
function transformResponse(response2) {
  return {
    status: response2.status,
    statusText: response2.statusText,
    headers: response2.headers.all(),
    body: response2.body,
    delay: response2.delay
  };
}
async function requestIntegrityCheck(context, serviceWorker) {
  context.workerChannel.send("INTEGRITY_CHECK_REQUEST");
  const { payload: actualChecksum } = await context.events.once("INTEGRITY_CHECK_RESPONSE");
  if (actualChecksum !== "b3066ef78c2f9090b4ce87e874965995") {
    throw new Error(`Currently active Service Worker (${actualChecksum}) is behind the latest published one (${"b3066ef78c2f9090b4ce87e874965995"}).`);
  }
  return serviceWorker;
}
var import_until3 = lib$6;
function deferNetworkRequestsUntil(predicatePromise) {
  const originalXhrSend = window.XMLHttpRequest.prototype.send;
  window.XMLHttpRequest.prototype.send = function(...args) {
    (0, import_until3.until)(() => predicatePromise).then(() => {
      window.XMLHttpRequest.prototype.send = originalXhrSend;
      this.send(...args);
    });
  };
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    await (0, import_until3.until)(() => predicatePromise);
    window.fetch = originalFetch;
    return window.fetch(...args);
  };
}
function createResponseListener(context) {
  return (_, message) => {
    var _a2;
    const { payload: responseJson } = message;
    if ((_a2 = responseJson.type) == null ? void 0 : _a2.includes("opaque")) {
      return;
    }
    const response2 = new Response(responseJson.body || null, responseJson);
    const isMockedResponse = response2.headers.get("x-powered-by") === "msw";
    if (isMockedResponse) {
      context.emitter.emit("response:mocked", response2, responseJson.requestId);
    } else {
      context.emitter.emit("response:bypass", response2, responseJson.requestId);
    }
  };
}
function validateWorkerScope(registration, options) {
  if (!(options == null ? void 0 : options.quiet) && !location.href.startsWith(registration.scope)) {
    devUtils.warn(`Cannot intercept requests on this page because it's outside of the worker's scope ("${registration.scope}"). If you wish to mock API requests on this page, you must resolve this scope issue.

- (Recommended) Register the worker at the root level ("/") of your application.
- Set the "Service-Worker-Allowed" response header to allow out-of-scope workers.`);
  }
}
var createStartHandler = (context) => {
  return function start(options, customOptions) {
    const startWorkerInstance = async () => {
      context.events.removeAllListeners();
      context.workerChannel.on("REQUEST", createRequestListener(context, options));
      context.workerChannel.on("RESPONSE", createResponseListener(context));
      const instance2 = await getWorkerInstance(options.serviceWorker.url, options.serviceWorker.options, options.findWorker);
      const [worker, registration] = instance2;
      if (!worker) {
        const missingWorkerMessage = (customOptions == null ? void 0 : customOptions.findWorker) ? devUtils.formatMessage(`Failed to locate the Service Worker registration using a custom "findWorker" predicate.

Please ensure that the custom predicate properly locates the Service Worker registration at "%s".
More details: https://mswjs.io/docs/api/setup-worker/start#findworker
`, options.serviceWorker.url) : devUtils.formatMessage(`Failed to locate the Service Worker registration.

This most likely means that the worker script URL "%s" cannot resolve against the actual public hostname (%s). This may happen if your application runs behind a proxy, or has a dynamic hostname.

Please consider using a custom "serviceWorker.url" option to point to the actual worker script location, or a custom "findWorker" option to resolve the Service Worker registration manually. More details: https://mswjs.io/docs/api/setup-worker/start`, options.serviceWorker.url, location.host);
        throw new Error(missingWorkerMessage);
      }
      context.worker = worker;
      context.registration = registration;
      context.events.addListener(window, "beforeunload", () => {
        if (worker.state !== "redundant") {
          context.workerChannel.send("CLIENT_CLOSED");
        }
        window.clearInterval(context.keepAliveInterval);
      });
      const [integrityError] = await (0, import_until4.until)(() => requestIntegrityCheck(context, worker));
      if (integrityError) {
        devUtils.error(`Detected outdated Service Worker: ${integrityError.message}

The mocking is still enabled, but it's highly recommended that you update your Service Worker by running:

$ npx msw init <PUBLIC_DIR>

This is necessary to ensure that the Service Worker is in sync with the library to guarantee its stability.
If this message still persists after updating, please report an issue: https://github.com/open-draft/msw/issues      `);
      }
      context.keepAliveInterval = window.setInterval(() => context.workerChannel.send("KEEPALIVE_REQUEST"), 5e3);
      validateWorkerScope(registration, context.startOptions);
      return registration;
    };
    const workerRegistration = startWorkerInstance().then(async (registration) => {
      const pendingInstance = registration.installing || registration.waiting;
      if (pendingInstance) {
        await new Promise((resolve) => {
          pendingInstance.addEventListener("statechange", () => {
            if (pendingInstance.state === "activated") {
              return resolve();
            }
          });
        });
      }
      await enableMocking(context, options).catch((error2) => {
        throw new Error(`Failed to enable mocking: ${error2 == null ? void 0 : error2.message}`);
      });
      return registration;
    });
    if (options.waitUntilReady) {
      deferNetworkRequestsUntil(workerRegistration);
    }
    return workerRegistration;
  };
};
function printStopMessage(args = {}) {
  if (args.quiet) {
    return;
  }
  console.log(`%c${devUtils.formatMessage("Mocking disabled.")}`, "color:orangered;font-weight:bold;");
}
var createStop = (context) => {
  return function stop() {
    var _a2;
    if (!context.isMockingEnabled) {
      devUtils.warn('Found a redundant "worker.stop()" call. Note that stopping the worker while mocking already stopped has no effect. Consider removing this "worker.stop()" call.');
      return;
    }
    context.workerChannel.send("MOCK_DEACTIVATE");
    context.isMockingEnabled = false;
    window.clearInterval(context.keepAliveInterval);
    printStopMessage({ quiet: (_a2 = context.startOptions) == null ? void 0 : _a2.quiet });
  };
};
function use(currentHandlers, ...handlers2) {
  currentHandlers.unshift(...handlers2);
}
function restoreHandlers(handlers2) {
  handlers2.forEach((handler) => {
    handler.markAsSkipped(false);
  });
}
function resetHandlers(initialHandlers, ...nextHandlers) {
  return nextHandlers.length > 0 ? [...nextHandlers] : [...initialHandlers];
}
var DEFAULT_START_OPTIONS = {
  serviceWorker: {
    url: "/mockServiceWorker.js",
    options: null
  },
  quiet: false,
  waitUntilReady: true,
  onUnhandledRequest: "warn",
  findWorker(scriptURL, mockServiceWorkerUrl) {
    return scriptURL === mockServiceWorkerUrl;
  }
};
function resolveStartOptions(initialOptions) {
  return mergeRight(DEFAULT_START_OPTIONS, initialOptions || {});
}
function prepareStartHandler(handler, context) {
  return (initialOptions) => {
    context.startOptions = resolveStartOptions(initialOptions);
    return handler(context.startOptions, initialOptions || {});
  };
}
var import_interceptors4 = lib$4;
var import_fetch3 = requireFetch();
var import_XMLHttpRequest = requireXMLHttpRequest();
var import_interceptors3 = lib$4;
var noop = () => {
  throw new Error("Not implemented");
};
function createResponseFromIsomorphicResponse(response2) {
  return __spreadProps(__spreadValues({}, response2), {
    ok: response2.status >= 200 && response2.status < 300,
    url: "",
    type: "default",
    status: response2.status,
    statusText: response2.statusText,
    headers: response2.headers,
    body: new ReadableStream(),
    redirected: response2.headers.get("Location") != null,
    async text() {
      return response2.body || "";
    },
    async json() {
      return JSON.parse(response2.body || "");
    },
    async arrayBuffer() {
      return (0, import_interceptors3.encodeBuffer)(response2.body || "");
    },
    bodyUsed: false,
    formData: noop,
    blob: noop,
    clone: noop
  });
}
function createFallbackRequestListener(context, options) {
  const interceptor = new import_interceptors4.BatchInterceptor({
    name: "fallback",
    interceptors: [new import_fetch3.FetchInterceptor(), new import_XMLHttpRequest.XMLHttpRequestInterceptor()]
  });
  interceptor.on("request", async (request) => {
    const mockedRequest = new MockedRequest(request.url, __spreadProps(__spreadValues({}, request), {
      body: await request.arrayBuffer()
    }));
    const response2 = await handleRequest(mockedRequest, context.requestHandlers, options, context.emitter, {
      transformResponse(response3) {
        return {
          status: response3.status,
          statusText: response3.statusText,
          headers: response3.headers.all(),
          body: response3.body,
          delay: response3.delay
        };
      },
      onMockedResponse(_, { handler, publicRequest, parsedRequest }) {
        if (!options.quiet) {
          context.emitter.once("response:mocked", (response3) => {
            handler.log(publicRequest, serializeResponse(response3), parsedRequest);
          });
        }
      }
    });
    if (response2) {
      request.respondWith(response2);
    }
  });
  interceptor.on("response", (request, response2) => {
    if (!request.id) {
      return;
    }
    const browserResponse = createResponseFromIsomorphicResponse(response2);
    if (response2.headers.get("x-powered-by") === "msw") {
      context.emitter.emit("response:mocked", browserResponse, request.id);
    } else {
      context.emitter.emit("response:bypass", browserResponse, request.id);
    }
  });
  interceptor.apply();
  return interceptor;
}
function createFallbackStart(context) {
  return async function start(options) {
    context.fallbackInterceptor = createFallbackRequestListener(context, options);
    printStartMessage({
      message: "Mocking enabled (fallback mode).",
      quiet: options.quiet
    });
    return void 0;
  };
}
function createFallbackStop(context) {
  return function stop() {
    var _a2, _b2;
    (_a2 = context.fallbackInterceptor) == null ? void 0 : _a2.dispose();
    printStopMessage({ quiet: (_b2 = context.startOptions) == null ? void 0 : _b2.quiet });
  };
}
function pipeEvents(source, destination) {
  const rawEmit = source.emit;
  if (rawEmit._isPiped) {
    return;
  }
  source.emit = function(event, ...data2) {
    destination.emit(event, ...data2);
    return rawEmit.call(this, event, ...data2);
  };
  source.emit._isPiped = true;
}
function toReadonlyArray(source) {
  const clone = [...source];
  Object.freeze(clone);
  return clone;
}
var listeners2 = [];
function setupWorker(...requestHandlers) {
  requestHandlers.forEach((handler) => {
    if (Array.isArray(handler))
      throw new Error(devUtils.formatMessage('Failed to call "setupWorker" given an Array of request handlers (setupWorker([a, b])), expected to receive each handler individually: setupWorker(a, b).'));
  });
  if ((0, import_is_node_process3.isNodeProcess)()) {
    throw new Error(devUtils.formatMessage("Failed to execute `setupWorker` in a non-browser environment. Consider using `setupServer` for Node.js environment instead."));
  }
  const emitter = new import_strict_event_emitter.StrictEventEmitter();
  const publicEmitter = new import_strict_event_emitter.StrictEventEmitter();
  pipeEvents(emitter, publicEmitter);
  const context = {
    isMockingEnabled: false,
    startOptions: void 0,
    worker: null,
    registration: null,
    requestHandlers: [...requestHandlers],
    emitter,
    workerChannel: {
      on(eventType, callback) {
        context.events.addListener(navigator.serviceWorker, "message", (event) => {
          if (event.source !== context.worker) {
            return;
          }
          const message = event.data;
          if (!message) {
            return;
          }
          if (message.type === eventType) {
            callback(event, message);
          }
        });
      },
      send(type) {
        var _a2;
        (_a2 = context.worker) == null ? void 0 : _a2.postMessage(type);
      }
    },
    events: {
      addListener(target, eventType, callback) {
        target.addEventListener(eventType, callback);
        listeners2.push({ eventType, target, callback });
        return () => {
          target.removeEventListener(eventType, callback);
        };
      },
      removeAllListeners() {
        for (const { target, eventType, callback } of listeners2) {
          target.removeEventListener(eventType, callback);
        }
        listeners2 = [];
      },
      once(eventType) {
        const bindings = [];
        return new Promise((resolve, reject) => {
          const handleIncomingMessage = (event) => {
            try {
              const message = event.data;
              if (message.type === eventType) {
                resolve(message);
              }
            } catch (error2) {
              reject(error2);
            }
          };
          bindings.push(context.events.addListener(navigator.serviceWorker, "message", handleIncomingMessage), context.events.addListener(navigator.serviceWorker, "messageerror", reject));
        }).finally(() => {
          bindings.forEach((unbind) => unbind());
        });
      }
    },
    useFallbackMode: !("serviceWorker" in navigator) || location.protocol === "file:"
  };
  const startHandler = context.useFallbackMode ? createFallbackStart(context) : createStartHandler(context);
  const stopHandler = context.useFallbackMode ? createFallbackStop(context) : createStop(context);
  return {
    start: prepareStartHandler(startHandler, context),
    stop() {
      context.events.removeAllListeners();
      context.emitter.removeAllListeners();
      publicEmitter.removeAllListeners();
      stopHandler();
    },
    use(...handlers2) {
      use(context.requestHandlers, ...handlers2);
    },
    restoreHandlers() {
      restoreHandlers(context.requestHandlers);
    },
    resetHandlers(...nextHandlers) {
      context.requestHandlers = resetHandlers(requestHandlers, ...nextHandlers);
    },
    listHandlers() {
      return toReadonlyArray(context.requestHandlers);
    },
    printHandlers() {
      const handlers2 = this.listHandlers();
      handlers2.forEach((handler) => {
        const { header, callFrame } = handler.info;
        const pragma = handler.info.hasOwnProperty("operationType") ? "[graphql]" : "[rest]";
        console.groupCollapsed(`${pragma} ${header}`);
        if (callFrame) {
          console.log(`Declaration: ${callFrame}`);
        }
        console.log("Handler:", handler);
        if (handler instanceof RestHandler) {
          console.log("Match:", `https://mswjs.io/repl?path=${handler.info.path}`);
        }
        console.groupEnd();
      });
    },
    events: {
      on(...args) {
        return publicEmitter.on(...args);
      },
      removeListener(...args) {
        return publicEmitter.removeListener(...args);
      },
      removeAllListeners(...args) {
        return publicEmitter.removeAllListeners(...args);
      }
    }
  };
}
function createRestHandler(method) {
  return (path, resolver) => {
    return new RestHandler(method, path, resolver);
  };
}
var rest = {
  all: createRestHandler(/.+/),
  head: createRestHandler("HEAD"),
  get: createRestHandler("GET"),
  post: createRestHandler("POST"),
  put: createRestHandler("PUT"),
  delete: createRestHandler("DELETE"),
  patch: createRestHandler("PATCH"),
  options: createRestHandler("OPTIONS")
};
function createScopedGraphQLHandler(operationType, url) {
  return (operationName, resolver) => {
    return new GraphQLHandler(operationType, operationName, url, resolver);
  };
}
function createGraphQLOperationHandler(url) {
  return (resolver) => {
    return new GraphQLHandler("all", new RegExp(".*"), url, resolver);
  };
}
var standardGraphQLHandlers = {
  operation: createGraphQLOperationHandler("*"),
  query: createScopedGraphQLHandler("query", "*"),
  mutation: createScopedGraphQLHandler("mutation", "*")
};
function createGraphQLLink(url) {
  return {
    operation: createGraphQLOperationHandler(url),
    query: createScopedGraphQLHandler("query", url),
    mutation: createScopedGraphQLHandler("mutation", url)
  };
}
var graphql = __spreadProps(__spreadValues({}, standardGraphQLHandlers), {
  link: createGraphQLLink
});
const MSW_LIST_KEY = "__MSW_LOCAL_LIST__";
const MSW_ALL_STATUS = "__MSW_ALL_STATUS__";
const MSW_GLOBAL_STATUS = "__MSW_GLOBAL_STATUS__";
const MSW_REQUEST_TIME = "__MSW_REQUEST_TIME__";
const MSW_REQUEST_FAIL_RATIO = "__MSW_REQUEST_FAIL_RATIO__";
const MSW_RESPONSE_STATUS_CODE = "__MSW_RESPONSE_STATUS_CODE__";
function getStatus(failRatio) {
  return Math.random() * 100 > failRatio ? 200 : 500;
}
function getList(arr) {
  let local = localStorage.getItem(MSW_LIST_KEY);
  let list = local && JSON.parse(local) || [];
  arr = arr || list;
  arr = arr.filter((item) => item.checked);
  if (localStorage.getItem(MSW_GLOBAL_STATUS) !== "1" || !arr.length)
    return [];
  console.log(arr);
  let reqTimes = localStorage.getItem(MSW_REQUEST_TIME) || 1e3;
  let failRatio = localStorage.getItem(MSW_REQUEST_FAIL_RATIO) || 0;
  failRatio = +failRatio > 100 ? 100 : failRatio;
  let reqStatus = getStatus(failRatio);
  localStorage.setItem(MSW_RESPONSE_STATUS_CODE, reqStatus);
  let reqList = arr.map((item) => {
    return lib.rest.all(item.url, (req, res, ctx) => {
      let commonRes = [
        ctx.set("Content-Type", "application/json"),
        ctx.status(reqStatus),
        ctx.delay(+reqTimes)
      ];
      if (reqStatus === 200) {
        return res(...commonRes, ctx.json(JSON.parse(item.data)));
      }
      if (reqStatus === 500) {
        return res(
          ...commonRes,
          ctx.json({
            code: -1,
            msg: "error"
          })
        );
      }
    });
  });
  console.log(reqList);
  return reqList;
}
function jsonDownload(json2) {
  let data2 = JSON.stringify(json2, null, 4);
  let blob = new Blob([data2], { type: "text/json;charset=utf-8" });
  let link = window.URL.createObjectURL(blob);
  let a = document.createElement("a");
  a.href = link;
  a.download = `msw-tools-json-data-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(link);
}
function fileToJson(file) {
  return new Promise((resolve, reject) => {
    let fileReader = new FileReader();
    fileReader.readAsText(file, "utf-8");
    fileReader.onload = function(e) {
      let { result } = fileReader;
      if (result) {
        resolve(result);
      } else {
        reject();
      }
    };
  });
}
const handlers = [...getList()];
const mocker = lib.setupWorker(...handlers);
const tabs = [
  {
    name: "\u63A7\u5236\u53F0",
    code: "01"
  },
  {
    name: "Mack\u914D\u7F6E",
    code: "02"
  },
  {
    name: "\u6570\u636E\u5217\u8868",
    code: "03"
  }
];
const rests = [
  {
    value: "all",
    label: "all"
  },
  {
    value: "get",
    label: "get"
  },
  {
    value: "post",
    label: "post"
  },
  {
    value: "put",
    label: "put"
  },
  {
    value: "patch",
    label: "patch"
  },
  {
    value: "delete",
    label: "delete"
  },
  {
    value: "options",
    label: "options"
  }
];
function get_each_context(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[53] = list[i];
  child_ctx[54] = list;
  child_ctx[55] = i;
  return child_ctx;
}
function get_each_context_1(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[56] = list[i].value;
  child_ctx[57] = list[i].label;
  return child_ctx;
}
function get_each_context_2(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[60] = list[i].name;
  child_ctx[61] = list[i].code;
  child_ctx[55] = i;
  return child_ctx;
}
function create_if_block(ctx) {
  let div0;
  let div0_transition;
  let t0;
  let div7;
  let h2;
  let t1;
  let div1;
  let t3;
  let div6;
  let div4;
  let div2;
  let each_blocks = [];
  let each_1_lookup = /* @__PURE__ */ new Map();
  let t4;
  let div3;
  let a;
  let t6;
  let div5;
  let t7;
  let t8;
  let div7_transition;
  let current;
  let mounted;
  let dispose;
  let each_value_2 = tabs;
  const get_key = (ctx2) => ctx2[61];
  for (let i = 0; i < each_value_2.length; i += 1) {
    let child_ctx = get_each_context_2(ctx, each_value_2, i);
    let key = get_key(child_ctx);
    each_1_lookup.set(key, each_blocks[i] = create_each_block_2(key, child_ctx));
  }
  let if_block0 = ctx[1] === "01" && create_if_block_4(ctx);
  let if_block1 = ctx[1] === "02" && create_if_block_2(ctx);
  let if_block2 = ctx[1] === "03" && create_if_block_1(ctx);
  return {
    c() {
      div0 = element("div");
      t0 = space();
      div7 = element("div");
      h2 = element("h2");
      t1 = text$1("MSW-TOOLS\u63A7\u5236\u53F0\r\n        ");
      div1 = element("div");
      div1.textContent = "X";
      t3 = space();
      div6 = element("div");
      div4 = element("div");
      div2 = element("div");
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }
      t4 = space();
      div3 = element("div");
      a = element("a");
      a.textContent = "\u914D \u7F6E";
      t6 = space();
      div5 = element("div");
      if (if_block0)
        if_block0.c();
      t7 = space();
      if (if_block1)
        if_block1.c();
      t8 = space();
      if (if_block2)
        if_block2.c();
      attr(div0, "class", "msw-mask");
      attr(div1, "class", "msw-close");
      attr(h2, "class", "msw-title");
      attr(div2, "class", "msw-tabs-inner");
      attr(a, "href", null);
      attr(a, "class", "msw-reset");
      attr(div3, "class", "msw-tabs-handle");
      attr(div4, "class", "msw-tabs-head");
      attr(div5, "class", "msw-tabs-body");
      attr(div6, "class", "msw-tabs");
      attr(div7, "class", "msw-box");
    },
    m(target, anchor) {
      insert(target, div0, anchor);
      insert(target, t0, anchor);
      insert(target, div7, anchor);
      append(div7, h2);
      append(h2, t1);
      append(h2, div1);
      append(div7, t3);
      append(div7, div6);
      append(div6, div4);
      append(div4, div2);
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].m(div2, null);
      }
      append(div4, t4);
      append(div4, div3);
      append(div3, a);
      append(div6, t6);
      append(div6, div5);
      if (if_block0)
        if_block0.m(div5, null);
      append(div5, t7);
      if (if_block1)
        if_block1.m(div5, null);
      append(div5, t8);
      if (if_block2)
        if_block2.m(div5, null);
      current = true;
      if (!mounted) {
        dispose = [
          listen(div0, "click", stop_propagation(ctx[17])),
          listen(div1, "click", stop_propagation(ctx[17])),
          listen(a, "click", ctx[19])
        ];
        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      if (dirty[0] & 262146) {
        each_value_2 = tabs;
        each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_2, each_1_lookup, div2, destroy_block, create_each_block_2, null, get_each_context_2);
      }
      if (ctx[1] === "01") {
        if (if_block0) {
          if_block0.p(ctx, dirty);
        } else {
          if_block0 = create_if_block_4(ctx);
          if_block0.c();
          if_block0.m(div5, t7);
        }
      } else if (if_block0) {
        if_block0.d(1);
        if_block0 = null;
      }
      if (ctx[1] === "02") {
        if (if_block1) {
          if_block1.p(ctx, dirty);
        } else {
          if_block1 = create_if_block_2(ctx);
          if_block1.c();
          if_block1.m(div5, t8);
        }
      } else if (if_block1) {
        if_block1.d(1);
        if_block1 = null;
      }
      if (ctx[1] === "03") {
        if (if_block2) {
          if_block2.p(ctx, dirty);
        } else {
          if_block2 = create_if_block_1(ctx);
          if_block2.c();
          if_block2.m(div5, null);
        }
      } else if (if_block2) {
        if_block2.d(1);
        if_block2 = null;
      }
    },
    i(local) {
      if (current)
        return;
      add_render_callback(() => {
        if (!div0_transition)
          div0_transition = create_bidirectional_transition(div0, fade, { delay: 200, duration: 200 }, true);
        div0_transition.run(1);
      });
      add_render_callback(() => {
        if (!div7_transition)
          div7_transition = create_bidirectional_transition(
            div7,
            slide,
            {
              delay: 250,
              duration: 300,
              easing: quintOut
            },
            true
          );
        div7_transition.run(1);
      });
      current = true;
    },
    o(local) {
      if (!div0_transition)
        div0_transition = create_bidirectional_transition(div0, fade, { delay: 200, duration: 200 }, false);
      div0_transition.run(0);
      if (!div7_transition)
        div7_transition = create_bidirectional_transition(
          div7,
          slide,
          {
            delay: 250,
            duration: 300,
            easing: quintOut
          },
          false
        );
      div7_transition.run(0);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(div0);
      if (detaching && div0_transition)
        div0_transition.end();
      if (detaching)
        detach(t0);
      if (detaching)
        detach(div7);
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].d();
      }
      if (if_block0)
        if_block0.d();
      if (if_block1)
        if_block1.d();
      if (if_block2)
        if_block2.d();
      if (detaching && div7_transition)
        div7_transition.end();
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_each_block_2(key_1, ctx) {
  let div;
  let t_value = ctx[60] + "";
  let t;
  let div_class_value;
  let mounted;
  let dispose;
  return {
    key: key_1,
    first: null,
    c() {
      div = element("div");
      t = text$1(t_value);
      attr(div, "class", div_class_value = "msw-tabs-item " + (ctx[61] === ctx[1] ? "active" : ""));
      this.first = div;
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, t);
      if (!mounted) {
        dispose = listen(div, "click", ctx[18].bind(null, ctx[61]));
        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      if (dirty[0] & 2 && div_class_value !== (div_class_value = "msw-tabs-item " + (ctx[61] === ctx[1] ? "active" : ""))) {
        attr(div, "class", div_class_value);
      }
    },
    d(detaching) {
      if (detaching)
        detach(div);
      mounted = false;
      dispose();
    }
  };
}
function create_if_block_4(ctx) {
  let div12;
  let div11;
  let div0;
  let a0;
  let t1;
  let label;
  let input0;
  let t2;
  let t3;
  let div2;
  let div1;
  let t5;
  let input1;
  let t6;
  let div4;
  let div3;
  let t8;
  let input2;
  let t9;
  let div6;
  let div5;
  let t10;
  let span;
  let t11;
  let t12;
  let t13;
  let span_class_value;
  let t14;
  let div8;
  let div7;
  let t16;
  let a1;
  let t18;
  let input3;
  let t19;
  let div10;
  let div9;
  let t21;
  let a2;
  let t23;
  let t24;
  let mounted;
  let dispose;
  let if_block0 = !ctx[15] && create_if_block_6();
  let if_block1 = ctx[8] && create_if_block_5(ctx);
  return {
    c() {
      div12 = element("div");
      div11 = element("div");
      div0 = element("div");
      a0 = element("a");
      a0.textContent = "\u6E05\u9664\u6570\u636E\u5E93";
      t1 = space();
      label = element("label");
      input0 = element("input");
      t2 = text$1("\r\n                    \u5168\u5C40\u5F00\u542F");
      t3 = space();
      div2 = element("div");
      div1 = element("div");
      div1.textContent = "\u8BF7\u6C42\u6700\u77ED\u65F6\u95F4(ms)";
      t5 = space();
      input1 = element("input");
      t6 = space();
      div4 = element("div");
      div3 = element("div");
      div3.textContent = "\u8BF7\u6C42\u5931\u8D25\u6BD4\u4F8B(%)";
      t8 = space();
      input2 = element("input");
      t9 = space();
      div6 = element("div");
      div5 = element("div");
      t10 = text$1("\u5F53\u524D\u72B6\u6001\u7801\r\n                    ");
      span = element("span");
      t11 = text$1("[ ");
      t12 = text$1(ctx[4]);
      t13 = text$1(" ]");
      t14 = space();
      div8 = element("div");
      div7 = element("div");
      div7.textContent = "Mock\u6570\u636E\u5BFC\u5165(json\u6587\u4EF6)";
      t16 = space();
      a1 = element("a");
      a1.textContent = "\u5BFC \u5165";
      t18 = space();
      input3 = element("input");
      t19 = space();
      div10 = element("div");
      div9 = element("div");
      div9.textContent = "Mock\u6570\u636E\u5BFC\u51FA(json\u6587\u4EF6)";
      t21 = space();
      a2 = element("a");
      a2.textContent = "\u5BFC \u51FA";
      t23 = space();
      if (if_block0)
        if_block0.c();
      t24 = space();
      if (if_block1)
        if_block1.c();
      attr(a0, "href", null);
      attr(a0, "class", "msw-handle-clear");
      attr(input0, "type", "checkbox");
      attr(label, "class", "msw-handle-li-global");
      attr(div0, "class", "msw-handle-li");
      attr(div1, "class", "msw-handle-label");
      attr(input1, "type", "text");
      attr(input1, "class", "msw-handle-input");
      attr(input1, "placeholder", "\u9ED8\u8BA4 1000 ");
      attr(div2, "class", "msw-handle-li");
      attr(div3, "class", "msw-handle-label");
      attr(input2, "type", "text");
      attr(input2, "class", "msw-handle-input");
      attr(input2, "placeholder", "\u9ED8\u8BA4 0 ");
      attr(div4, "class", "msw-handle-li");
      attr(span, "class", span_class_value = "status-code " + (+ctx[4] === 200 ? "" : "error"));
      attr(div5, "class", "msw-handle-label");
      attr(div6, "class", "msw-handle-li");
      attr(div7, "class", "msw-handle-label");
      attr(a1, "href", null);
      attr(a1, "class", "msw-handle-export");
      attr(input3, "type", "file");
      attr(input3, "class", "msw-handle-input");
      set_style(input3, "display", "none");
      attr(input3, "accept", ".json");
      attr(input3, "placeholder", "\u9009\u62E9\u6587\u4EF6");
      attr(div8, "class", "msw-handle-li");
      attr(div9, "class", "msw-handle-label");
      attr(a2, "href", null);
      attr(a2, "class", "msw-handle-export");
      attr(div10, "class", "msw-handle-li");
      attr(div11, "class", "msw-handle-wrap");
      attr(div12, "class", "msw-tabs-wrap");
    },
    m(target, anchor) {
      insert(target, div12, anchor);
      append(div12, div11);
      append(div11, div0);
      append(div0, a0);
      append(div0, t1);
      append(div0, label);
      append(label, input0);
      input0.checked = ctx[12];
      append(label, t2);
      append(div11, t3);
      append(div11, div2);
      append(div2, div1);
      append(div2, t5);
      append(div2, input1);
      set_input_value(input1, ctx[2]);
      append(div11, t6);
      append(div11, div4);
      append(div4, div3);
      append(div4, t8);
      append(div4, input2);
      set_input_value(input2, ctx[3]);
      append(div11, t9);
      append(div11, div6);
      append(div6, div5);
      append(div5, t10);
      append(div5, span);
      append(span, t11);
      append(span, t12);
      append(span, t13);
      append(div11, t14);
      append(div11, div8);
      append(div8, div7);
      append(div8, t16);
      append(div8, a1);
      append(div8, t18);
      append(div8, input3);
      ctx[36](input3);
      append(div11, t19);
      append(div11, div10);
      append(div10, div9);
      append(div10, t21);
      append(div10, a2);
      append(div11, t23);
      if (if_block0)
        if_block0.m(div11, null);
      append(div11, t24);
      if (if_block1)
        if_block1.m(div11, null);
      if (!mounted) {
        dispose = [
          listen(a0, "click", ctx[20]),
          listen(input0, "change", ctx[32]),
          listen(input0, "change", ctx[33]),
          listen(input1, "input", ctx[34]),
          listen(input1, "focusout", ctx[22].bind(null, "time")),
          listen(input2, "input", ctx[35]),
          listen(input2, "focusout", ctx[22].bind(null, "fail")),
          listen(a1, "click", ctx[24]),
          listen(input3, "change", ctx[23]),
          listen(a2, "click", ctx[25])
        ];
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (dirty[0] & 4096) {
        input0.checked = ctx2[12];
      }
      if (dirty[0] & 4 && input1.value !== ctx2[2]) {
        set_input_value(input1, ctx2[2]);
      }
      if (dirty[0] & 8 && input2.value !== ctx2[3]) {
        set_input_value(input2, ctx2[3]);
      }
      if (dirty[0] & 16)
        set_data(t12, ctx2[4]);
      if (dirty[0] & 16 && span_class_value !== (span_class_value = "status-code " + (+ctx2[4] === 200 ? "" : "error"))) {
        attr(span, "class", span_class_value);
      }
      if (!ctx2[15])
        if_block0.p(ctx2, dirty);
      if (ctx2[8]) {
        if (if_block1) {
          if_block1.p(ctx2, dirty);
        } else {
          if_block1 = create_if_block_5(ctx2);
          if_block1.c();
          if_block1.m(div11, null);
        }
      } else if (if_block1) {
        if_block1.d(1);
        if_block1 = null;
      }
    },
    d(detaching) {
      if (detaching)
        detach(div12);
      ctx[36](null);
      if (if_block0)
        if_block0.d();
      if (if_block1)
        if_block1.d();
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_if_block_6(ctx) {
  let div1;
  let div0;
  let mounted;
  let dispose;
  return {
    c() {
      div1 = element("div");
      div0 = element("div");
      div0.textContent = "\u261EFetch: [GET /test]\u261C";
      attr(div0, "class", "msw-handle-test");
      attr(div1, "class", "msw-handle-li");
    },
    m(target, anchor) {
      insert(target, div1, anchor);
      append(div1, div0);
      if (!mounted) {
        dispose = listen(div0, "click", getData);
        mounted = true;
      }
    },
    p: noop$1,
    d(detaching) {
      if (detaching)
        detach(div1);
      mounted = false;
      dispose();
    }
  };
}
function create_if_block_5(ctx) {
  let div;
  let t;
  let div_class_value;
  return {
    c() {
      div = element("div");
      t = text$1(ctx[9]);
      attr(div, "class", div_class_value = "msw-config-tips " + (ctx[10] === "error" ? "error" : "success"));
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, t);
    },
    p(ctx2, dirty) {
      if (dirty[0] & 512)
        set_data(t, ctx2[9]);
      if (dirty[0] & 1024 && div_class_value !== (div_class_value = "msw-config-tips " + (ctx2[10] === "error" ? "error" : "success"))) {
        attr(div, "class", div_class_value);
      }
    },
    d(detaching) {
      if (detaching)
        detach(div);
    }
  };
}
function create_if_block_2(ctx) {
  let div1;
  let div0;
  let select;
  let each_blocks = [];
  let each_1_lookup = /* @__PURE__ */ new Map();
  let t0;
  let input;
  let t1;
  let a;
  let t3;
  let textarea;
  let t4;
  let mounted;
  let dispose;
  let each_value_1 = rests;
  const get_key = (ctx2) => ctx2[56];
  for (let i = 0; i < each_value_1.length; i += 1) {
    let child_ctx = get_each_context_1(ctx, each_value_1, i);
    let key = get_key(child_ctx);
    each_1_lookup.set(key, each_blocks[i] = create_each_block_1(key, child_ctx));
  }
  let if_block = ctx[8] && create_if_block_3(ctx);
  return {
    c() {
      div1 = element("div");
      div0 = element("div");
      select = element("select");
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }
      t0 = space();
      input = element("input");
      t1 = space();
      a = element("a");
      a.textContent = "\u4FDD \u5B58";
      t3 = space();
      textarea = element("textarea");
      t4 = space();
      if (if_block)
        if_block.c();
      attr(select, "class", "msw-method");
      attr(select, "name", "method");
      if (ctx[5] === void 0)
        add_render_callback(() => ctx[37].call(select));
      attr(input, "type", "text");
      attr(input, "class", "msw-config-input");
      attr(input, "placeholder", "/paths");
      attr(a, "href", null);
      attr(a, "class", "msw-config-add");
      attr(div0, "class", "msw-config");
      attr(textarea, "class", "msw-config-data");
      attr(textarea, "placeholder", "Mock\u6570\u636E\u5185\u5BB9");
      attr(textarea, "cols", "100");
      attr(textarea, "rows", "30");
      attr(div1, "class", "msw-tabs-wrap");
    },
    m(target, anchor) {
      insert(target, div1, anchor);
      append(div1, div0);
      append(div0, select);
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].m(select, null);
      }
      select_option(select, ctx[5]);
      append(div0, t0);
      append(div0, input);
      set_input_value(input, ctx[6]);
      append(div0, t1);
      append(div0, a);
      append(div1, t3);
      append(div1, textarea);
      set_input_value(textarea, ctx[7]);
      append(div1, t4);
      if (if_block)
        if_block.m(div1, null);
      if (!mounted) {
        dispose = [
          listen(select, "change", ctx[37]),
          listen(input, "input", ctx[38]),
          listen(a, "click", ctx[26]),
          listen(textarea, "input", ctx[39])
        ];
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (dirty & 0) {
        each_value_1 = rests;
        each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx2, each_value_1, each_1_lookup, select, destroy_block, create_each_block_1, null, get_each_context_1);
      }
      if (dirty[0] & 32) {
        select_option(select, ctx2[5]);
      }
      if (dirty[0] & 64 && input.value !== ctx2[6]) {
        set_input_value(input, ctx2[6]);
      }
      if (dirty[0] & 128) {
        set_input_value(textarea, ctx2[7]);
      }
      if (ctx2[8]) {
        if (if_block) {
          if_block.p(ctx2, dirty);
        } else {
          if_block = create_if_block_3(ctx2);
          if_block.c();
          if_block.m(div1, null);
        }
      } else if (if_block) {
        if_block.d(1);
        if_block = null;
      }
    },
    d(detaching) {
      if (detaching)
        detach(div1);
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].d();
      }
      if (if_block)
        if_block.d();
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_each_block_1(key_1, ctx) {
  let option;
  let t_value = ctx[57] + "";
  let t;
  return {
    key: key_1,
    first: null,
    c() {
      option = element("option");
      t = text$1(t_value);
      option.__value = ctx[56];
      option.value = option.__value;
      this.first = option;
    },
    m(target, anchor) {
      insert(target, option, anchor);
      append(option, t);
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
    },
    d(detaching) {
      if (detaching)
        detach(option);
    }
  };
}
function create_if_block_3(ctx) {
  let div;
  let t;
  let div_class_value;
  return {
    c() {
      div = element("div");
      t = text$1(ctx[9]);
      attr(div, "class", div_class_value = "msw-config-tips " + (ctx[10] === "error" ? "error" : "success"));
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, t);
    },
    p(ctx2, dirty) {
      if (dirty[0] & 512)
        set_data(t, ctx2[9]);
      if (dirty[0] & 1024 && div_class_value !== (div_class_value = "msw-config-tips " + (ctx2[10] === "error" ? "error" : "success"))) {
        attr(div, "class", div_class_value);
      }
    },
    d(detaching) {
      if (detaching)
        detach(div);
    }
  };
}
function create_if_block_1(ctx) {
  let div;
  let table;
  let thead;
  let tr;
  let th0;
  let t1;
  let th1;
  let t3;
  let th2;
  let t5;
  let th3;
  let t7;
  let th4;
  let label;
  let input;
  let t8;
  let t9;
  let th5;
  let t11;
  let tbody;
  let each_blocks = [];
  let each_1_lookup = /* @__PURE__ */ new Map();
  let mounted;
  let dispose;
  let each_value = ctx[11];
  const get_key = (ctx2) => ctx2[53].id;
  for (let i = 0; i < each_value.length; i += 1) {
    let child_ctx = get_each_context(ctx, each_value, i);
    let key = get_key(child_ctx);
    each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
  }
  return {
    c() {
      div = element("div");
      table = element("table");
      thead = element("thead");
      tr = element("tr");
      th0 = element("th");
      th0.textContent = "Index";
      t1 = space();
      th1 = element("th");
      th1.textContent = "Url";
      t3 = space();
      th2 = element("th");
      th2.textContent = "Method";
      t5 = space();
      th3 = element("th");
      th3.textContent = "Data";
      t7 = space();
      th4 = element("th");
      label = element("label");
      input = element("input");
      t8 = text$1("\r\n                      Status");
      t9 = space();
      th5 = element("th");
      th5.textContent = "Handle";
      t11 = space();
      tbody = element("tbody");
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }
      attr(input, "type", "checkbox");
      attr(table, "border", "1");
      attr(table, "class", "msw-list");
      attr(div, "class", "msw-tabs-wrap table-list");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, table);
      append(table, thead);
      append(thead, tr);
      append(tr, th0);
      append(tr, t1);
      append(tr, th1);
      append(tr, t3);
      append(tr, th2);
      append(tr, t5);
      append(tr, th3);
      append(tr, t7);
      append(tr, th4);
      append(th4, label);
      append(label, input);
      input.checked = ctx[13];
      append(label, t8);
      append(tr, t9);
      append(tr, th5);
      append(table, t11);
      append(table, tbody);
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].m(tbody, null);
      }
      if (!mounted) {
        dispose = [
          listen(input, "change", ctx[40]),
          listen(input, "change", ctx[41])
        ];
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (dirty[0] & 8192) {
        input.checked = ctx2[13];
      }
      if (dirty[0] & 939526144) {
        each_value = ctx2[11];
        each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx2, each_value, each_1_lookup, tbody, destroy_block, create_each_block, null, get_each_context);
      }
    },
    d(detaching) {
      if (detaching)
        detach(div);
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].d();
      }
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_each_block(key_1, ctx) {
  let tr;
  let td0;
  let t0_value = ctx[55] + 1 + "";
  let t0;
  let t1;
  let td1;
  let t2_value = ctx[53].url + "";
  let t2;
  let t3;
  let td2;
  let t4_value = ctx[53].method + "";
  let t4;
  let t5;
  let td3;
  let pre;
  let t6;
  let t7_value = JSON.stringify(JSON.parse(ctx[53].data), null, 2) + "";
  let t7;
  let t8;
  let t9;
  let td4;
  let label;
  let input;
  let t10;
  let t11;
  let td5;
  let a0;
  let t13;
  let a1;
  let t15;
  let mounted;
  let dispose;
  function change_handler_2() {
    return ctx[42](ctx[53], ctx[55]);
  }
  function input_change_handler_1() {
    ctx[43].call(input, ctx[54], ctx[55]);
  }
  return {
    key: key_1,
    first: null,
    c() {
      tr = element("tr");
      td0 = element("td");
      t0 = text$1(t0_value);
      t1 = space();
      td1 = element("td");
      t2 = text$1(t2_value);
      t3 = space();
      td2 = element("td");
      t4 = text$1(t4_value);
      t5 = space();
      td3 = element("td");
      pre = element("pre");
      t6 = text$1("                    ");
      t7 = text$1(t7_value);
      t8 = text$1("\r\n                  ");
      t9 = space();
      td4 = element("td");
      label = element("label");
      input = element("input");
      t10 = text$1("\r\n                        \u5F00\u542F");
      t11 = space();
      td5 = element("td");
      a0 = element("a");
      a0.textContent = "\u7F16\u8F91";
      t13 = space();
      a1 = element("a");
      a1.textContent = "\u5220\u9664";
      t15 = space();
      attr(pre, "class", "msw-list-data");
      attr(pre, "contenteditable", "true");
      attr(input, "type", "checkbox");
      attr(a0, "href", null);
      attr(a0, "class", "msw-list-btn edit");
      attr(a1, "href", null);
      attr(a1, "class", "msw-list-btn del");
      this.first = tr;
    },
    m(target, anchor) {
      insert(target, tr, anchor);
      append(tr, td0);
      append(td0, t0);
      append(tr, t1);
      append(tr, td1);
      append(td1, t2);
      append(tr, t3);
      append(tr, td2);
      append(td2, t4);
      append(tr, t5);
      append(tr, td3);
      append(td3, pre);
      append(pre, t6);
      append(pre, t7);
      append(pre, t8);
      append(tr, t9);
      append(tr, td4);
      append(td4, label);
      append(label, input);
      input.checked = ctx[53].checked;
      append(label, t10);
      append(tr, t11);
      append(tr, td5);
      append(td5, a0);
      append(td5, t13);
      append(td5, a1);
      append(tr, t15);
      if (!mounted) {
        dispose = [
          listen(input, "change", change_handler_2),
          listen(input, "change", input_change_handler_1),
          listen(a0, "click", function() {
            if (is_function(ctx[27].bind(null, {
              ...ctx[53],
              index: ctx[55]
            })))
              ctx[27].bind(null, {
                ...ctx[53],
                index: ctx[55]
              }).apply(this, arguments);
          }),
          listen(a1, "click", function() {
            if (is_function(ctx[28].bind(null, {
              ...ctx[53],
              index: ctx[55]
            })))
              ctx[28].bind(null, {
                ...ctx[53],
                index: ctx[55]
              }).apply(this, arguments);
          })
        ];
        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      if (dirty[0] & 2048 && t0_value !== (t0_value = ctx[55] + 1 + ""))
        set_data(t0, t0_value);
      if (dirty[0] & 2048 && t2_value !== (t2_value = ctx[53].url + ""))
        set_data(t2, t2_value);
      if (dirty[0] & 2048 && t4_value !== (t4_value = ctx[53].method + ""))
        set_data(t4, t4_value);
      if (dirty[0] & 2048 && t7_value !== (t7_value = JSON.stringify(JSON.parse(ctx[53].data), null, 2) + ""))
        set_data(t7, t7_value);
      if (dirty[0] & 2048) {
        input.checked = ctx[53].checked;
      }
    },
    d(detaching) {
      if (detaching)
        detach(tr);
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_fragment(ctx) {
  let div1;
  let div0;
  let t1;
  let current;
  let mounted;
  let dispose;
  let if_block = ctx[0] && create_if_block(ctx);
  return {
    c() {
      div1 = element("div");
      div0 = element("div");
      div0.textContent = "MSW";
      t1 = space();
      if (if_block)
        if_block.c();
      this.c = noop$1;
      attr(div0, "class", "msw-show");
      attr(div1, "class", "msw-container");
    },
    m(target, anchor) {
      insert(target, div1, anchor);
      append(div1, div0);
      append(div1, t1);
      if (if_block)
        if_block.m(div1, null);
      current = true;
      if (!mounted) {
        dispose = listen(div0, "click", ctx[16]);
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (ctx2[0]) {
        if (if_block) {
          if_block.p(ctx2, dirty);
          if (dirty[0] & 1) {
            transition_in(if_block, 1);
          }
        } else {
          if_block = create_if_block(ctx2);
          if_block.c();
          transition_in(if_block, 1);
          if_block.m(div1, null);
        }
      } else if (if_block) {
        group_outros();
        transition_out(if_block, 1, 1, () => {
          if_block = null;
        });
        check_outros();
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(if_block);
      current = true;
    },
    o(local) {
      transition_out(if_block);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(div1);
      if (if_block)
        if_block.d();
      mounted = false;
      dispose();
    }
  };
}
let urlPatt = /^[/]\S{1,}/;
function getData() {
  fetch("/test").then((res) => {
    return res.json();
  }).then((res) => {
    console.log(res);
  });
}
function uuid() {
  return Math.random().toString(36).slice(4, 10);
}
function instance($$self, $$props, $$invalidate) {
  let { base = "" } = $$props;
  const defaultData = JSON.stringify({ code: 0, msg: "OK", data: 1 }, null, 2);
  let isProd = true;
  console.log("[ENV]", isProd);
  let show = false;
  let currentTab = "01";
  let reqTimes = localStorage.getItem(MSW_REQUEST_TIME) || 1e3;
  let failRatio = localStorage.getItem(MSW_REQUEST_FAIL_RATIO) || 0;
  let statusCode = 200;
  let reqMethod = "all";
  let reqUrl = "";
  let mockData = defaultData;
  let mockType = "";
  let mockIndex = 0;
  let showMsg = false;
  let msgText = "";
  let msgType = "error";
  let list = getLocalList();
  let globalStatus = localStorage.getItem(MSW_GLOBAL_STATUS) === "1";
  let allStatus = localStorage.getItem(MSW_ALL_STATUS) === "1";
  let fileObj = null;
  onMount(async () => {
    console.log("[baseUrl]", base);
    init2();
    {
      let basePath = base || "/";
      mocker.start({
        onUnhandledRequest: "bypass",
        serviceWorker: {
          url: `${basePath}mockServiceWorker.js`,
          options: {
            scope: basePath
          }
        }
      });
    }
  });
  function init2() {
    let status2 = localStorage.getItem(MSW_GLOBAL_STATUS);
    if (!status2) {
      localStorage.setItem(MSW_GLOBAL_STATUS, "1");
      $$invalidate(12, globalStatus = true);
    }
  }
  function showModal() {
    $$invalidate(0, show = true);
  }
  function closeModal() {
    $$invalidate(0, show = false);
    resetHandlers2();
  }
  function tabChange(code) {
    if (code === currentTab)
      return;
    $$invalidate(1, currentTab = code);
    $$invalidate(8, showMsg = false);
  }
  function resetHandlers2() {
    mocker.resetHandlers(...getList());
    mocker.printHandlers();
    mocker.restoreHandlers();
    mocker.listHandlers();
    $$invalidate(4, statusCode = localStorage.getItem(MSW_RESPONSE_STATUS_CODE));
  }
  function clearData() {
    if (confirm("\u786E\u8BA4\u8981\u6E05\u7A7A\u672C\u5730\u6570\u636E\uFF1F")) {
      localStorage.removeItem(MSW_LIST_KEY);
      $$invalidate(11, list = []);
    }
  }
  function changeStatusGlobal() {
    $$invalidate(12, globalStatus = !globalStatus);
    localStorage.setItem(MSW_GLOBAL_STATUS, `${+globalStatus}`);
    resetHandlers2();
  }
  function inputChange(type) {
    if (type === "time") {
      localStorage.setItem(MSW_REQUEST_TIME, reqTimes);
    }
    if (type === "fail") {
      localStorage.setItem(MSW_REQUEST_FAIL_RATIO, failRatio);
    }
  }
  function fileChange(e) {
    let fileList = fileObj.files;
    if (fileList.length > 0) {
      let file = fileList[0];
      let { type } = file;
      if (type === "application/json") {
        importHandle(file);
      } else {
        message({ type: "error", msg: `\u3010\u64CD\u4F5C\u5931\u8D25\u3011 \u9009\u53D6\u7684\u4E0D\u662Fjson\u6587\u4EF6` });
      }
    } else {
      message({ type: "error", msg: `\u3010\u64CD\u4F5C\u53D6\u6D88\u3011 \u672A\u9009\u53D6\u6587\u4EF6` });
    }
  }
  function fileTrigger() {
    fileObj.click();
  }
  async function importHandle(file) {
    try {
      let jsonStr = await fileToJson(file);
      let res = JSON.parse(jsonStr);
      if (Array.isArray(res) && res.length) {
        if (list.length) {
          let urlList = list.map((item) => item.url);
          let lastList = res.filter((item) => !urlList.includes(item.url));
          $$invalidate(11, list = [...lastList, ...list]);
        } else {
          $$invalidate(11, list = [...res]);
        }
        setLocalList();
        message({ type: "success", msg: `\u3010\u5BFC\u5165\u6210\u529F\u3011` });
      }
    } catch (err) {
      console.log(err);
      message({ type: "error", msg: `\u3010\u5BFC\u5165\u5931\u8D25\u3011 ${err}` });
    }
  }
  function exportHandle() {
    jsonDownload(list);
  }
  function getLocalList() {
    let str = localStorage.getItem(MSW_LIST_KEY) || "[]";
    return JSON.parse(str);
  }
  function setLocalList() {
    localStorage.setItem(MSW_LIST_KEY, JSON.stringify(list));
  }
  function add() {
    let url = reqUrl.trim();
    let data2 = {
      url,
      method: reqMethod,
      data: mockData,
      id: uuid(),
      date: new Date().toLocaleString(),
      checked: true
    };
    if (!urlPatt.test(url)) {
      message({
        type: "error",
        msg: `\u3010url\u8F93\u5165\u4E0D\u6B63\u786E\u3011 url\u5FC5\u987B\u4EE5"/"\u5F00\u59CB\uFF0C\u4E0D\u80FD\u4E3A\u7A7A""\u6216"/"`
      });
      return;
    }
    try {
      let json2 = JSON.parse(mockData);
      console.log(json2);
    } catch (err) {
      message({
        type: "error",
        msg: `\u3010Mock\u6570\u636EJSON\u683C\u5F0F\u5F02\u5E38\u3011 ${err}`
      });
      return;
    }
    if (mockType === "edit") {
      let local = getLocalList();
      local[mockIndex] = { ...data2 };
      $$invalidate(11, list = [...local]);
      message({ type: "success", msg: `\u3010\u7F16\u8F91\u6210\u529F\u3011` });
      mockType = "";
    } else {
      let res = list.find((item) => item.url === url);
      if (res) {
        message({
          type: "error",
          msg: `\u3010url\u5DF2\u5B58\u5728\u3011 url\u672C\u5730\u5217\u8868\u5DF2\u5B58\u5728\uFF0C\u4E0D\u80FD\u91CD\u590D\u6DFB\u52A0`
        });
        return;
      }
      $$invalidate(11, list = [data2, ...getLocalList()]);
      message({ type: "success", msg: `\u3010\u6DFB\u52A0\u6210\u529F\u3011` });
    }
    setLocalList();
    initParams();
  }
  function edit(item) {
    let { url, method, data: data2, id, date, checked, index } = item;
    $$invalidate(6, reqUrl = url);
    $$invalidate(5, reqMethod = method);
    $$invalidate(7, mockData = JSON.stringify(JSON.parse(data2), null, 2));
    mockType = "edit";
    mockIndex = index;
    $$invalidate(1, currentTab = "02");
  }
  function del({ id, index }) {
    list.splice(index, 1);
    $$invalidate(11, list = [...list]);
    setLocalList();
  }
  function changeStatus(item) {
    let { index, checked } = item;
    $$invalidate(11, list[index].checked = !checked, list);
    setLocalList();
  }
  function changeStatusAll() {
    $$invalidate(13, allStatus = !allStatus);
    localStorage.setItem(MSW_ALL_STATUS, `${+allStatus}`);
    $$invalidate(11, list = list.map((item) => {
      return { ...item, checked: allStatus };
    }));
    setLocalList();
  }
  function message({ type, msg }) {
    $$invalidate(10, msgType = type);
    $$invalidate(9, msgText = msg);
    $$invalidate(8, showMsg = true);
    let timer = setTimeout(
      () => {
        $$invalidate(8, showMsg = false);
        clearTimeout(timer);
        timer = null;
      },
      2500
    );
  }
  function initParams() {
    $$invalidate(6, reqUrl = "");
    $$invalidate(7, mockData = defaultData);
    $$invalidate(5, reqMethod = "all");
  }
  const change_handler = () => changeStatusGlobal();
  function input0_change_handler() {
    globalStatus = this.checked;
    $$invalidate(12, globalStatus);
  }
  function input1_input_handler() {
    reqTimes = this.value;
    $$invalidate(2, reqTimes);
  }
  function input2_input_handler() {
    failRatio = this.value;
    $$invalidate(3, failRatio);
  }
  function input3_binding($$value) {
    binding_callbacks[$$value ? "unshift" : "push"](() => {
      fileObj = $$value;
      $$invalidate(14, fileObj);
    });
  }
  function select_change_handler() {
    reqMethod = select_value(this);
    $$invalidate(5, reqMethod);
  }
  function input_input_handler() {
    reqUrl = this.value;
    $$invalidate(6, reqUrl);
  }
  function textarea_input_handler() {
    mockData = this.value;
    $$invalidate(7, mockData);
  }
  const change_handler_1 = () => changeStatusAll();
  function input_change_handler() {
    allStatus = this.checked;
    $$invalidate(13, allStatus);
  }
  const change_handler_2 = (item, index) => changeStatus({ ...item, index });
  function input_change_handler_1(each_value, index) {
    each_value[index].checked = this.checked;
    $$invalidate(11, list);
  }
  $$self.$$set = ($$props2) => {
    if ("base" in $$props2)
      $$invalidate(31, base = $$props2.base);
  };
  return [
    show,
    currentTab,
    reqTimes,
    failRatio,
    statusCode,
    reqMethod,
    reqUrl,
    mockData,
    showMsg,
    msgText,
    msgType,
    list,
    globalStatus,
    allStatus,
    fileObj,
    isProd,
    showModal,
    closeModal,
    tabChange,
    resetHandlers2,
    clearData,
    changeStatusGlobal,
    inputChange,
    fileChange,
    fileTrigger,
    exportHandle,
    add,
    edit,
    del,
    changeStatus,
    changeStatusAll,
    base,
    change_handler,
    input0_change_handler,
    input1_input_handler,
    input2_input_handler,
    input3_binding,
    select_change_handler,
    input_input_handler,
    textarea_input_handler,
    change_handler_1,
    input_change_handler,
    change_handler_2,
    input_change_handler_1
  ];
}
class Msw extends SvelteElement {
  constructor(options) {
    super();
    this.shadowRoot.innerHTML = `<style>*{padding:0;margin:0;box-sizing:border-box}a{font-style:normal;text-decoration:none;color:#333;cursor:pointer}input,textarea{outline:none;border:1px solid #999;text-indent:10px}input::placeholder,textarea::placeholder{color:#bbb}label{cursor:pointer}.msw-container{width:100%;text-align:left}.msw-show{position:fixed;right:50px;bottom:50px;z-index:9999;padding:8px 15px;background-color:#AB4BFE;color:#fff;border-radius:4px;font-size:14px;box-shadow:0 0 10px rgba(0, 0, 0, 0.4);cursor:pointer;user-select:none}.msw-mask{width:100vw;height:100vh;position:fixed;right:0;bottom:0;z-index:8888;background-color:rgba(0, 0, 0, 0.6)}.msw-box{position:fixed;left:0;bottom:0;z-index:9999;width:100%;height:70vh;padding:15px;background-color:#fff}.msw-title{display:flex;justify-content:space-between;align-items:center;color:#666;font-size:20px;font-weight:400}.msw-close{color:#333;cursor:pointer}.msw-tabs-head{display:flex;justify-content:space-between;align-items:center;margin:15px 0;padding-bottom:5px;border-bottom:1px solid #eee}.msw-tabs-inner{display:flex}.msw-reset{display:block;width:80px;height:30px;line-height:30px;text-align:center;margin-left:30px;background-color:#67c23a;color:#fff;border-radius:3px}.msw-reset:hover{background-color:#85ce61}.msw-tabs-item{padding:5px 10px;cursor:pointer;transition:all linear 200ms}.msw-handle-clear{width:100px;height:30px;line-height:30px;text-align:center;background-color:#e6a23c;color:#fff;border-radius:3px}.msw-handle-clear:hover{background-color:#ebb563}.msw-tabs-item.active{background-color:pink}.msw-handle-li{display:flex;justify-content:space-between;align-items:center;padding-bottom:15px}.msw-handle-input{width:200px;line-height:30px}.msw-handle-export{margin-left:0}.msw-config{display:flex;align-items:center}.msw-method{width:100px;height:30px}.msw-config-input{width:300px;height:30px;border:1px solid #999;border-left:none;text-indent:10px}.msw-config-add,.msw-handle-export{width:80px;height:30px;line-height:30px;text-align:center;margin-left:30px;background-color:#5787FF;color:#fff;border-radius:3px}.msw-config-add:hover,.msw-handle-export:hover{background-color:rgba(87, 135, 255, 0.9098039216)}.msw-config-data{min-width:80%;max-width:100%;max-height:400px;margin-top:15px;padding:10px;text-indent:0;background-color:#fff6f7}.status-code{color:#00BE00}.status-code.error{color:#f56c6c}.msw-config-tips{margin-top:10px}.msw-config-tips.error{color:#f56c6c}.msw-config-tips.success{color:#67c23a}.table-list{height:calc(70vh - 130px);overflow-y:scroll}.msw-list{width:100%;border-color:#ddd;border-collapse:collapse;table-layout:fixed}.msw-list th,.msw-list td{padding:5px;word-wrap:break-word;white-space:normal}.msw-list td{word-wrap:break-word}.msw-list th{background-color:#f0f9eb}.msw-list th:nth-child(1){width:60px}.msw-list th:nth-child(2){max-width:300px;width:20%}.msw-list th:nth-child(3),.msw-list th:nth-child(5),.msw-list th:nth-child(6){width:86px}.msw-list .msw-list-data{width:100%;padding:5px;max-height:300px;min-height:100px;overflow-y:scroll;background-color:#fff6f7;position:relative;z-index:10;white-space:break-spaces;outline-color:#fe6c6f}.msw-list .msw-list-data::-webkit-scrollbar{display:none;height:0;width:0;background-color:transparent}@media screen and (max-width: 640px){.table-list{overflow-x:scroll}.msw-list{width:960px}}.msw-list-btn.edit{color:#409eff}.msw-list-btn.del{color:#f56c6c}.msw-handle-li-global{color:#409eff}.msw-handle-test{cursor:pointer;color:#409eff;background:#ecf5ff;border:1px solid #b3d8ff;border-radius:4px;padding:5px 10px}.msw-handle-test:hover{background-color:#409eff;color:#fff}</style>`;
    init(
      this,
      {
        target: this.shadowRoot,
        props: attribute_to_object(this.attributes),
        customElement: true
      },
      instance,
      create_fragment,
      safe_not_equal,
      { base: 31 },
      null,
      [-1, -1, -1]
    );
    if (options) {
      if (options.target) {
        insert(options.target, this, options.anchor);
      }
      if (options.props) {
        this.$set(options.props);
        flush();
      }
    }
  }
  static get observedAttributes() {
    return ["base"];
  }
  get base() {
    return this.$$.ctx[31];
  }
  set base(base) {
    this.$$set({ base });
    flush();
  }
}
customElements.define("msw-tools", Msw);
export {
  Msw as default
};
