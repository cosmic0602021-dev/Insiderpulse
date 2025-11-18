import { jsx, jsxs, Fragment as Fragment$1 } from "react/jsx-runtime";
import { renderToString } from "react-dom/server";
import { parse } from "regexparam";
import * as React from "react";
import { createContext, forwardRef, isValidElement, cloneElement, createElement, useContext, useRef, Fragment, useState, useEffect, useMemo, memo, useCallback } from "react";
import { useSyncExternalStore } from "use-sync-external-store/shim/index.js";
import { notifyManager, isServer, QueryObserver, QueryClient } from "@tanstack/query-core";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva } from "class-variance-authority";
import { X, Bell, User, Crown, Settings as Settings$1, LogOut, TrendingUp, Star, Sun, Moon, ChevronRight, Check, Circle, Zap, Smartphone, Share2, Plus, CheckCircle, Mail, AlertCircle, Loader2, ArrowLeft, DollarSign, ChevronDown, ChevronUp, ExternalLink, Minus, TrendingDown, Filter, Search, Calendar, SortDesc, Bookmark, Camera, BarChart3, Clock, Brain, Target, Calculator, Newspaper, Wifi, WifiOff, Shield, AlertTriangle, RefreshCw, Monitor, Languages, Palette, CreditCard, Ticket, CheckCircle2, BellOff, Building2, Activity, Users, PieChart, Sliders, Lock, Unlock, ArrowDown, Sparkles, Database, Timer, ArrowRight, XCircle, UserCheck, LineChart as LineChart$1 } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { Slot } from "@radix-ui/react-slot";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import * as LabelPrimitive from "@radix-ui/react-label";
import * as SelectPrimitive from "@radix-ui/react-select";
import html2canvas from "html2canvas";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip as Tooltip$1, ReferenceArea, ReferenceLine, ReferenceDot, Line, PieChart as PieChart$1, Pie, Cell, BarChart, Bar, AreaChart, Area, Legend, ComposedChart, ScatterChart, Scatter } from "recharts";
import { formatDistanceToNow } from "date-fns";
import { ko, ja, zhCN, enUS } from "date-fns/locale";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { useStripe, useElements, CardElement, Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
const useBuiltinInsertionEffect = React["useInsertionEffect"];
const canUseDOM = !!(typeof window !== "undefined" && typeof window.document !== "undefined" && typeof window.document.createElement !== "undefined");
const useIsomorphicLayoutEffect = canUseDOM ? React.useLayoutEffect : React.useEffect;
const useInsertionEffect = useBuiltinInsertionEffect || useIsomorphicLayoutEffect;
const useEvent = (fn) => {
  const ref = React.useRef([fn, (...args) => ref[0](...args)]).current;
  useInsertionEffect(() => {
    ref[0] = fn;
  });
  return ref[1];
};
const eventPopstate = "popstate";
const eventPushState = "pushState";
const eventReplaceState = "replaceState";
const eventHashchange = "hashchange";
const events = [
  eventPopstate,
  eventPushState,
  eventReplaceState,
  eventHashchange
];
const subscribeToLocationUpdates = (callback) => {
  for (const event of events) {
    addEventListener(event, callback);
  }
  return () => {
    for (const event of events) {
      removeEventListener(event, callback);
    }
  };
};
const useLocationProperty = (fn, ssrFn) => useSyncExternalStore(subscribeToLocationUpdates, fn, ssrFn);
const currentSearch = () => location.search;
const useSearch = ({ ssrSearch = "" } = {}) => useLocationProperty(currentSearch, () => ssrSearch);
const currentPathname = () => location.pathname;
const usePathname = ({ ssrPath } = {}) => useLocationProperty(
  currentPathname,
  ssrPath ? () => ssrPath : currentPathname
);
const navigate = (to, { replace = false, state = null } = {}) => history[replace ? eventReplaceState : eventPushState](state, "", to);
const useBrowserLocation = (opts = {}) => [usePathname(opts), navigate];
const patchKey = Symbol.for("wouter_v3");
if (typeof history !== "undefined" && typeof window[patchKey] === "undefined") {
  for (const type of [eventPushState, eventReplaceState]) {
    const original = history[type];
    history[type] = function() {
      const result = original.apply(this, arguments);
      const event = new Event(type);
      event.arguments = arguments;
      dispatchEvent(event);
      return result;
    };
  }
  Object.defineProperty(window, patchKey, { value: true });
}
const _relativePath = (base, path) => !path.toLowerCase().indexOf(base.toLowerCase()) ? path.slice(base.length) || "/" : "~" + path;
const baseDefaults = (base = "") => base === "/" ? "" : base;
const absolutePath = (to, base) => to[0] === "~" ? to.slice(1) : baseDefaults(base) + to;
const relativePath = (base = "", path) => _relativePath(unescape(baseDefaults(base)), unescape(path));
const unescape = (str) => {
  try {
    return decodeURI(str);
  } catch (_e) {
    return str;
  }
};
const defaultRouter = {
  hook: useBrowserLocation,
  searchHook: useSearch,
  parser: parse,
  base: "",
  // this option is used to override the current location during SSR
  ssrPath: void 0,
  ssrSearch: void 0,
  // customizes how `href` props are transformed for <Link />
  hrefs: (x) => x
};
const RouterCtx = createContext(defaultRouter);
const useRouter = () => useContext(RouterCtx);
const Params0 = {}, ParamsCtx = createContext(Params0);
const useParams = () => useContext(ParamsCtx);
const useLocationFromRouter = (router) => {
  const [location2, navigate2] = router.hook(router);
  return [
    relativePath(router.base, location2),
    useEvent((to, navOpts) => navigate2(absolutePath(to, router.base), navOpts))
  ];
};
const useLocation = () => useLocationFromRouter(useRouter());
const matchRoute = (parser, route, path, loose) => {
  const { pattern, keys } = route instanceof RegExp ? { keys: false, pattern: route } : parser(route || "*", loose);
  const result = pattern.exec(path) || [];
  const [$base, ...matches] = result;
  return $base !== void 0 ? [
    true,
    (() => {
      const groups = keys !== false ? Object.fromEntries(keys.map((key, i) => [key, matches[i]])) : result.groups;
      let obj = { ...matches };
      groups && Object.assign(obj, groups);
      return obj;
    })(),
    // the third value if only present when parser is in "loose" mode,
    // so that we can extract the base path for nested routes
    ...loose ? [$base] : []
  ] : [false, null];
};
const useRoute = (pattern) => matchRoute(useRouter().parser, pattern, useLocation()[0]);
const Router = ({ children, ...props }) => {
  var _a, _b;
  const parent_ = useRouter();
  const parent = props.hook ? defaultRouter : parent_;
  let value = parent;
  const [path, search] = ((_a = props.ssrPath) == null ? void 0 : _a.split("?")) ?? [];
  if (search) props.ssrSearch = search, props.ssrPath = path;
  props.hrefs = props.hrefs ?? ((_b = props.hook) == null ? void 0 : _b.hrefs);
  let ref = useRef({}), prev = ref.current, next = prev;
  for (let k in parent) {
    const option = k === "base" ? (
      /* base is special case, it is appended to the parent's base */
      parent[k] + (props[k] || "")
    ) : props[k] || parent[k];
    if (prev === next && option !== next[k]) {
      ref.current = next = { ...next };
    }
    next[k] = option;
    if (option !== parent[k]) value = next;
  }
  return createElement(RouterCtx.Provider, { value, children });
};
const h_route = ({ children, component }, params) => {
  if (component) return createElement(component, { params });
  return typeof children === "function" ? children(params) : children;
};
const useCachedParams = (value) => {
  let prev = useRef(Params0), curr = prev.current;
  for (const k in value) if (value[k] !== curr[k]) curr = value;
  if (Object.keys(value).length === 0) curr = value;
  return prev.current = curr;
};
const Route = ({ path, nest, match, ...renderProps }) => {
  const router = useRouter();
  const [location2] = useLocationFromRouter(router);
  const [matches, routeParams, base] = (
    // `match` is a special prop to give up control to the parent,
    // it is used by the `Switch` to avoid double matching
    match ?? matchRoute(router.parser, path, location2, nest)
  );
  const params = useCachedParams({ ...useParams(), ...routeParams });
  if (!matches) return null;
  const children = base ? createElement(Router, { base }, h_route(renderProps, params)) : h_route(renderProps, params);
  return createElement(ParamsCtx.Provider, { value: params, children });
};
const Link = forwardRef((props, ref) => {
  const router = useRouter();
  const [currentPath, navigate2] = useLocationFromRouter(router);
  const {
    to = "",
    href: targetPath = to,
    onClick: _onClick,
    asChild,
    children,
    className: cls,
    /* eslint-disable no-unused-vars */
    replace,
    state,
    /* eslint-enable no-unused-vars */
    ...restProps
  } = props;
  const onClick = useEvent((event) => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || event.button !== 0)
      return;
    _onClick == null ? void 0 : _onClick(event);
    if (!event.defaultPrevented) {
      event.preventDefault();
      navigate2(targetPath, props);
    }
  });
  const href = router.hrefs(
    targetPath[0] === "~" ? targetPath.slice(1) : router.base + targetPath,
    router
    // pass router as a second argument for convinience
  );
  return asChild && isValidElement(children) ? cloneElement(children, { onClick, href }) : createElement("a", {
    ...restProps,
    onClick,
    href,
    // `className` can be a function to apply the class if this link is active
    className: (cls == null ? void 0 : cls.call) ? cls(currentPath === targetPath) : cls,
    children,
    ref
  });
});
const flattenChildren = (children) => Array.isArray(children) ? children.flatMap(
  (c) => flattenChildren(c && c.type === Fragment ? c.props.children : c)
) : [children];
const Switch$1 = ({ children, location: location2 }) => {
  const router = useRouter();
  const [originalLocation] = useLocationFromRouter(router);
  for (const element of flattenChildren(children)) {
    let match = 0;
    if (isValidElement(element) && // we don't require an element to be of type Route,
    // but we do require it to contain a truthy `path` prop.
    // this allows to use different components that wrap Route
    // inside of a switch, for example <AnimatedRoute />.
    (match = matchRoute(
      router.parser,
      element.props.path,
      location2 || originalLocation,
      element.props.nest
    ))[0])
      return cloneElement(element, { match });
  }
  return null;
};
var QueryClientContext = React.createContext(
  void 0
);
var useQueryClient = (queryClient2) => {
  const client = React.useContext(QueryClientContext);
  if (!client) {
    throw new Error("No QueryClient set, use QueryClientProvider to set one");
  }
  return client;
};
var QueryClientProvider = ({
  client,
  children
}) => {
  React.useEffect(() => {
    client.mount();
    return () => {
      client.unmount();
    };
  }, [client]);
  return /* @__PURE__ */ jsx(QueryClientContext.Provider, { value: client, children });
};
var IsRestoringContext = React.createContext(false);
var useIsRestoring = () => React.useContext(IsRestoringContext);
IsRestoringContext.Provider;
function createValue() {
  let isReset = false;
  return {
    clearReset: () => {
      isReset = false;
    },
    reset: () => {
      isReset = true;
    },
    isReset: () => {
      return isReset;
    }
  };
}
var QueryErrorResetBoundaryContext = React.createContext(createValue());
var useQueryErrorResetBoundary = () => React.useContext(QueryErrorResetBoundaryContext);
function shouldThrowError(throwError, params) {
  if (typeof throwError === "function") {
    return throwError(...params);
  }
  return !!throwError;
}
function noop() {
}
var ensurePreventErrorBoundaryRetry = (options, errorResetBoundary) => {
  if (options.suspense || options.throwOnError || options.experimental_prefetchInRender) {
    if (!errorResetBoundary.isReset()) {
      options.retryOnMount = false;
    }
  }
};
var useClearResetErrorBoundary = (errorResetBoundary) => {
  React.useEffect(() => {
    errorResetBoundary.clearReset();
  }, [errorResetBoundary]);
};
var getHasError = ({
  result,
  errorResetBoundary,
  throwOnError,
  query
}) => {
  return result.isError && !errorResetBoundary.isReset() && !result.isFetching && query && shouldThrowError(throwOnError, [result.error, query]);
};
var ensureSuspenseTimers = (defaultedOptions) => {
  if (defaultedOptions.suspense) {
    if (defaultedOptions.staleTime === void 0) {
      defaultedOptions.staleTime = 1e3;
    }
    if (typeof defaultedOptions.gcTime === "number") {
      defaultedOptions.gcTime = Math.max(defaultedOptions.gcTime, 1e3);
    }
  }
};
var willFetch = (result, isRestoring) => result.isLoading && result.isFetching && !isRestoring;
var shouldSuspend = (defaultedOptions, result) => (defaultedOptions == null ? void 0 : defaultedOptions.suspense) && result.isPending;
var fetchOptimistic = (defaultedOptions, observer, errorResetBoundary) => observer.fetchOptimistic(defaultedOptions).catch(() => {
  errorResetBoundary.clearReset();
});
function useBaseQuery(options, Observer, queryClient2) {
  var _a, _b, _c, _d, _e;
  if (process.env.NODE_ENV !== "production") {
    if (typeof options !== "object" || Array.isArray(options)) {
      throw new Error(
        'Bad argument type. Starting with v5, only the "Object" form is allowed when calling query related functions. Please use the error stack to find the culprit call. More info here: https://tanstack.com/query/latest/docs/react/guides/migrating-to-v5#supports-a-single-signature-one-object'
      );
    }
  }
  const client = useQueryClient();
  const isRestoring = useIsRestoring();
  const errorResetBoundary = useQueryErrorResetBoundary();
  const defaultedOptions = client.defaultQueryOptions(options);
  (_b = (_a = client.getDefaultOptions().queries) == null ? void 0 : _a._experimental_beforeQuery) == null ? void 0 : _b.call(
    _a,
    defaultedOptions
  );
  defaultedOptions._optimisticResults = isRestoring ? "isRestoring" : "optimistic";
  ensureSuspenseTimers(defaultedOptions);
  ensurePreventErrorBoundaryRetry(defaultedOptions, errorResetBoundary);
  useClearResetErrorBoundary(errorResetBoundary);
  const isNewCacheEntry = !client.getQueryCache().get(defaultedOptions.queryHash);
  const [observer] = React.useState(
    () => new Observer(
      client,
      defaultedOptions
    )
  );
  const result = observer.getOptimisticResult(defaultedOptions);
  React.useSyncExternalStore(
    React.useCallback(
      (onStoreChange) => {
        const unsubscribe = isRestoring ? noop : observer.subscribe(notifyManager.batchCalls(onStoreChange));
        observer.updateResult();
        return unsubscribe;
      },
      [observer, isRestoring]
    ),
    () => observer.getCurrentResult(),
    () => observer.getCurrentResult()
  );
  React.useEffect(() => {
    observer.setOptions(defaultedOptions, { listeners: false });
  }, [defaultedOptions, observer]);
  if (shouldSuspend(defaultedOptions, result)) {
    throw fetchOptimistic(defaultedOptions, observer, errorResetBoundary);
  }
  if (getHasError({
    result,
    errorResetBoundary,
    throwOnError: defaultedOptions.throwOnError,
    query: client.getQueryCache().get(defaultedOptions.queryHash)
  })) {
    throw result.error;
  }
  (_d = (_c = client.getDefaultOptions().queries) == null ? void 0 : _c._experimental_afterQuery) == null ? void 0 : _d.call(
    _c,
    defaultedOptions,
    result
  );
  if (defaultedOptions.experimental_prefetchInRender && !isServer && willFetch(result, isRestoring)) {
    const promise = isNewCacheEntry ? (
      // Fetch immediately on render in order to ensure `.promise` is resolved even if the component is unmounted
      fetchOptimistic(defaultedOptions, observer, errorResetBoundary)
    ) : (
      // subscribe to the "cache promise" so that we can finalize the currentThenable once data comes in
      (_e = client.getQueryCache().get(defaultedOptions.queryHash)) == null ? void 0 : _e.promise
    );
    promise == null ? void 0 : promise.catch(noop).finally(() => {
      observer.updateResult();
    });
  }
  return !defaultedOptions.notifyOnChangeProps ? observer.trackResult(result) : result;
}
function useQuery(options, queryClient2) {
  return useBaseQuery(options, QueryObserver);
}
async function throwIfResNotOk(res) {
  if (!res.ok) {
    const text = await res.text() || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}
async function apiRequest(method, url, data) {
  const headers = data ? { "Content-Type": "application/json" } : {};
  const token = localStorage.getItem("authToken");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : void 0,
    credentials: "include"
  });
  await throwIfResNotOk(res);
  return res;
}
const getQueryFn = ({ on401: unauthorizedBehavior }) => async ({ queryKey }) => {
  const res = await fetch(queryKey.join("/"), {
    credentials: "include"
  });
  if (unauthorizedBehavior === "returnNull" && res.status === 401) {
    return null;
  }
  await throwIfResNotOk(res);
  return await res.json();
};
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false
    },
    mutations: {
      retry: false
    }
  }
});
const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1e6;
let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}
const toastTimeouts = /* @__PURE__ */ new Map();
const addToRemoveQueue = (toastId) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }
  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: "REMOVE_TOAST",
      toastId
    });
  }, TOAST_REMOVE_DELAY);
  toastTimeouts.set(toastId, timeout);
};
const reducer = (state, action) => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT)
      };
    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map(
          (t) => t.id === action.toast.id ? { ...t, ...action.toast } : t
        )
      };
    case "DISMISS_TOAST": {
      const { toastId } = action;
      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast2) => {
          addToRemoveQueue(toast2.id);
        });
      }
      return {
        ...state,
        toasts: state.toasts.map(
          (t) => t.id === toastId || toastId === void 0 ? {
            ...t,
            open: false
          } : t
        )
      };
    }
    case "REMOVE_TOAST":
      if (action.toastId === void 0) {
        return {
          ...state,
          toasts: []
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId)
      };
  }
};
const listeners = [];
let memoryState = { toasts: [] };
function dispatch(action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}
function toast({ ...props }) {
  const id = genId();
  const update = (props2) => dispatch({
    type: "UPDATE_TOAST",
    toast: { ...props2, id }
  });
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });
  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      }
    }
  });
  return {
    id,
    dismiss,
    update
  };
}
function useToast() {
  const [state, setState] = React.useState(memoryState);
  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);
  return {
    ...state,
    toast,
    dismiss: (toastId) => dispatch({ type: "DISMISS_TOAST", toastId })
  };
}
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
const ToastProvider = ToastPrimitives.Provider;
const ToastViewport = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  ToastPrimitives.Viewport,
  {
    ref,
    className: cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    ),
    ...props
  }
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;
const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive: "destructive group border-destructive bg-destructive text-destructive-foreground"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
const Toast = React.forwardRef(({ className, variant, ...props }, ref) => {
  return /* @__PURE__ */ jsx(
    ToastPrimitives.Root,
    {
      ref,
      className: cn(toastVariants({ variant }), className),
      ...props
    }
  );
});
Toast.displayName = ToastPrimitives.Root.displayName;
const ToastAction = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  ToastPrimitives.Action,
  {
    ref,
    className: cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
      className
    ),
    ...props
  }
));
ToastAction.displayName = ToastPrimitives.Action.displayName;
const ToastClose = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  ToastPrimitives.Close,
  {
    ref,
    className: cn(
      "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",
      className
    ),
    "toast-close": "",
    ...props,
    children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
  }
));
ToastClose.displayName = ToastPrimitives.Close.displayName;
const ToastTitle = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  ToastPrimitives.Title,
  {
    ref,
    className: cn("text-sm font-semibold", className),
    ...props
  }
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;
const ToastDescription = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  ToastPrimitives.Description,
  {
    ref,
    className: cn("text-sm opacity-90", className),
    ...props
  }
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;
function Toaster() {
  const { toasts } = useToast();
  return /* @__PURE__ */ jsxs(ToastProvider, { children: [
    toasts.map(function({ id, title, description, action, ...props }) {
      return /* @__PURE__ */ jsxs(Toast, { ...props, children: [
        /* @__PURE__ */ jsxs("div", { className: "grid gap-1", children: [
          title && /* @__PURE__ */ jsx(ToastTitle, { children: title }),
          description && /* @__PURE__ */ jsx(ToastDescription, { children: description })
        ] }),
        action,
        /* @__PURE__ */ jsx(ToastClose, {})
      ] }, id);
    }),
    /* @__PURE__ */ jsx(ToastViewport, {})
  ] });
}
const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;
const TooltipContent = React.forwardRef(({ className, sideOffset = 4, ...props }, ref) => /* @__PURE__ */ jsx(
  TooltipPrimitive.Content,
  {
    ref,
    sideOffset,
    className: cn(
      "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-tooltip-content-transform-origin]",
      className
    ),
    ...props
  }
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    var _a;
    const mql = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const onChange = (e) => setIsMobile("matches" in e ? e.matches : e.matches);
    setIsMobile(mql.matches);
    (_a = mql.addEventListener) == null ? void 0 : _a.call(mql, "change", onChange);
    return () => {
      var _a2;
      return (_a2 = mql.removeEventListener) == null ? void 0 : _a2.call(mql, "change", onChange);
    };
  }, [breakpoint]);
  return isMobile;
}
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover-elevate active-elevate-2",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground border border-primary-border",
        destructive: "bg-destructive text-destructive-foreground border border-destructive-border",
        outline: (
          // Shows the background color of whatever card / sidebar / accent background it is inside of.
          // Inherits the current text color.
          " border [border-color:var(--button-outline)]  shadow-xs active:shadow-none "
        ),
        secondary: "border bg-secondary text-secondary-foreground border border-secondary-border ",
        // Add a transparent border so that when someone toggles a border on later, it doesn't shift layout/size.
        ghost: "border border-transparent"
      },
      // Heights are set as "min" heights, because sometimes Ai will place large amount of content
      // inside buttons. With a min-height they will look appropriate with small amounts of content,
      // but will expand to fit large amounts of content.
      size: {
        default: "min-h-9 px-4 py-2",
        sm: "min-h-8 rounded-md px-3 text-xs",
        lg: "min-h-10 rounded-md px-8",
        icon: "h-9 w-9"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return /* @__PURE__ */ jsx(
      Comp,
      {
        className: cn(buttonVariants({ variant, size, className })),
        ref,
        ...props
      }
    );
  }
);
Button.displayName = "Button";
const Input = React.forwardRef(
  ({ className, type, ...props }, ref) => {
    return /* @__PURE__ */ jsx(
      "input",
      {
        type,
        className: cn(
          "flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        ),
        ref,
        ...props
      }
    );
  }
);
Input.displayName = "Input";
const Separator = React.forwardRef(
  ({ className, orientation = "horizontal", decorative = true, ...props }, ref) => /* @__PURE__ */ jsx(
    SeparatorPrimitive.Root,
    {
      ref,
      decorative,
      orientation,
      className: cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      ),
      ...props
    }
  )
);
Separator.displayName = SeparatorPrimitive.Root.displayName;
const Sheet = SheetPrimitive.Root;
const SheetPortal = SheetPrimitive.Portal;
const SheetOverlay = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SheetPrimitive.Overlay,
  {
    className: cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    ),
    ...props,
    ref
  }
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;
const sheetVariants = cva(
  "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom: "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right: "inset-y-0 right-0 h-full w-3/4  border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm"
      }
    },
    defaultVariants: {
      side: "right"
    }
  }
);
const SheetContent = React.forwardRef(({ side = "right", className, children, ...props }, ref) => /* @__PURE__ */ jsxs(SheetPortal, { children: [
  /* @__PURE__ */ jsx(SheetOverlay, {}),
  /* @__PURE__ */ jsxs(
    SheetPrimitive.Content,
    {
      ref,
      className: cn(sheetVariants({ side }), className),
      ...props,
      children: [
        children,
        /* @__PURE__ */ jsxs(SheetPrimitive.Close, { className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary", children: [
          /* @__PURE__ */ jsx(X, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Close" })
        ] })
      ]
    }
  )
] }));
SheetContent.displayName = SheetPrimitive.Content.displayName;
const SheetHeader = ({
  className,
  ...props
}) => /* @__PURE__ */ jsx(
  "div",
  {
    className: cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    ),
    ...props
  }
);
SheetHeader.displayName = "SheetHeader";
const SheetTitle = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SheetPrimitive.Title,
  {
    ref,
    className: cn("text-lg font-semibold text-foreground", className),
    ...props
  }
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;
const SheetDescription = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SheetPrimitive.Description,
  {
    ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;
function Skeleton({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: cn("animate-pulse rounded-md bg-muted", className),
      ...props
    }
  );
}
const SIDEBAR_COOKIE_NAME = "sidebar_state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_MOBILE = "18rem";
const SIDEBAR_WIDTH_ICON = "3rem";
const SIDEBAR_KEYBOARD_SHORTCUT = "b";
const SidebarContext = React.createContext(null);
function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }
  return context;
}
function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  ...props
}) {
  const isMobile = useIsMobile();
  const [openMobile, setOpenMobile] = React.useState(false);
  const [_open, _setOpen] = React.useState(defaultOpen);
  const open = openProp ?? _open;
  const setOpen = React.useCallback(
    (value) => {
      const openState = typeof value === "function" ? value(open) : value;
      if (setOpenProp) {
        setOpenProp(openState);
      } else {
        _setOpen(openState);
      }
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
    },
    [setOpenProp, open]
  );
  const toggleSidebar = React.useCallback(() => {
    return isMobile ? setOpenMobile((open2) => !open2) : setOpen((open2) => !open2);
  }, [isMobile, setOpen, setOpenMobile]);
  React.useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar]);
  const state = open ? "expanded" : "collapsed";
  const contextValue = React.useMemo(
    () => ({
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar
    }),
    [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
  );
  return /* @__PURE__ */ jsx(SidebarContext.Provider, { value: contextValue, children: /* @__PURE__ */ jsx(TooltipProvider, { delayDuration: 0, children: /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "sidebar-wrapper",
      style: {
        "--sidebar-width": SIDEBAR_WIDTH,
        "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
        ...style
      },
      className: cn(
        "group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full",
        className
      ),
      ...props,
      children
    }
  ) }) });
}
function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  className,
  children,
  ...props
}) {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar();
  if (collapsible === "none") {
    return /* @__PURE__ */ jsx(
      "div",
      {
        "data-slot": "sidebar",
        className: cn(
          "bg-sidebar text-sidebar-foreground flex h-full w-[var(--sidebar-width)] flex-col",
          className
        ),
        ...props,
        children
      }
    );
  }
  if (isMobile) {
    return /* @__PURE__ */ jsx(Sheet, { open: openMobile, onOpenChange: setOpenMobile, ...props, children: /* @__PURE__ */ jsxs(
      SheetContent,
      {
        "data-sidebar": "sidebar",
        "data-slot": "sidebar",
        "data-mobile": "true",
        className: "bg-sidebar text-sidebar-foreground w-[var(--sidebar-width)] p-0 [&>button]:hidden",
        style: {
          "--sidebar-width": SIDEBAR_WIDTH_MOBILE
        },
        side,
        children: [
          /* @__PURE__ */ jsxs(SheetHeader, { className: "sr-only", children: [
            /* @__PURE__ */ jsx(SheetTitle, { children: "Sidebar" }),
            /* @__PURE__ */ jsx(SheetDescription, { children: "Displays the mobile sidebar." })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex h-full w-full flex-col", children })
        ]
      }
    ) });
  }
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: "group peer text-sidebar-foreground hidden md:block",
      "data-state": state,
      "data-collapsible": state === "collapsed" ? collapsible : "",
      "data-variant": variant,
      "data-side": side,
      "data-slot": "sidebar",
      children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            "data-slot": "sidebar-gap",
            className: cn(
              "relative w-[var(--sidebar-width)] bg-transparent transition-[width] duration-200 ease-linear",
              "group-data-[collapsible=offcanvas]:w-0",
              "group-data-[side=right]:rotate-180",
              variant === "floating" || variant === "inset" ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+var(--spacing-4))]" : "group-data-[collapsible=icon]:w-[var(--sidebar-width-icon)]"
            )
          }
        ),
        /* @__PURE__ */ jsx(
          "div",
          {
            "data-slot": "sidebar-container",
            className: cn(
              "fixed inset-y-0 z-10 hidden h-svh w-[var(--sidebar-width)] transition-[left,right,width] duration-200 ease-linear md:flex",
              side === "left" ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]" : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
              // Adjust the padding for floating and inset variants.
              variant === "floating" || variant === "inset" ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+var(--spacing-4)+2px)]" : "group-data-[collapsible=icon]:w-[var(--sidebar-width-icon)] group-data-[side=left]:border-r group-data-[side=right]:border-l",
              className
            ),
            ...props,
            children: /* @__PURE__ */ jsx(
              "div",
              {
                "data-sidebar": "sidebar",
                "data-slot": "sidebar-inner",
                className: "bg-sidebar group-data-[variant=floating]:border-sidebar-border flex h-full w-full flex-col group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:shadow-sm",
                children
              }
            )
          }
        )
      ]
    }
  );
}
function SidebarTrigger({
  className,
  onClick,
  ...props
}) {
  const { toggleSidebar } = useSidebar();
  return /* @__PURE__ */ jsxs(
    Button,
    {
      "data-sidebar": "trigger",
      "data-slot": "sidebar-trigger",
      variant: "ghost",
      size: "icon",
      className: cn("h-7 w-7", className),
      onClick: (event) => {
        onClick == null ? void 0 : onClick(event);
        toggleSidebar();
      },
      ...props,
      children: [
        /* @__PURE__ */ jsx("svg", { className: "h-4 w-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 6h16M4 12h16M4 18h16" }) }),
        /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Toggle Sidebar" })
      ]
    }
  );
}
function SidebarHeader({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "sidebar-header",
      "data-sidebar": "header",
      className: cn("flex flex-col gap-2 p-2", className),
      ...props
    }
  );
}
function SidebarFooter({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "sidebar-footer",
      "data-sidebar": "footer",
      className: cn("flex flex-col gap-2 p-2", className),
      ...props
    }
  );
}
function SidebarContent({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "sidebar-content",
      "data-sidebar": "content",
      className: cn(
        "flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden",
        className
      ),
      ...props
    }
  );
}
function SidebarGroup({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "sidebar-group",
      "data-sidebar": "group",
      className: cn("relative flex w-full min-w-0 flex-col p-2", className),
      ...props
    }
  );
}
function SidebarGroupLabel({
  className,
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "div";
  return /* @__PURE__ */ jsx(
    Comp,
    {
      "data-slot": "sidebar-group-label",
      "data-sidebar": "group-label",
      className: cn(
        "text-sidebar-foreground/70 ring-sidebar-ring flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium outline-hidden transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:h-4 [&>svg]:w-4 [&>svg]:shrink-0",
        "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
        className
      ),
      ...props
    }
  );
}
function SidebarGroupContent({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      "data-slot": "sidebar-group-content",
      "data-sidebar": "group-content",
      className: cn("w-full text-sm", className),
      ...props
    }
  );
}
function SidebarMenu({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "ul",
    {
      "data-slot": "sidebar-menu",
      "data-sidebar": "menu",
      className: cn("flex w-full min-w-0 flex-col gap-1", className),
      ...props
    }
  );
}
function SidebarMenuItem({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "li",
    {
      "data-slot": "sidebar-menu-item",
      "data-sidebar": "menu-item",
      className: cn("group/menu-item relative", className),
      ...props
    }
  );
}
const sidebarMenuButtonVariants = cva(
  "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-hidden ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:w-8! group-data-[collapsible=icon]:h-8! group-data-[collapsible=icon]:p-2! [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        outline: "bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]"
      },
      size: {
        default: "h-8 text-sm",
        sm: "h-7 text-xs",
        lg: "h-12 text-sm group-data-[collapsible=icon]:p-0!"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
function SidebarMenuButton({
  asChild = false,
  isActive = false,
  variant = "default",
  size = "default",
  tooltip,
  className,
  ...props
}) {
  const Comp = asChild ? Slot : "button";
  const { isMobile, state } = useSidebar();
  const button = /* @__PURE__ */ jsx(
    Comp,
    {
      "data-slot": "sidebar-menu-button",
      "data-sidebar": "menu-button",
      "data-size": size,
      "data-active": isActive,
      className: cn(sidebarMenuButtonVariants({ variant, size }), className),
      ...props
    }
  );
  if (!tooltip) {
    return button;
  }
  if (typeof tooltip === "string") {
    tooltip = {
      children: tooltip
    };
  }
  return /* @__PURE__ */ jsxs(Tooltip, { children: [
    /* @__PURE__ */ jsx(TooltipTrigger, { asChild: true, children: button }),
    /* @__PURE__ */ jsx(
      TooltipContent,
      {
        side: "right",
        align: "center",
        hidden: state !== "collapsed" || isMobile,
        ...tooltip
      }
    )
  ] });
}
const badgeVariants = cva(
  // Whitespace-nowrap: Badges should never wrap.
  "whitespace-nowrap inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover-elevate ",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow-xs",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground shadow-xs",
        outline: " border [border-color:var(--badge-outline)] shadow-xs"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
function Badge({ className, variant, ...props }) {
  return /* @__PURE__ */ jsx("div", { className: cn(badgeVariants({ variant }), className), ...props });
}
const translations = {
  en: {
    // Navigation
    "nav.dashboard": "Dashboard",
    "nav.livetrading": "Live Trading",
    "nav.analytics": "Analytics",
    "nav.alerts": "Alerts",
    "nav.search": "Search",
    "nav.ranking": "Top Stocks",
    "nav.settings": "Settings",
    // Dashboard
    "dashboard.title": "InsiderTrack Pro",
    "dashboard.subtitle": "AI-Powered Insider Trading Monitor",
    "dashboard.lastUpdated": "Last updated",
    "dashboard.stats.todayTrades": "Today's Trades",
    "dashboard.stats.totalVolume": "Total Volume",
    "dashboard.recentActivity": "Recent Activity",
    "dashboard.marketCoverage": "Market Coverage",
    "dashboard.topMoversToday": "Top Movers Today",
    // Trades
    "trades.loadingStats": "Loading trading statistics...",
    "trades.failedStats": "Failed to load trading statistics. Please refresh the page.",
    "trades.recentTrades": "Recent Insider Trades",
    "trades.loadingTrades": "Loading trades...",
    "trades.viewDetails": "View Details",
    "trades.loadMore": "Load More Trades",
    "trades.noTrades": "No trades available",
    "trades.company": "Company",
    "trades.shares": "Shares",
    "trades.price": "Price",
    "trades.total": "Total Value",
    "trades.signal": "Signal",
    "trades.significance": "Significance",
    "trades.filed": "Filed",
    // Settings
    "settings.title": "Settings",
    "settings.language": "Language",
    "settings.theme": "Theme",
    "settings.notifications": "Notifications",
    "settings.language.english": "English",
    "settings.language.korean": "한국어",
    "settings.language.japanese": "日本語",
    "settings.language.chinese": "中文",
    "settings.theme.light": "Light",
    "settings.theme.dark": "Dark",
    "settings.theme.system": "System",
    "settings.description": "Manage your application preferences and settings.",
    "settings.themeDescription": "Choose your preferred theme",
    "settings.notificationsFuture": "Notification settings will be available in a future update.",
    // WebSocket Status
    "websocket.connected": "Connected to live feed",
    "websocket.disconnected": "Disconnected from live feed",
    "websocket.connecting": "Connecting to live feed...",
    // General
    "general.loading": "Loading...",
    "general.error": "Error",
    "general.success": "Success",
    "general.refresh": "Refresh",
    "general.save": "Save",
    "general.cancel": "Cancel",
    "general.delete": "Delete",
    // Free Zone & Access Control
    "freeZone.delayedData": "⏰ 48-Hour Delayed Data",
    "freeZone.description": "You are viewing trades from {hours} hours ago. Upgrade to Insider Pro for real-time access.",
    "freeZone.realtimeLocked": "🔒 Real-Time Data Locked",
    "freeZone.unlockMessage": "Try 24-hour Insider access for free!",
    "freeZone.unlockButton": "Start Free Trial ($0)",
    // Locked Trade Card
    "lockedTrade.realtimeInsider": "Real-Time Insider Trade Detected",
    "lockedTrade.executive": "Executive",
    "lockedTrade.insiders": "Insiders",
    "lockedTrade.detected": "detected",
    "lockedTrade.realtimeZone": "Real-Time Zone",
    "lockedTrade.lockedTrades": "locked trades",
    "lockedTrade.unlockPrompt": "Unlock {count} real-time insider trades and see what the insiders are doing right now!",
    "lockedTrade.startTrial": "Start 5-Minute Free Trial",
    "lockedTrade.unlockDescription": "Instantly unlock all trades below and see real-time insider activities",
    "lockedTrade.unlockBelow": "Unlock below",
    // Trial Timer
    "trial.activeNotice": "✨ Free Trial Active:",
    "trial.remaining": "remaining",
    "trial.expired": "Expired",
    "trial.upgradeButton": "🚀 Upgrade to Pro",
    "trial.expiredNotice": "⏰ Your free trial has ended.",
    "trial.upgradePrompt": "Upgrade to Insider Pro to continue accessing real-time data.",
    "trial.subscribeNow": "Subscribe Now",
    // Trial Start Page
    "trial.heading": "InsiderPulse Pro 5-Minute Free Trial",
    "trial.description": "Track real-time insider trades and get AI-powered analysis",
    "trial.benefits.title": "Pro Benefits",
    "trial.benefits.realtime": "Real-time Trade Tracking",
    "trial.benefits.realtimeDesc": "Get the latest insider trades with zero delay",
    "trial.benefits.ai": "AI Analysis & Insights",
    "trial.benefits.aiDesc": "Pattern recognition and trade significance analysis",
    "trial.benefits.alerts": "Custom Alerts",
    "trial.benefits.alertsDesc": "Set alerts for stocks and conditions you care about",
    "trial.benefits.filter": "Pure Buy/Sell Signals Only",
    "trial.benefits.filterDesc": "Focus on real money movements - filters out grants, options, and awards",
    "trial.terms.title": "Free Trial Terms",
    "trial.terms.instant": "Instant Pro access",
    "trial.terms.noBilling": "No billing today",
    "trial.terms.noChargeUntilEnd": "No charge until trial ends",
    "trial.terms.cancel": "Cancel anytime — cancellation takes effect immediately",
    "trial.form.title": "Enter Payment Information",
    "trial.form.description": "Subscription starts automatically after 5-minute free trial",
    "trial.form.selectPlan": "Select Subscription Plan",
    "trial.form.monthly": "Monthly",
    "trial.form.yearly": "Annual",
    "trial.form.perMonth": "Billed monthly",
    "trial.form.perYear": "Billed annually",
    "trial.form.discount": "(33% off)",
    "trial.form.info1": "* No charges during the 5-minute free trial period.",
    "trial.form.info2": "* Automatically converts to selected plan when trial ends.",
    "trial.form.info3": "* Cancel anytime; Pro features will be disabled immediately upon cancellation.",
    "trial.success.title": "Trial Started!",
    "trial.success.message": "5-minute free trial activated. Start using real-time trade tracking now!",
    "trial.success.redirecting": "Redirecting automatically...",
    // Trial form additional translations
    "trial.yearly.perMonth": "/mo",
    "trial.yearly.savings": "💰 Save $56/year",
    "trial.errors.stripeNotLoaded": "Stripe failed to load",
    "trial.errors.enterCard": "Please enter your card information",
    "trial.errors.cardNotFound": "Card information not found",
    "trial.errors.cardVerificationFailed": "Card verification failed",
    "trial.errors.paymentSaveFailed": "Failed to save payment information",
    "trial.errors.activationFailed": "Trial activation failed",
    "trial.errors.unknown": "An unknown error occurred",
    "trial.form.cardInfo": "Card Information",
    "trial.form.securePayment": "Secure Payment · Stripe Protected",
    "trial.form.processing": "Processing...",
    "trial.form.startTrial": "Start Free Trial",
    "trial.form.afterTrialMonthly": "Auto-billing after 7 days: $14/month",
    "trial.form.afterTrialYearly": "Auto-billing after 7 days: $112/year",
    // FOMO Alerts
    "fomo.trialExpiringSoon": "⚠️ Trial expires in {hours} hours!",
    "fomo.upgradeToKeepAccess": "Upgrade now to keep real-time access.",
    "fomo.upgradeNow": "Upgrade Now",
    "fomo.missedGains": "😱 You missed {count} insider trades worth {value}!",
    "fomo.dontMissNext": "Don't miss the next big trade.",
    "fomo.subscribeNow": "Subscribe Now",
    "fomo.bigTradeAlert": "BREAKING:",
    "fomo.bought": "just bought",
    "fomo.of": "of",
    "fomo.unlockToSee": "- Unlock to see details!",
    "fomo.unlockNow": "Start Free Trial",
    // Social Share
    "social.share": "Share",
    "social.copyLink": "Copy Link",
    "social.linkCopied": "Link Copied!",
    "social.linkCopiedDesc": "Share link copied to clipboard",
    "social.copyFailed": "Copy Failed",
    "social.copyFailedDesc": "Please try again",
    // AI Signal Feed
    "aiSignal.title": "🤖 AI Trading Signals",
    "aiSignal.strongBuy": "STRONG BUY",
    "aiSignal.buy": "Buy",
    "aiSignal.caution": "Caution",
    "aiSignal.watch": "Watch",
    "aiSignal.confidence": "confidence",
    "aiSignal.insiders": "insiders",
    "aiSignal.volume": "net volume",
    "aiSignal.disclaimer": "AI-generated signals based on insider activity patterns. Not financial advice.",
    // Page specific
    "page.dashboard.subtitle": "Real-time insider trading monitoring and market intelligence",
    "page.livetrading.title": "Live Trading",
    "page.livetrading.subtitle": "Real-time insider trading activity with AI-powered analysis",
    "page.search.placeholder": "Search companies, tickers, traders, or titles...",
    "page.alerts.title": "Smart Alerts",
    "page.alerts.subtitle": "Set up intelligent alerts for insider trading activity",
    "page.analytics.title": "Market Analytics",
    "page.analytics.subtitle": "Comprehensive analysis of insider trading patterns",
    // WebSocket and Connection
    "connection.liveFeedActive": "Live data feed active - Real-time SEC filing monitoring",
    "connection.connectionLost": "Connection lost - Attempting to reconnect...",
    "connection.liveFeed": "Live Feed",
    "connection.disconnected": "Disconnected",
    // Statistics and Data
    "stats.todayTrades": "Today's Trades",
    "stats.totalVolume": "Total Volume",
    "stats.tradingSummary": "Trading Summary",
    "stats.failedLoad": "Failed to load trading statistics. Please refresh the page.",
    "stats.fromLastWeek": "from last week",
    // Filters and Search
    "filter.allTypes": "All Types",
    "filter.buyOrders": "Buy Orders",
    "filter.sellOrders": "Sell Orders",
    "filter.allSignals": "All Signals",
    "filter.buySignal": "Buy Signal",
    "filter.sellSignal": "Sell Signal",
    "filter.holdSignal": "Hold Signal",
    "filter.buyOnly": "Buy Only",
    "filter.sellOnly": "Sell Only",
    // Placeholders
    "placeholder.searchCompany": "Search company...",
    "placeholder.searchTrader": "Search trader...",
    "placeholder.noLimit": "No limit",
    "placeholder.preferredLanguage": "Choose your preferred language",
    // Alert types
    "alerts.type.volume": "Trade Volume",
    "alerts.type.company": "Company Name",
    "alerts.type.trader": "Trader Title",
    // Search page
    "search.title": "Search & Filter",
    "search.subtitle": "Search and filter insider trading data with advanced criteria",
    "search.filters": "Filters",
    "search.clear": "Clear",
    "search.tradeType": "Trade Type",
    "search.dateRange": "Date Range",
    "search.sortBy": "Sort By",
    "search.dateRange.all": "All Time",
    "search.dateRange.7d": "Last 7 days",
    "search.dateRange.30d": "Last 30 days",
    "search.dateRange.90d": "Last 90 days",
    "search.sort.recent": "Most Recent",
    "search.sort.value": "Highest Value",
    "search.sort.company": "Company Name",
    "search.results": "Results",
    "search.buyTrades": "Buy Trades",
    "search.sellTrades": "Sell Trades",
    "search.totalVolume": "Total Volume",
    "search.companies": "Companies",
    "search.traders": "Traders",
    "search.totalFound": "Total trades found",
    "search.combinedValue": "Combined value",
    "search.uniqueEntities": "Unique entities",
    "search.uniqueInsiders": "Unique insiders",
    "search.searchResults": "Search Results",
    "search.noTrades": "No trades found",
    "search.placeholder.minValue": "1000000",
    "search.value": "Min Value",
    // Alerts page
    "alerts.title": "Smart Alerts",
    "alerts.subtitle": "Set up intelligent alerts for insider trading activity",
    "alerts.active": "Active Alerts",
    "alerts.createNew": "Create New Alert",
    "alerts.alertName": "Alert Name",
    "alerts.alertType": "Alert Type",
    "alerts.condition": "Condition",
    "alerts.value": "Value",
    "alerts.paused": "Paused",
    "alerts.noAlerts": "No alerts configured yet",
    "alerts.createFirst": "Create your first alert below",
    "alerts.noMatches": "No recent matches",
    "alerts.setupMatches": "Set up alerts to see matches here",
    "alerts.condition.greaterThan": "Greater than",
    "alerts.condition.lessThan": "Less than",
    "alerts.condition.equals": "Equals",
    "alerts.condition.contains": "Contains",
    "alerts.placeholder.name": "e.g., Large Apple Trades",
    "alerts.recentMatches": "Recent Matches",
    // Live Trading page
    "liveTrading.filtersAndSearch": "Filters & Search",
    "liveTrading.tradeType": "Trade Type",
    "liveTrading.aiSignal": "AI Signal",
    "liveTrading.companyTicker": "Company/Ticker",
    "liveTrading.traderName": "Trader Name",
    "liveTrading.minValue": "Min Value ($)",
    "liveTrading.maxValue": "Max Value ($)",
    "liveTrading.liveFeed": "Live Trading Feed",
    "liveTrading.tradesShown": "trades shown",
    "liveTrading.noTrades": "No trades found",
    "liveTrading.adjustFilters": "Try adjusting your filters",
    "liveTrading.insider": "Insider",
    "liveTrading.tradeDetails": "Trade Details",
    "liveTrading.totalValue": "Total Value",
    "liveTrading.score": "Score:",
    "liveTrading.loadMore": "Load More Trades",
    "liveTrading.activeNow": "Active Now",
    "liveTrading.alertsSet": "Alerts Set",
    "liveTrading.pageTitle": "All Trades Display & Search",
    "liveTrading.pageTitleMobile": "Trade Search",
    "liveTrading.pageSubtitle": "Search and filter all insider trading data",
    "liveTrading.totalTrades": "Total",
    "liveTrading.filtered": "Filtered",
    "liveTrading.realtimeStock": "Real-time stock prices",
    "liveTrading.loaded": "loaded",
    "liveTrading.loading": "loading",
    "liveTrading.dataQuality": "Data Quality",
    "liveTrading.issues": "issues",
    "liveTrading.loadingTrades": "Loading trade data...",
    "liveTrading.alert": "Alert",
    "liveTrading.watchlist": "Watchlist",
    "liveTrading.added": "Added",
    "liveTrading.watch": "Watch",
    "liveTrading.advancedAiAnalysis": "Advanced AI Analysis",
    "liveTrading.confidenceLevel": "Confidence Level",
    "liveTrading.advancedAnalyzing": "Advanced AI analysis in progress...",
    "liveTrading.realtimePriceInfo": "Real-time Price Information",
    "liveTrading.insiderTradePrice": "Insider Trade Price",
    "liveTrading.expectedImpact": "Expected Impact",
    "liveTrading.similarTrades": "Similar Trades",
    "liveTrading.count": "count",
    "liveTrading.pieces": "pieces",
    "liveTrading.analysisInProgress": "Analyzing news, financial data, and insider patterns comprehensively",
    "liveTrading.basicAnalysis": "Basic Analysis",
    "liveTrading.loadingTradeData": "Loading trade data...",
    "liveTrading.fetchingLatestInsider": "Fetching latest insider trading information",
    "liveTrading.avgLoadingTime": "💡 Average loading time: 3-5 seconds",
    "liveTrading.remaining": "remaining",
    "liveTrading.myWatchlist": "My Watchlist",
    "liveTrading.addToWatchlist": "Add to Watchlist",
    "liveTrading.alertSettings": "Alert Settings",
    "liveTrading.emailAlerts": "Email Alerts",
    "liveTrading.smartAlerts": "Smart Alerts",
    "liveTrading.watchlistAdded": "Added to Watchlist",
    "liveTrading.realtimeAlertsAvailable": "Real-time alerts are also available",
    "liveTrading.getRealtimeAlerts": "Get real-time trading alerts",
    "liveTrading.alertEmail": "Alert Email",
    "liveTrading.alertConditions": "Alert Conditions",
    "liveTrading.successfullyAdded": "Successfully added!",
    "liveTrading.additionComplete": "Addition Complete!",
    "liveTrading.canViewSeparately": "You can now view insider trading information separately",
    "liveTrading.viewWatchlist": "View Watchlist",
    "liveTrading.whenInsiderTrade": "When insider trade occurs",
    "liveTrading.whenPriceChange": "When significant price change",
    "liveTrading.whenVolumeSpike": "When trading volume spikes",
    "liveTrading.largeTrades": "Large trades ($10M+)",
    "liveTrading.whenRecommendedPrice": "When recommended buy price is reached",
    "liveTrading.dataQualityReport": "Data Quality Report",
    "liveTrading.validTrades": "Valid Trades",
    "liveTrading.todayTrades": "Today's Trades",
    "liveTrading.totalVolume": "Total Volume",
    "liveTrading.verifiedTrades": "Verified Trades",
    "liveTrading.activeInsiders": "Active Insiders",
    "liveTrading.verifiedTradesList": "Verified Insider Trades List",
    "liveTrading.realData": "Real Data",
    "liveTrading.connectionActive": "Real-time Connection Active",
    "liveTrading.freshData": "Fresh Data",
    "liveTrading.dataUpdateNeeded": "Data Update Needed",
    "liveTrading.qualityWarnings": "Data Quality Warnings:",
    "liveTrading.lastValidation": "Last Validation",
    "liveTrading.noValidatedTrades": "No validated trade data available.",
    "liveTrading.collectorRunning": "Data collector is running or waiting for new trades.",
    "liveTrading.shares": "shares",
    "liveTrading.filingDateNotice.title": "About SEC Filing Dates",
    "liveTrading.filingDateNotice.description": 'The dates shown are SEC filing dates, not the actual trade dates. SEC regulations require insiders to report trades within 2 business days, but some filings may be delayed. The "Last Updated" timestamp shows when our system collected this data from SEC servers.',
    "liveTrading.loadingRealData": "Loading real insider trading data...",
    "liveTrading.dataLoadingFailed": "Data loading failed",
    "liveTrading.insiderBuyPrice": "Insider Buy Price",
    "liveTrading.insiderSellPrice": "Insider Sell Price",
    "liveTrading.avgInsiderBuyPrice": "Average Insider Buy Price",
    "liveTrading.aiRecommendedBuyPrice": "AI Recommended Buy Price",
    "liveTrading.currentPrice": "Current Price",
    "liveTrading.updated": "Updated",
    "liveTrading.opportunityAfterSell": "Opportunity after insider sell",
    "liveTrading.keyFindings": "Key Findings",
    "liveTrading.aiTargetPrice": "AI Target Price",
    "liveTrading.conservative": "Conservative",
    "liveTrading.realistic": "Realistic",
    "liveTrading.optimistic": "Optimistic",
    "liveTrading.actionableRecommendation": "Actionable Recommendation",
    "liveTrading.catalystsIdentified": "Catalysts identified",
    "liveTrading.follow": "Follow",
    "liveTrading.opportunistic": "Opportunistic",
    "liveTrading.lastUpdated": "Last updated",
    "liveTrading.validatedData": "Validated data",
    // Trade Card
    "tradeCard.filed": "Filed",
    "tradeCard.shares": "Shares",
    "tradeCard.avgPrice": "Avg Price",
    "tradeCard.totalValue": "Total Value",
    "tradeCard.ownership": "ownership",
    "tradeCard.details": "Details",
    // Trade List
    "tradeList.recentTrades": "Recent Insider Trades",
    "tradeList.searchCompanies": "Search companies...",
    "tradeList.sort": "Sort:",
    "tradeList.date": "Date",
    "tradeList.value": "Value",
    "tradeList.noTradesFound": "No trades found matching your criteria.",
    "tradeList.loading": "Loading...",
    "tradeList.loadMore": "Load More Trades",
    "tradeList.noMatches": "No trades found matching your criteria.",
    "tradeList.searchPlaceholder": "Search companies...",
    // Dashboard Stats
    "dashboardStats.todayTrades": "Today's Trades",
    "dashboardStats.totalVolume": "Total Volume",
    "dashboardStats.fromLastWeek": "from last week",
    "dashboardStats.recentActivity": "Recent Activity",
    "dashboardStats.monitoring": "Monitoring insider trades across all major exchanges",
    "dashboardStats.marketCoverage": "Market Coverage",
    "dashboardStats.realTimeAnalysis": "Real-time SEC filing analysis and trade classification",
    "dashboardStats.topMovers": "Top Movers Today",
    "dashboardStats.topStocks": "Most Active Stocks",
    "dashboardStats.trades": "trades",
    "dashboardStats.shares": "Shares",
    "dashboardStats.price": "Price",
    "dashboardStats.total": "Total",
    "dashboardStats.moreTrades": "more trades",
    "dashboardStats.noData": "No trading data available",
    // Analytics page
    "analytics.subtitle": "Comprehensive insider trading market analysis and insights",
    "analytics.totalTrades": "Total Trades",
    "analytics.transactionsRecorded": "Insider transactions recorded",
    "analytics.totalVolume": "Total Volume",
    "analytics.combinedValue": "Combined transaction value",
    "analytics.avgTradeSize": "Avg Trade Size",
    "analytics.averageValue": "Average transaction value",
    "analytics.companies": "Companies",
    "analytics.uniqueTracked": "Unique companies tracked",
    "analytics.tradeDistribution": "Trade Type Distribution",
    "analytics.monthlyActivity": "Monthly Trading Activity",
    "analytics.topCompanies": "Top Companies by Trading Volume",
    "analytics.trades": "trades",
    "analytics.combinedTransactionValue": "Combined transaction value",
    "analytics.averageTransactionValue": "Average transaction value",
    "analytics.uniqueCompaniesTracked": "Unique companies tracked",
    "analytics.tradeTypeDistribution": "Trade Type Distribution",
    "analytics.monthlyTradingActivity": "Monthly Trading Activity",
    "analytics.topCompaniesByVolume": "Top Companies by Trading Volume",
    "analytics.buys": "Buys",
    "analytics.sells": "Sells",
    // Trade Detail page
    "tradeDetail.notFound": "Trade Not Found",
    "tradeDetail.notFoundMessage": "The requested trade could not be found.",
    "tradeDetail.backToDashboard": "Back to Dashboard",
    "tradeDetail.back": "Back",
    "tradeDetail.title": "Trade Details",
    "tradeDetail.companyInfo": "Company Information",
    "tradeDetail.company": "Company",
    "tradeDetail.tickerSymbol": "Ticker Symbol",
    "tradeDetail.tradeType": "Trade Type",
    "tradeDetail.traderInfo": "Trader Information",
    "tradeDetail.name": "Name",
    "tradeDetail.titlePosition": "Title/Position",
    "tradeDetail.ownership": "Ownership",
    "tradeDetail.transactionDetails": "Transaction Details",
    "tradeDetail.sharesTraded": "Shares Traded",
    "tradeDetail.pricePerShare": "Price per Share",
    "tradeDetail.totalValue": "Total Transaction Value",
    "tradeDetail.filingDate": "Filing Date",
    "tradeDetail.currentPrice": "Current Stock Price",
    "tradeDetail.volume": "Volume",
    "tradeDetail.lastUpdated": "Last Updated",
    "tradeDetail.priceChangeSinceTrade": "Price Change Since Insider Trade",
    "tradeDetail.priceMovement": "Price Movement",
    "tradeDetail.analysis": "Detailed Analysis",
    "tradeDetail.priceComparison": "Price Comparison",
    "tradeDetail.tradePrice": "Trade Price:",
    "tradeDetail.currentPriceLabel": "Current Price:",
    "tradeDetail.perShareComparison": "Per share comparison",
    "tradeDetail.secFiling": "SEC Filing #",
    "tradeDetail.totalTransactionValue": "Total Transaction Value",
    "tradeDetail.currentStockPrice": "Current Stock Price",
    "tradeDetail.detailedAnalysis": "Detailed Analysis",
    "tradeDetail.actualTradePrice": "Actual Trade Price",
    "tradeDetail.insiderAvgPrice": "Insider Average Price",
    "tradeDetail.last30DaysAvg": "Last 30 days average",
    "tradeDetail.sameTicker": "Same ticker average",
    "tradeDetail.currentMarketPrice": "Current Market Price",
    "tradeDetail.realtimeEstimate": "Real-time estimate",
    "tradeDetail.marketClosed": "Market closed (last price)",
    "tradeDetail.realtimePrice": "Real-time price",
    "tradeDetail.lastClosePrice": "Last close price (market closed)",
    "tradeDetail.aiAnalysisResults": "AI Analysis Results",
    "tradeDetail.tradingPatternAnalysis": "Trading Pattern Analysis",
    "tradeDetail.investmentStrategy": "Investment Strategy",
    "tradeDetail.additionalInsights": "Additional Insights",
    "tradeDetail.overallOpinion": "Overall Opinion",
    "tradeDetail.buyRecommendation": "💹 Buy Recommendation",
    "tradeDetail.sellRecommendation": "📉 Sell Recommendation",
    "tradeDetail.holdRecommendation": "⏸️ Hold/Wait",
    "tradeDetail.insiderBuyingActivity": "Insider buying activity is positive. Investment review is recommended.",
    "tradeDetail.insiderSellingActivity": "Insider selling activity detected. Caution is advised.",
    "tradeDetail.mixedInsiderActivity": "Mixed insider trading patterns. Further information is needed.",
    "tradeDetail.confidenceLevel": "Confidence",
    "tradeDetail.clickToExpand": "▼ Click to expand",
    "tradeDetail.clickToCollapse": "▲ Click to collapse",
    "tradeDetail.marketAnalysis": "Market Analysis",
    "tradeDetail.perShare": "per share",
    // Price Comparison Chart
    "priceChart.title": "Price Comparison Chart",
    "priceChart.tradePrice": "Trade Price",
    "priceChart.currentPrice": "Current Price",
    "priceChart.today": "Today",
    "priceChart.insiderTrade": "INSIDER TRADE",
    "priceChart.movement": "Price Movement Since Trade",
    "priceChart.increased": "Price Increased",
    "priceChart.decreased": "Price Decreased",
    "priceChart.tradePriceLabel": "Trade Price:",
    "priceChart.currentLabel": "Current:",
    // Ranking page
    "ranking.title": "Top Buy Recommendations",
    "ranking.subtitle": "AI-powered stock recommendations based on insider trading patterns",
    "ranking.topStocks": "Top 10 Recommended Stocks",
    "ranking.recommendation": "Recommendation",
    "ranking.buyPotential": "Buy Potential",
    "ranking.marketCap": "Market Cap",
    "ranking.volume": "Volume",
    "ranking.priceChange": "Price Change",
    "ranking.lastPrice": "Current Price",
    "ranking.strongBuy": "Strong Buy",
    "ranking.buy": "Buy",
    "ranking.hold": "Hold",
    "ranking.analysis": "Analysis",
    "ranking.insiderActivity": "Insider Activity",
    "ranking.tradesLast30Days": "trades in last 30 days",
    "ranking.avgTradeValue": "Avg Trade Value",
    "ranking.netBuying": "Net Buying",
    "ranking.loading": "Loading stock rankings...",
    "ranking.noData": "No ranking data available",
    "ranking.refreshData": "Refresh Data",
    "ranking.lockedTitle": "Premium Feature",
    "ranking.lockedDescription": "Upgrade to Insider Pro to see our top stock recommendations based on insider trading patterns",
    "ranking.unlockButton": "Unlock Top Rankings",
    // PWA Install Prompt
    "pwa.prompt.title": "Add InsiderPulse to Home Screen",
    "pwa.prompt.subtitle": "No installation needed! Add directly to your home screen",
    "pwa.benefits.notifications.title": "Real-time Alerts",
    "pwa.benefits.notifications.description": "Instant push notifications for trades",
    "pwa.benefits.fast.title": "Lightning Fast",
    "pwa.benefits.fast.description": "Quick access from your home screen",
    "pwa.benefits.access.title": "Easy Access",
    "pwa.benefits.access.description": "Works like a native mobile app",
    "pwa.button.install": "Install Now",
    "pwa.button.later": "Maybe Later",
    "pwa.button.understood": "Got it",
    "pwa.ios.instruction": 'Tap Share button and select "Add to Home Screen"',
    // Push Notifications
    "notification.permission.title": "Enable Notifications",
    "notification.permission.description": "Stay updated with real-time insider trading alerts",
    "notification.permission.allow": "Allow Notifications",
    "notification.permission.deny": "Not Now",
    "notification.settings.title": "Notification Settings",
    "notification.settings.enabled": "Push notifications enabled",
    "notification.settings.disabled": "Push notifications disabled",
    "notification.settings.enable": "Enable",
    "notification.settings.disable": "Disable",
    "notification.type.trade": "Large Trade Alerts",
    "notification.type.pattern": "Pattern Alerts",
    "notification.type.digest": "Weekly Digest",
    // Not Found page
    "notFound.title": "404 - Page Not Found",
    "notFound.message": "The page you are looking for does not exist.",
    // Auth pages - Login
    "auth.login.title": "Login",
    "auth.login.subtitle": "Sign in to your account to continue",
    "auth.login.email": "Email",
    "auth.login.password": "Password",
    "auth.login.forgotPassword": "Forgot password?",
    "auth.login.button": "Sign In",
    "auth.login.signingIn": "Signing in...",
    "auth.login.noAccount": "Don't have an account?",
    "auth.login.signUp": "Sign up",
    "auth.login.welcome": "Welcome Back",
    "auth.login.welcomeDesc": "Continue your smart investing with insider trading data",
    "auth.login.realtimeData": "Real-time Data",
    "auth.login.realtimeDesc": "Instant updates with no delay",
    "auth.login.verifiedInfo": "Verified Information",
    "auth.login.verifiedDesc": "Based on official SEC documents",
    "auth.login.smartAlerts": "Smart Alerts",
    "auth.login.smartAlertsDesc": "Customized trading alerts",
    "auth.login.emailPlaceholder": "name@company.com",
    "auth.login.passwordPlaceholder": "Enter password",
    "auth.login.errorRequired": "Please enter email and password",
    "auth.login.errorFailed": "Login failed",
    // Auth pages - Forgot Password
    "auth.forgotPassword.title": "Forgot Password",
    "auth.forgotPassword.description": "Enter your email address and we will send you a password reset link",
    "auth.forgotPassword.emailLabel": "Email",
    "auth.forgotPassword.emailPlaceholder": "name@company.com",
    "auth.forgotPassword.sendButton": "Send Reset Link",
    "auth.forgotPassword.sending": "Sending...",
    "auth.forgotPassword.backToLogin": "Back to login",
    "auth.forgotPassword.errorEmailRequired": "Please enter your email",
    "auth.forgotPassword.errorFailed": "Failed to send reset email",
    "auth.forgotPassword.successMessage": "Password reset email has been sent",
    "auth.forgotPassword.checkEmail": "Please check your email for the password reset link",
    "auth.forgotPassword.secureReset": "Secure Password Reset",
    "auth.forgotPassword.feature1Title": "Email Verification",
    "auth.forgotPassword.feature1Description": "We will send a secure reset link to your email address",
    // Auth pages - Reset Password
    "auth.resetPassword.title": "Reset Password",
    "auth.resetPassword.description": "Enter your new password below",
    "auth.resetPassword.newPasswordLabel": "New Password",
    "auth.resetPassword.newPasswordPlaceholder": "Enter new password",
    "auth.resetPassword.confirmPasswordLabel": "Confirm Password",
    "auth.resetPassword.confirmPasswordPlaceholder": "Confirm new password",
    "auth.resetPassword.resetButton": "Reset Password",
    "auth.resetPassword.resetting": "Resetting...",
    "auth.resetPassword.backToLogin": "Back to login",
    "auth.resetPassword.errorRequired": "Please enter both password fields",
    "auth.resetPassword.errorTooShort": "Password must be at least 6 characters",
    "auth.resetPassword.errorMismatch": "Passwords do not match",
    "auth.resetPassword.errorNoToken": "Invalid or missing reset token",
    "auth.resetPassword.errorFailed": "Failed to reset password",
    "auth.resetPassword.successMessage": "Password successfully reset! Redirecting to login...",
    "auth.resetPassword.secureAccount": "Secure Your Account",
    "auth.resetPassword.feature1Title": "Strong Password",
    "auth.resetPassword.feature1Description": "Choose a strong password to keep your account secure",
    // Auth pages - Signup
    "auth.signup.title": "Create Account",
    "auth.signup.subtitle": "Join us and explore real-time insider trading insights.",
    "auth.signup.email": "Email",
    "auth.signup.password": "Password",
    "auth.signup.confirmPassword": "Confirm Password",
    "auth.signup.button": "Create Account",
    "auth.signup.creating": "Creating account...",
    "auth.signup.haveAccount": "Already have an account?",
    "auth.signup.signIn": "Sign in",
    "auth.signup.success": "Account Created",
    "auth.signup.successDesc": "Check your email to verify your account",
    "auth.signup.heroTitle": "Follow the Insiders' Investments with Data",
    "auth.signup.heroDesc": "Real-time insider trading tracking based on official SEC filings",
    "auth.signup.errorAllFields": "Please fill in all fields",
    "auth.signup.errorPasswordLength": "Password must be at least 8 characters",
    "auth.signup.errorPasswordMatch": "Passwords do not match",
    "auth.signup.errorInvalidEmail": "Please enter a valid email address",
    "auth.signup.errorFailed": "Signup failed",
    "auth.signup.redirecting": "Redirecting to login...",
    "auth.signup.redirectingToVerification": "Redirecting to verification page...",
    // Email verification
    "auth.verify.title": "Email Verification",
    "auth.verify.verifying": "Verifying email...",
    "auth.verify.success": "Verification Complete!",
    "auth.verify.alreadyVerified": "Already Verified",
    "auth.verify.error": "Verification Failed",
    "auth.verify.loading": "Please wait...",
    "auth.verify.goToLogin": "Go to Login Page",
    "auth.verify.backToLogin": "Back to Login Page",
    "auth.verify.successDesc": "You can now use all InsiderPulse features",
    "auth.verify.errorDesc": "Verification link has expired or is invalid",
    "auth.verify.noToken": "No verification token",
    // Verify Code Page (6-digit code input)
    "auth.verifyCode.title": "Email Verification",
    "auth.verifyCode.subtitle": "Enter the 6-digit code sent to",
    "auth.verifyCode.enterCode": "Enter the 6-digit verification code",
    "auth.verifyCode.errorEnterAll": "Please enter all 6 digits",
    "auth.verifyCode.errorFailed": "Verification failed",
    "auth.verifyCode.codeValid": "Code is valid for 10 minutes",
    "auth.verifyCode.verifying": "Verifying...",
    "auth.verifyCode.verify": "Verify",
    "auth.verifyCode.resendCode": "Resend Code",
    "auth.verifyCode.resending": "Sending...",
    "auth.verifyCode.resendIn": "{seconds}s until resend available",
    "auth.verifyCode.backToSignup": "Back to Sign Up",
    "auth.verifyCode.successTitle": "Verification Complete!",
    "auth.verifyCode.successDesc": "Email verification completed.\nRedirecting to login...",
    "auth.verifyCode.errorResend": "Failed to resend code",
    // Additional Live Trading translations
    "liveTrading.insiderBuyPriceLabel": "Insider Buy Price",
    "liveTrading.insiderSellPriceLabel": "Insider Sell Price",
    "liveTrading.avgInsiderBuyPriceLabel": "Average Insider Buy Price",
    "liveTrading.aiRecommendedBuyPriceLabel": "AI Recommended Buy Price",
    "liveTrading.currentPriceLabel": "Current Price",
    "liveTrading.updatedLabel": "Updated",
    "liveTrading.opportunityAfterSellLabel": "Opportunity after insider sell",
    "liveTrading.keyFindingsLabel": "Key Findings",
    "liveTrading.aiTargetPriceLabel": "AI Target Price",
    "liveTrading.conservativeLabel": "Conservative",
    "liveTrading.realisticLabel": "Realistic",
    "liveTrading.optimisticLabel": "Optimistic",
    "liveTrading.actionableRecommendationLabel": "Actionable Recommendation",
    "liveTrading.catalystsIdentifiedLabel": "Catalysts identified",
    "liveTrading.followLabel": "Follow",
    "liveTrading.opportunisticLabel": "Opportunistic",
    "liveTrading.comprehensiveAnalysisLabel": "New advanced analysis results",
    "liveTrading.executiveSummaryLabel": "Executive Summary",
    "liveTrading.keyFindingsTitle": "Key Findings:",
    "liveTrading.aiTargetPriceTitle": "AI Target Price:",
    "liveTrading.actionableRecommendationTitle": "Actionable Recommendation:",
    "liveTrading.timeRangeAndCatalysts": "Time Range and Catalysts",
    "liveTrading.defaultWatchlist": "Default Watchlist",
    "liveTrading.defaultUserEmail": "User Email",
    "liveTrading.performanceOptimized": "Performance optimized data loading",
    "liveTrading.initialLoadingCount": "Initial loading reduced count",
    "liveTrading.quickLoadingFewer": "Initial fewer data for quick loading",
    "liveTrading.increaseStaleTime": "Increase to 5 minutes to reduce requery frequency",
    "liveTrading.tenMinuteCache": "10 minute cache",
    "liveTrading.advancedAiAnalysisGeneration": "Advanced AI analysis generation (replace existing stale logic)",
    "liveTrading.noTickerLoadingRelease": "If no ticker, immediately release loading",
    "liveTrading.comprehensiveAnalysisExecution": "Execute comprehensive analysis",
    "liveTrading.updateAnalysisResults": "Update analysis results for that trade",
    "liveTrading.maintainBasicInsights": "Maintain existing simple insights but replace with new ones",
    "liveTrading.provideBasicAnalysisOnFailure": "Provide basic analysis even on failure and release loading",
    "liveTrading.buySignal": "Buy signal",
    "liveTrading.sellSignal": "Sell signal",
    "liveTrading.additionalMarketAnalysisNeeded": "can be interpreted as signal but additional market analysis needed",
    "liveTrading.diversifiedInvestmentRecommended": "Diversified portfolio investment recommended",
    "liveTrading.marketVolatility": "Market volatility",
    "liveTrading.companyPerformance": "Company performance",
    "liveTrading.generalMarketConditions": "General market conditions for insider trading",
    "liveTrading.shortToMediumTerm": "Short to medium term",
    "liveTrading.enhancedFallbackInsight": "Enhanced fallback insight (used on failure)",
    "liveTrading.insiderLabel": "Insider",
    "liveTrading.companySpecificAnalysis": "Company-specific analysis",
    "liveTrading.tradeSizeAnalysis": "Trade size analysis",
    "liveTrading.largeScale": "Large scale",
    "liveTrading.mediumScale": "Medium scale",
    "liveTrading.smallScale": "Small scale",
    "liveTrading.insiderRoleImportance": "Insider role importance",
    "liveTrading.keyExecutive": "Key executive",
    "liveTrading.generalExecutive": "General executive",
    "liveTrading.positiveNegativeAnalysis": "Positive/negative analysis added",
    "liveTrading.visionProExpansion": "Vision Pro expansion",
    "liveTrading.aiEcosystemIntegration": "AI ecosystem integration",
    "liveTrading.indiaMarketEntry": "India market entry",
    "liveTrading.chinaRegulatoryStrengthening": "China regulatory strengthening",
    "liveTrading.hardwareInnovationSlowdown": "Hardware innovation slowdown",
    "liveTrading.aiDeviceDemandSurge": "AI device demand surge positive",
    "liveTrading.growthRateSlowdownConcerns": "Growth rate slowdown concerns spreading",
    "liveTrading.blackwellChipLaunch": "Blackwell chip launch",
    "liveTrading.aiSoftwareExpansion": "AI software expansion",
    "liveTrading.automotiveAiEntry": "Automotive AI entry",
    "liveTrading.geopoliticalRisk": "Geopolitical risk",
    "liveTrading.valuationBurden": "Valuation burden",
    "liveTrading.aiInfrastructureInvestmentSurge": "AI infrastructure investment surge very positive",
    "liveTrading.overvaluationConcernsRegulatoryRisk": "Overvaluation concerns and regulatory risk emergence",
    "liveTrading.fsdV13Launch": "FSD v13 launch",
    "liveTrading.robotaxiCommercialization": "Robotaxi commercialization",
    "liveTrading.energyStorageBusiness": "Energy storage business",
    "liveTrading.evCompetitionIntensification": "EV competition intensification",
    "liveTrading.chinaMarketShareDecline": "China market share decline",
    "liveTrading.autonomousDrivingCommercializationExpectations": "Autonomous driving commercialization expectations rise",
    "liveTrading.evMarketGrowthSlowdownConcerns": "EV market growth slowdown concerns",
    "liveTrading.digitalTransformationAcceleration": "Digital transformation acceleration",
    "liveTrading.newMarketEntry": "New market entry",
    "liveTrading.competitiveEnvironmentDeterioration": "Competitive environment deterioration",
    "liveTrading.costIncreasepressure": "Cost increase pressure",
    "liveTrading.industryGrowthMomentumContinuation": "Industry growth momentum continuation",
    "liveTrading.marketUncertaintyIncrease": "Market uncertainty increase",
    "liveTrading.roleImportance": "Role importance",
    "liveTrading.scaleAnalysis": "Scale analysis",
    "liveTrading.buyExecution": "Buy execution",
    "liveTrading.sellExecution": "Sell execution",
    "liveTrading.millionDollars": "Million dollars",
    "liveTrading.keyPositives": "Key positives",
    "liveTrading.majorNegatives": "Major negatives",
    "liveTrading.marketSentiment": "Market sentiment",
    "liveTrading.executiveStrongConfidence": "Executive strong confidence signal",
    "liveTrading.insiderInformationBasedInvestment": "Insider information based investment judgment",
    "liveTrading.interpretationPossible": "interpretation possible",
    "liveTrading.futurePerformanceConcerns": "Future performance concerns or",
    "liveTrading.personalFundraisingOrProfitRealization": "Personal fundraising or profit realization",
    "liveTrading.purposePossible": "purpose possible",
    "liveTrading.sharePercentage": "Share percentage",
    "liveTrading.companyInsights": "Company insights",
    "liveTrading.appleInnovationEcosystemExpansion": "Apple continuous innovation and ecosystem expansion amid",
    "liveTrading.microsoftCloudBusinessGrowthAiInvestment": "Microsoft cloud business growth and AI investment expansion timing",
    "liveTrading.teslaEvMarketExpansionAutonomousDriving": "Tesla EV market expansion and autonomous driving technology development process",
    "liveTrading.nvidiaAiChipDemandDataCenterExpansion": "NVIDIA AI chip demand surge and data center expansion period",
    "liveTrading.amazonAwsGrowthLogisticsInnovation": "Amazon AWS growth and logistics innovation acceleration timing",
    "liveTrading.companyBusinessEnvironmentChange": "Company business environment change amid",
    "liveTrading.positiveNegativeAnalysisEnhanced": "Positive/negative analysis included enhanced fallback insight",
    "liveTrading.iPhone16LaunchSuccess": "iPhone 16 launch success",
    "liveTrading.aiFunctionIntegration": "AI function integration",
    "liveTrading.serviceRevenueGrowth": "Service revenue growth",
    "liveTrading.chinaMarketCompetitionIntensification": "China market competition intensification",
    "liveTrading.hardwareGrowthSlowdown": "Hardware growth slowdown",
    "liveTrading.aiEcosystemExpansionTiming": "AI ecosystem expansion timing",
    "liveTrading.azureCloudGrowth": "Azure cloud growth",
    "liveTrading.aiCopilotExpansion": "AI Copilot expansion",
    "liveTrading.subscriptionServiceExpansion": "Subscription service expansion",
    "liveTrading.cloudCompetitionIntensification": "Cloud competition intensification",
    "liveTrading.highValuation": "High valuation",
    "liveTrading.aiInvestmentExpansionPeriod": "AI investment expansion period",
    "liveTrading.robotaxiDevelopment": "Robotaxi development",
    "liveTrading.energyBusinessGrowth": "Energy business growth",
    "liveTrading.fsdTechnologyProgress": "FSD technology progress",
    "liveTrading.chinaProductionIssues": "China production issues",
    "liveTrading.autonomousDrivingTechnologyTurningPoint": "Autonomous driving technology turning point",
    "liveTrading.awsProfitabilityImprovement": "AWS profitability improvement",
    "liveTrading.advertisingBusinessGrowth": "Advertising business growth",
    "liveTrading.logisticsEfficiency": "Logistics efficiency",
    "liveTrading.ecommerceGrowthSlowdown": "E-commerce growth slowdown",
    "liveTrading.regulatoryRisk": "Regulatory risk",
    "liveTrading.cloudProfitabilityFocusPeriod": "Cloud profitability focus period",
    "liveTrading.corporatePerformanceImprovement": "Corporate performance improvement",
    "liveTrading.marketExpansionOpportunity": "Market expansion opportunity",
    "liveTrading.competitiveEnvironmentChange": "Competitive environment change",
    "liveTrading.macroeconomicUncertainty": "Macroeconomic uncertainty",
    "liveTrading.industryOverallChangePoint": "Industry overall change point",
    "liveTrading.contextExecutive": "context executive",
    "liveTrading.buyExecutionMillion": "buy execution million",
    "liveTrading.sellExecutionMillion": "sell execution million",
    "liveTrading.greenMajorPositives": "Green major positives",
    "liveTrading.redMajorNegatives": "Red major negatives",
    "liveTrading.primaryFactor": "Primary factor",
    "liveTrading.executiveConfidenceExpression": "Executive confidence expression interpretation possible but additional confirmation needed",
    "liveTrading.profitRealizationPurpose": "Profit realization purpose possible but market concern signal possibility also exists",
    "liveTrading.insiderBuyAveragePriceCalculation": "Insider buy average price calculation function",
    "liveTrading.filterBuyTradesOnly": "Filter buy trades only for that ticker",
    "liveTrading.averagePriceCalculation": "Average price calculation (volume weighted average)",
    "liveTrading.sophisticatedAiDataEnhancement": "Sophisticated AI data enhancement system - memoization optimization",
    "liveTrading.similarTradeCountCalculation": "Similar trade count calculation",
    "liveTrading.famousCompanyMoreSimilarTrades": "Famous companies have more similar trades",
    "liveTrading.longCompanyNameUsuallyBigCompany": "Long company names are usually big companies",
    "liveTrading.adjustmentByTradeSize": "Adjustment by trade size",
    "liveTrading.randomAddition": "Random addition",
    "liveTrading.maximum25Trades": "Maximum 25 trades",
    "liveTrading.averageReturnCalculation": "Average return calculation",
    "liveTrading.buyAveragePositive": "Buy average +5.2%, sell -2.8%",
    "liveTrading.positionInfluence": "Position influence",
    "liveTrading.tradeIdBasedConsistentVariation": "Trade ID based consistent variation (generate fixed value based on hash)",
    "liveTrading.consistentVariationRange": "±3% variation (consistent)",
    "liveTrading.impactPredictionCalculation": "Impact prediction calculation",
    "liveTrading.impactRangePercentage": "Impact range about 80% of average return",
    "liveTrading.actualCurrentPriceAsyncLoading": "Actual current price loaded separately asynchronously",
    "liveTrading.recommendedBuyPriceCalculatedAfterCurrentPrice": "Recommended buy price calculated after actual current price loading",
    "liveTrading.basicInsightUntilAdvancedAnalysis": "Basic insight (until advanced analysis)",
    "liveTrading.laterAsyncLoading": "Later async loading",
    "liveTrading.analysisLoadingState": "Analysis loading state",
    "liveTrading.noDependencyGenerateOnce": "No dependency generate once",
    "liveTrading.realtimeStockUpdateFunction": "Real-time stock update function",
    "liveTrading.excludeAlreadyLoadingSymbols": "Exclude already loading symbols",
    "liveTrading.updateLoadingState": "Update loading state",
    "liveTrading.updateTradeDataWithRealtimePrice": "Update trade data with real-time price info",
    "liveTrading.aiRecommendedBuyPriceCalculation": "AI recommended buy price calculation",
    "liveTrading.startAdvancedAnalysisAfterStockLoading": "Start advanced analysis after stock price loading complete",
    "liveTrading.shortDelayBeforeAnalysisStart": "Short delay before analysis start",
    "liveTrading.forceProvideAnalysisAfter10Seconds": "Force provide fallback analysis if analysis not complete after 10 seconds",
    "liveTrading.tenSecondTimeout": "10 second timeout",
    "liveTrading.removeLoadingState": "Remove loading state",
    "liveTrading.initializeTradesOptimized": "Initialize trades - optimized version",
    "liveTrading.dataQualityValidation": "Data quality validation",
    "liveTrading.dataQualityWarning": "Data quality warning",
    "liveTrading.realtimeStockUpdate": "Real-time stock update",
    "liveTrading.periodicStockUpdate": "Periodic stock update (every 5 minutes)",
    "liveTrading.fiveMinutes": "5 minutes",
    "liveTrading.realtimeDataQualityValidation": "Real-time data quality validation",
    "liveTrading.realtimeDataQualityWarning": "Real-time data quality warning",
    "liveTrading.overallDataQualityRevalidation": "Overall data quality revalidation",
    "liveTrading.autoRemoveAlertAfter5Seconds": "Auto remove alert after 5 seconds",
    "liveTrading.filteringLogicUseMemoOptimization": "Filtering logic useMemo optimization",
    "liveTrading.watchlistFiltering": "Watchlist filtering",
    "liveTrading.infiniteScrollVirtualizationState": "Infinite scroll and virtualization state",
    "liveTrading.loadFewerOnMobile": "Load fewer on mobile",
    "liveTrading.infiniteScrollDetection": "Infinite scroll detection",
    "liveTrading.tradeClickHandlersMemoization": "Trade click handlers (memoization)",
    "liveTrading.displayTradeListVirtualized": "Display trade list (virtualized)",
    "liveTrading.tradeTypeIconColorDefinition": "Trade type icon and color definition",
    "liveTrading.totalFiltered": "Total filtered",
    "liveTrading.realtimeStockLoaded": "Real-time stock loaded",
    "liveTrading.realtimeStockUpdateButton": "Real-time stock update button",
    "liveTrading.stockPrice": "Stock price",
    "liveTrading.stockUpdate": "Stock update",
    "liveTrading.realtime": "Real-time",
    "liveTrading.today": "Today",
    "liveTrading.totalTradeVolume": "Total trade volume",
    "liveTrading.active": "Active",
    "liveTrading.allTrades": "All trades",
    "liveTrading.filters": "Filters",
    "liveTrading.buy": "Buy",
    "liveTrading.sell": "Sell",
    "liveTrading.stockGrant": "Stock grant",
    "liveTrading.optionExercise": "Option exercise",
    "liveTrading.giftDonation": "Gift/donation",
    "liveTrading.other": "Other",
    "liveTrading.allTradeHistory": "All trade history",
    "liveTrading.tradesDisplayed": "trades displayed",
    "liveTrading.noTradesMatchingFilter": "No trades matching filter conditions",
    "liveTrading.adjustSearchConditions": "Adjust search conditions or try different filters",
    "liveTrading.tipChangeTradeType": 'Tip: Change trade type to "All" or widen price range',
    "liveTrading.infiniteScrollLoader": "Infinite scroll loader",
    "liveTrading.loadNewDataWhenAllLoaded": "Load new data when all data loaded",
    "liveTrading.loadingFromServer": "Loading from server...",
    "liveTrading.loadNewTrades": "Load new trades",
    "liveTrading.loadNewTradesCount": "trades at a time",
    "liveTrading.emailAlertSettingsModal": "Email alert settings modal - Modern glassmorphism design",
    "liveTrading.glowEffect": "Glow effect",
    "liveTrading.mainCard": "Main card",
    "liveTrading.headerGradient": "Header gradient",
    "liveTrading.emailInput": "Email input",
    "liveTrading.companySelection": "Company selection",
    "liveTrading.selectCompany": "Select company",
    "liveTrading.pleaseSelectCompany": "Please select a company",
    "liveTrading.alertConditionCards": "Alert condition cards",
    "liveTrading.actionButtons": "Action buttons",
    "liveTrading.alertSettingsSetForCompany": "Alert settings set for company",
    "liveTrading.watchlistAddModal": "Watchlist add modal - Success animation design",
    "liveTrading.successGlowEffect": "Success glow effect",
    "liveTrading.successHeaderLine": "Success header line",
    "liveTrading.successCheckAnimation": "Success check animation",
    "liveTrading.companyInfoCard": "Company info card",
    "liveTrading.companyLogoPlaceholder": "Company logo placeholder",
    "liveTrading.successMessageCard": "Success message card",
    "liveTrading.nowYouCanView": "Now you can view",
    "liveTrading.myWatchlistTab": "My Watchlist tab",
    "liveTrading.insiderTradingInfoSeparately": "insider trading info separately",
    "liveTrading.additionalFeatureHint": "Additional feature hint",
    "liveTrading.close": "Close",
    "liveTrading.tradeDetailInfoModal": "Trade detail info modal",
    "liveTrading.dataQualityDetailsModal": "Data quality details modal",
    "liveTrading.summary": "Summary",
    "liveTrading.issueList": "Issue list",
    "liveTrading.discoveredIssues": "Discovered issues",
    "liveTrading.affectedTrades": "Affected trades",
    "liveTrading.recommendations": "Recommendations",
    // Trade Detail Modal
    "tradeDetail.shareCount": "Share Count",
    "tradeDetail.insiderInfo": "Insider Information",
    "tradeDetail.position": "Position",
    "tradeDetail.reportDate": "Report Date",
    "tradeDetail.priceAnalysis": "Price Analysis & Investment Insights",
    "tradeDetail.keyMetrics": "Key Metrics",
    "tradeDetail.insiderTradePrice": "Insider Trade Price",
    "tradeDetail.insiderAvgTradePrice": "Insider Average Trade Price",
    "tradeDetail.integratedAiAnalysis": "Integrated AI Analysis Results",
    "tradeDetail.basicInfo": "Basic Information",
    "tradeDetail.priceAnalysisDashboard": "Price Analysis Dashboard",
    "tradeDetail.marketOpeningHours": "Market opening hours check (US Eastern Time)",
    "tradeDetail.weekendExcluded": "Weekend excluded (Mon-Fri)",
    "tradeDetail.marketHours": "Market hours: 9:30 AM - 4:00 PM ET",
    "tradeDetail.insiderPulseWatermark": "InsiderPulse watermark - fixed to modal center",
    "tradeDetail.shareScreenshot": "Share Screenshot",
    "tradeDetail.totalTransactionAmount": "Total Transaction Amount",
    "tradeDetail.sharesCount": "Shares Traded",
    "tradeDetail.shares": "shares",
    "tradeDetail.tradeTime": "Trade Time",
    "tradeDetail.current": "Current",
    "tradeDetail.averageTradePrice": "Average Trade Price",
    "tradeDetail.referencePrice": "Reference Price",
    "tradeDetail.basedOnSecFiling": "Based on SEC Filing",
    "tradeDetail.aiAnalysisGenerating": "Generating AI Analysis...",
    "tradeDetail.aiComprehensiveAnalysis": "AI Comprehensive Analysis",
    "tradeDetail.targetPriceAnalysis": "Target Price Analysis",
    "tradeDetail.conservative": "Conservative",
    "tradeDetail.realistic": "Realistic",
    "tradeDetail.optimistic": "Optimistic",
    "tradeDetail.riskAssessment": "Risk Assessment",
    "tradeDetail.riskLevel": "Risk Level",
    "tradeDetail.investmentRecommendation": "Investment Recommendation",
    "tradeDetail.aiConfidence": "AI Confidence",
    "tradeDetail.analysisTimeHorizon": "Analysis Time Horizon",
    "tradeDetail.marketSentiment": "Market Sentiment",
    "tradeDetail.sentiment.bullish": "Bullish",
    "tradeDetail.sentiment.bearish": "Bearish",
    "tradeDetail.sentiment.neutral": "Neutral",
    "tradeDetail.priceChangeSinceTradeShort": "vs. Insider Price",
    "tradeDetail.keyCatalysts": "Key Catalysts",
    "tradeDetail.latestNewsAnalysis": "Latest News Analysis",
    "tradeDetail.positive": "Positive",
    "tradeDetail.negative": "Negative",
    "tradeDetail.neutral": "Neutral",
    "tradeDetail.majorNews": "Major News",
    "tradeDetail.relevance": "Relevance",
    "tradeDetail.aiAnalysisInProgress": "AI analysis in progress...",
    "tradeDetail.preparingAdvancedAnalysis": "Preparing advanced AI analysis results",
    "tradeDetail.shareText": "{company} Insider Trade Information",
    // Dashboard
    "dashboard.loadMoreTradesError": "Failed to load more trades. Please try again.",
    // Landing Page
    "landing.browse": "Browse",
    "landing.tagline": "AI-Powered SEC Filing Analysis",
    "landing.title": "InsiderPulse: Track Insider Trading in Real-Time",
    "landing.description": "Get instant alerts and AI-powered insights from SEC Form 4 filings. Make informed investment decisions based on what corporate insiders are doing.",
    "landing.noCreditCard": "No credit card required • Free 48-hour delayed data • Upgrade anytime",
    "landing.features.title": "Everything You Need to Track Insider Activity",
    "landing.features.subtitle": "Powerful features designed for serious investors",
    "landing.features.aiAnalysis": "AI-Powered Analysis",
    "landing.features.aiAnalysisDesc": "Advanced GPT analysis extracts buy/sell signals and significance scores (1-100) from every trade",
    "landing.features.realtime": "Real-Time Updates",
    "landing.features.realtimeDesc": "WebSocket-powered live updates deliver new insider trades the moment they're filed with the SEC",
    "landing.features.filtering": "Smart Filtering",
    "landing.features.filteringDesc": "Filter by ticker, signal type, significance score, and transaction type to find the trades that matter",
    "landing.features.alerts": "Custom Alerts",
    "landing.features.alertsDesc": "Set up personalized notifications for specific companies or trade patterns you want to monitor",
    "landing.features.secData": "SEC Data Direct",
    "landing.features.secDataDesc": "Automated collection from official SEC EDGAR filings ensures accuracy and compliance",
    "landing.features.historical": "Historical Analysis",
    "landing.features.historicalDesc": "Access complete trading history and pattern analysis to identify insider buying trends",
    "landing.howItWorks.title": "How InsiderPulse Works",
    "landing.howItWorks.subtitle": "From SEC filing to actionable insight in seconds",
    "landing.howItWorks.step1": "Automated Data Collection",
    "landing.howItWorks.step1Desc": "Our system monitors SEC EDGAR filings 24/7, automatically collecting Form 4 insider trading reports every 10 minutes.",
    "landing.howItWorks.step2": "AI-Powered Analysis",
    "landing.howItWorks.step2Desc": "Each trade is instantly analyzed using advanced AI to extract significance scores, trading signals, and key insights about the transaction.",
    "landing.howItWorks.step3": "Instant Alerts",
    "landing.howItWorks.step3Desc": "Premium users receive real-time notifications when significant insider trades occur in their watchlist companies.",
    "landing.howItWorks.step4": "Make Informed Decisions",
    "landing.howItWorks.step4Desc": "Use our insights and analytics to guide your investment strategy based on what corporate insiders are doing with their own money.",
    "landing.pricing.title": "Simple, Transparent Pricing",
    "landing.pricing.subtitle": "Choose the plan that's right for you",
    "landing.pricing.free": "Free",
    "landing.pricing.premium": "Premium",
    "landing.pricing.mostPopular": "Most Popular",
    "landing.pricing.perMonth": "/month",
    "landing.pricing.freeFeature1": "48-hour delayed insider trade data",
    "landing.pricing.freeFeature2": "AI-powered analysis and insights",
    "landing.pricing.freeFeature3": "Basic filtering and search",
    "landing.pricing.freeFeature4": "Historical data access",
    "landing.pricing.premiumFeature1": "Real-time insider trade data",
    "landing.pricing.premiumFeature2": "WebSocket live updates",
    "landing.pricing.premiumFeature3": "Custom alerts and notifications",
    "landing.pricing.premiumFeature4": "Advanced filtering and analytics",
    "landing.pricing.premiumFeature5": "Priority support",
    "landing.pricing.signupFree": "Get Started Free",
    "landing.pricing.upgradePremium": "Upgrade to Premium",
    "landing.pricing.allPlans": "All plans include AI-powered analysis • Cancel anytime • No hidden fees",
    "landing.pricing.monthly": "Monthly",
    "landing.pricing.yearly": "Yearly",
    "landing.pricing.monthlyPrice": "$14",
    "landing.pricing.yearlyPrice": "$112",
    "landing.pricing.monthlyPeriod": "/month",
    "landing.pricing.yearlyPeriod": "/year",
    "landing.pricing.monthlyTrial": "3-day free trial",
    "landing.pricing.yearlyTrial": "7-day free trial",
    "landing.pricing.yearlySaveOriginal": "$168",
    "landing.pricing.savePercent": "Save 33%",
    "landing.pricing.monthlyFeature1": "Real-time insider trades (no delay)",
    "landing.pricing.monthlyFeature2": "AI-powered analysis & predictions",
    "landing.pricing.monthlyFeature3": "Advanced pattern detection",
    "landing.pricing.monthlyFeature4": "Live push notifications",
    "landing.pricing.monthlyFeature5": "Executive trade tracking",
    "landing.pricing.yearlyFeature1": "Everything in Monthly",
    "landing.pricing.yearlyFeature2": "Save $56 per year",
    "landing.pricing.yearlyFeature3": "Extended 7-day trial",
    "landing.pricing.yearlyFeature4": "Best value for serious traders",
    "landing.pricing.notReady": "Not ready yet? Start for free.",
    "landing.pricing.browseDelayed": "Browse with 48-hour delay",
    "landing.pricing.cancelAnytime": "Cancel Anytime",
    "landing.pricing.securePayment": "Secure Payment",
    "landing.pricing.noHiddenFees": "No Hidden Fees",
    "landing.footer.product": "Product",
    "landing.footer.pricing": "Pricing",
    "landing.footer.browseTrades": "Browse Trades",
    "landing.footer.company": "Company",
    "landing.footer.about": "About",
    "landing.footer.blog": "Blog",
    "landing.footer.contact": "Contact",
    "landing.footer.legal": "Legal",
    "landing.footer.privacy": "Privacy",
    "landing.footer.terms": "Terms",
    "landing.footer.sitemap": "Sitemap",
    "landing.footer.connect": "Connect",
    "landing.footer.twitter": "Twitter",
    "landing.footer.linkedin": "LinkedIn",
    "landing.footer.github": "GitHub",
    "landing.footer.copyright": "© 2025 All rights reserved",
    "landing.cta.title": "Start Tracking Insider Trades Today",
    "landing.cta.subtitle": "Join thousands of investors who use InsiderPulse to make informed trading decisions based on insider activity.",
    // Trade List Date Filters
    "tradeList.filters": "Filters",
    "tradeList.dateRange": "Date Range",
    "tradeList.dateRange.all": "All Time",
    "tradeList.dateRange.today": "Today",
    "tradeList.dateRange.week": "Last Week",
    "tradeList.dateRange.month": "Last Month",
    "tradeList.dateRange.threeMonths": "Last 3 Months",
    "tradeList.dateRange.sixMonths": "Last 6 Months",
    "tradeList.showingTrades": "Showing {count} trades"
  },
  ko: {
    // Navigation
    "nav.dashboard": "대시보드",
    "nav.livetrading": "실시간 거래",
    "nav.analytics": "분석",
    "nav.alerts": "알림",
    "nav.search": "검색",
    "nav.ranking": "추천주식",
    "nav.settings": "설정",
    // Dashboard
    "dashboard.title": "인사이더트랙 프로",
    "dashboard.subtitle": "AI 기반 내부자 거래 모니터",
    "dashboard.lastUpdated": "최종 업데이트",
    "dashboard.stats.todayTrades": "오늘의 거래",
    "dashboard.stats.totalVolume": "총 거래량",
    "dashboard.recentActivity": "최근 활동",
    "dashboard.marketCoverage": "시장 커버리지",
    "dashboard.topMoversToday": "오늘의 급등주",
    // Trades
    "trades.loadingStats": "거래 통계를 불러오는 중...",
    "trades.failedStats": "거래 통계를 불러오지 못했습니다. 페이지를 새로고침 해주세요.",
    "trades.recentTrades": "최근 내부자 거래",
    "trades.loadingTrades": "거래 정보를 불러오는 중...",
    "trades.viewDetails": "자세히 보기",
    "trades.loadMore": "더 많은 거래 보기",
    "trades.noTrades": "거래 정보가 없습니다",
    "trades.company": "회사",
    "trades.shares": "주식 수",
    "trades.price": "가격",
    "trades.total": "총 가치",
    "trades.signal": "신호",
    "trades.significance": "중요도",
    "trades.filed": "신고일",
    // Settings
    "settings.title": "설정",
    "settings.language": "언어",
    "settings.theme": "테마",
    "settings.notifications": "알림",
    "settings.language.english": "영어",
    "settings.language.korean": "한국어",
    "settings.language.japanese": "일본어",
    "settings.language.chinese": "중국어",
    "settings.theme.light": "라이트",
    "settings.theme.dark": "다크",
    "settings.theme.system": "시스템",
    "settings.description": "애플리케이션 환경설정과 설정을 관리합니다.",
    "settings.themeDescription": "선호하는 테마를 선택하세요",
    "settings.notificationsFuture": "알림 설정은 향후 업데이트에서 제공됩니다.",
    // WebSocket Status
    "websocket.connected": "실시간 피드에 연결됨",
    "websocket.disconnected": "실시간 피드 연결 끊김",
    "websocket.connecting": "실시간 피드에 연결 중...",
    // General
    "general.loading": "로딩 중...",
    "general.error": "오류",
    "general.success": "성공",
    "general.refresh": "새로고침",
    "general.save": "저장",
    "general.cancel": "취소",
    "general.delete": "삭제",
    // Free Zone & Access Control
    "freeZone.delayedData": "⏰ 48시간 지연 데이터",
    "freeZone.description": "{hours}시간 전 거래를 보고 있습니다. Insider Pro로 업그레이드하여 실시간 접근하세요.",
    "freeZone.realtimeLocked": "🔒 실시간 데이터 잠금",
    "freeZone.unlockMessage": "24시간 Insider 등급을 무료로 체험하세요!",
    "freeZone.unlockButton": "무료체험 신청 ($0)",
    // Locked Trade Card
    "lockedTrade.realtimeInsider": "실시간 내부자 거래 감지",
    "lockedTrade.executive": "임원",
    "lockedTrade.insiders": "내부자",
    "lockedTrade.detected": "감지됨",
    "lockedTrade.realtimeZone": "실시간 구역",
    "lockedTrade.lockedTrades": "개 잠금 거래",
    "lockedTrade.unlockPrompt": "{count}개의 실시간 내부자 거래를 해제하고 내부자들이 지금 무엇을 하는지 확인하세요!",
    "lockedTrade.startTrial": "5분 무료 체험 시작",
    "lockedTrade.unlockDescription": "아래 모든 거래를 즉시 잠금 해제하고 실시간 내부자 활동 확인",
    "lockedTrade.unlockBelow": "아래 거래 잠금 해제",
    // Trial Timer
    "trial.activeNotice": "✨ 무료 체험 활성화:",
    "trial.remaining": "남음",
    "trial.expired": "만료됨",
    "trial.upgradeButton": "🚀 Pro로 업그레이드",
    "trial.expiredNotice": "⏰ 무료 체험이 종료되었습니다.",
    "trial.upgradePrompt": "Insider Pro로 업그레이드하여 실시간 데이터 접근을 계속하세요.",
    "trial.subscribeNow": "지금 구독",
    // Trial Start Page
    "trial.heading": "InsiderPulse Pro 5분 무료 체험",
    "trial.description": "실시간 내부자 거래를 추적하고 AI 분석을 받아보세요",
    "trial.benefits.title": "Pro 혜택",
    "trial.benefits.realtime": "실시간 거래 추적",
    "trial.benefits.realtimeDesc": "지연 없이 최신 내부자 거래를 실시간으로 확인",
    "trial.benefits.ai": "AI 분석 및 인사이트",
    "trial.benefits.aiDesc": "패턴 인식 및 거래 의미 분석",
    "trial.benefits.alerts": "맞춤형 알림",
    "trial.benefits.alertsDesc": "관심 종목 및 조건에 맞는 알림 설정",
    "trial.benefits.filter": "순수 매수/매도 신호만 제공",
    "trial.benefits.filterDesc": "실제 자금 이동에만 집중 - 스톡그랜트, 옵션행사, 어워드 제외",
    "trial.terms.title": "무료 체험 조건",
    "trial.terms.instant": "Pro 즉시 이용 가능",
    "trial.terms.noBilling": "오늘 청구 없음",
    "trial.terms.noChargeUntilEnd": "무료체험 종료 이전에는 청구되지 않습니다",
    "trial.terms.cancel": "언제든지 취소할 수 있습니다 — 단, 취소 시 구독이 종료됩니다",
    "trial.form.title": "결제 정보 입력",
    "trial.form.description": "5분 무료 체험 후 자동으로 구독이 시작됩니다",
    "trial.form.selectPlan": "구독 플랜 선택",
    "trial.form.monthly": "월간 구독",
    "trial.form.yearly": "연간 구독",
    "trial.form.perMonth": "매월 청구",
    "trial.form.perYear": "연간 청구",
    "trial.form.discount": "(33% 할인)",
    "trial.form.info1": "* 5분 무료 체험 기간 동안 카드에서 청구되지 않습니다.",
    "trial.form.info2": "* 체험 기간 종료 시 선택하신 플랜으로 자동 전환됩니다.",
    "trial.form.info3": "* 언제든지 구독을 취소할 수 있으며, 취소 시 즉시 Pro 기능 사용이 중지됩니다.",
    "trial.success.title": "체험 시작!",
    "trial.success.message": "5분 무료 체험이 활성화되었습니다. 실시간 거래 추적을 바로 이용하세요!",
    "trial.success.redirecting": "잠시 후 자동으로 이동합니다...",
    // Trial form additional translations
    "trial.yearly.perMonth": "/월",
    "trial.yearly.savings": "💰 매년 $56 절약",
    "trial.errors.stripeNotLoaded": "Stripe가 로드되지 않았습니다",
    "trial.errors.enterCard": "카드 정보를 입력해주세요",
    "trial.errors.cardNotFound": "카드 정보를 찾을 수 없습니다",
    "trial.errors.cardVerificationFailed": "카드 정보 확인 실패",
    "trial.errors.paymentSaveFailed": "결제 정보 저장 실패",
    "trial.errors.activationFailed": "트라이얼 활성화 실패",
    "trial.errors.unknown": "알 수 없는 오류가 발생했습니다",
    "trial.form.cardInfo": "카드 정보",
    "trial.form.securePayment": "안전한 결제 · Stripe 보안 처리",
    "trial.form.processing": "처리 중...",
    "trial.form.startTrial": "무료 체험 시작하기",
    "trial.form.afterTrialMonthly": "5분 후 자동 결제: 월 $14",
    "trial.form.afterTrialYearly": "5분 후 자동 결제: 연 $112",
    // FOMO Alerts
    "fomo.trialExpiringSoon": "⚠️ 체험이 {hours}시간 후 만료됩니다!",
    "fomo.upgradeToKeepAccess": "지금 업그레이드하여 실시간 접근을 유지하세요.",
    "fomo.upgradeNow": "지금 업그레이드",
    "fomo.missedGains": "😱 {value} 상당의 내부자 거래 {count}건을 놓쳤습니다!",
    "fomo.dontMissNext": "다음 큰 거래를 놓치지 마세요.",
    "fomo.subscribeNow": "지금 구독",
    "fomo.bigTradeAlert": "속보:",
    "fomo.bought": "방금 매수했습니다",
    "fomo.of": "",
    "fomo.unlockToSee": "- 자세히 보려면 해제하세요!",
    "fomo.unlockNow": "무료체험 신청",
    // Social Share
    "social.share": "공유",
    "social.copyLink": "링크 복사",
    "social.linkCopied": "링크 복사됨!",
    "social.linkCopiedDesc": "공유 링크가 클립보드에 복사되었습니다",
    "social.copyFailed": "복사 실패",
    "social.copyFailedDesc": "다시 시도해주세요",
    // AI Signal Feed
    "aiSignal.title": "🤖 AI 거래 시그널",
    "aiSignal.strongBuy": "강력 매수",
    "aiSignal.buy": "매수",
    "aiSignal.caution": "주의",
    "aiSignal.watch": "관찰",
    "aiSignal.confidence": "신뢰도",
    "aiSignal.insiders": "내부자",
    "aiSignal.volume": "순 거래량",
    "aiSignal.disclaimer": "내부자 활동 패턴 기반 AI 생성 시그널. 투자 조언 아님.",
    // Page specific
    "page.dashboard.subtitle": "실시간 내부자 거래 모니터링 및 시장 인텔리전스",
    "page.livetrading.title": "실시간 거래",
    "page.livetrading.subtitle": "AI 기반 분석과 함께하는 실시간 내부자 거래 활동",
    "page.search.placeholder": "회사명, 티커, 거래자, 직책 검색...",
    "page.alerts.title": "스마트 알림",
    "page.alerts.subtitle": "내부자 거래 활동에 대한 지능형 알림 설정",
    "page.analytics.title": "시장 분석",
    "page.analytics.subtitle": "내부자 거래 패턴의 포괄적 분석",
    // WebSocket and Connection
    "connection.liveFeedActive": "실시간 데이터 피드 활성화 - 실시간 SEC 신고 모니터링",
    "connection.connectionLost": "연결이 끊어졌습니다 - 재연결을 시도하는 중...",
    "connection.liveFeed": "실시간 피드",
    "connection.disconnected": "연결 끊김",
    // Statistics and Data
    "stats.todayTrades": "오늘의 거래",
    "stats.totalVolume": "총 거래량",
    "stats.tradingSummary": "거래 요약",
    "stats.failedLoad": "거래 통계를 불러오지 못했습니다. 페이지를 새로고침 해주세요.",
    "stats.fromLastWeek": "지난주 대비",
    // Filters and Search
    "filter.allTypes": "모든 유형",
    "filter.buyOrders": "매수 주문",
    "filter.sellOrders": "매도 주문",
    "filter.allSignals": "모든 신호",
    "filter.buySignal": "매수 신호",
    "filter.sellSignal": "매도 신호",
    "filter.holdSignal": "보유 신호",
    "filter.buyOnly": "매수만",
    "filter.sellOnly": "매도만",
    // Placeholders
    "placeholder.searchCompany": "회사 검색...",
    "placeholder.searchTrader": "거래자 검색...",
    "placeholder.noLimit": "제한 없음",
    "placeholder.preferredLanguage": "선호하는 언어를 선택하세요",
    // Alert types
    "alerts.type.volume": "거래량",
    "alerts.type.company": "회사명",
    "alerts.type.trader": "거래자 직책",
    // Search page
    "search.title": "검색 및 필터",
    "search.subtitle": "고급 기준으로 내부자 거래 데이터를 검색하고 필터링",
    "search.filters": "필터",
    "search.clear": "지우기",
    "search.tradeType": "거래 유형",
    "search.dateRange": "날짜 범위",
    "search.sortBy": "정렬 기준",
    "search.dateRange.all": "전체 기간",
    "search.dateRange.7d": "최근 7일",
    "search.dateRange.30d": "최근 30일",
    "search.dateRange.90d": "최근 90일",
    "search.sort.recent": "최신순",
    "search.sort.value": "금액순",
    "search.sort.company": "회사명",
    "search.results": "결과",
    "search.buyTrades": "매수 거래",
    "search.sellTrades": "매도 거래",
    "search.totalVolume": "총 거래량",
    "search.companies": "회사",
    "search.traders": "거래자",
    "search.totalFound": "총 거래 건수",
    "search.combinedValue": "통합 가치",
    "search.uniqueEntities": "고유 기업",
    "search.uniqueInsiders": "고유 내부자",
    "search.searchResults": "검색 결과",
    "search.noTrades": "거래가 없습니다",
    "search.placeholder.minValue": "1000000",
    "search.value": "최소 값",
    // Alerts page
    "alerts.title": "스마트 알림",
    "alerts.subtitle": "내부자 거래 활동에 대한 지능형 알림 설정",
    "alerts.active": "활성 알림",
    "alerts.createNew": "새 알림 만들기",
    "alerts.alertName": "알림 이름",
    "alerts.alertType": "알림 유형",
    "alerts.condition": "조건",
    "alerts.value": "값",
    "alerts.paused": "일시정지",
    "alerts.noAlerts": "아직 설정된 알림이 없습니다",
    "alerts.createFirst": "아래에서 첫 번째 알림을 생성하세요",
    "alerts.noMatches": "최근 일치하는 항목이 없습니다",
    "alerts.setupMatches": "일치하는 항목을 보려면 알림을 설정하세요",
    "alerts.condition.greaterThan": "초과",
    "alerts.condition.lessThan": "미만",
    "alerts.condition.equals": "같음",
    "alerts.condition.contains": "포함",
    "alerts.placeholder.name": "예: 대형 애플 거래",
    "alerts.recentMatches": "최근 일치",
    // Live Trading page
    "liveTrading.filtersAndSearch": "필터 및 검색",
    "liveTrading.tradeType": "거래 유형",
    "liveTrading.aiSignal": "AI 신호",
    "liveTrading.companyTicker": "회사/티커",
    "liveTrading.traderName": "거래자 이름",
    "liveTrading.minValue": "최소 값 ($)",
    "liveTrading.maxValue": "최대 값 ($)",
    "liveTrading.liveFeed": "최근 내부자 거래 (1개월치만 표시)",
    "liveTrading.tradesShown": "거래 표시됨",
    "liveTrading.noTrades": "거래가 없습니다",
    "liveTrading.adjustFilters": "필터를 조정해 보세요",
    "liveTrading.insider": "내부자",
    "liveTrading.tradeDetails": "거래 세부정보",
    "liveTrading.totalValue": "총 가치",
    "liveTrading.score": "점수:",
    "liveTrading.loadMore": "더 많은 거래 불러오기",
    "liveTrading.activeNow": "현재 활성",
    "liveTrading.alertsSet": "알림 설정",
    "liveTrading.pageTitle": "모든 거래 표시 및 검색",
    "liveTrading.pageTitleMobile": "거래 검색",
    "liveTrading.pageSubtitle": "모든 내부자 거래 데이터를 검색하고 필터링할 수 있습니다",
    "liveTrading.totalTrades": "총",
    "liveTrading.filtered": "필터링",
    "liveTrading.realtimeStock": "실시간 주가",
    "liveTrading.loaded": "로드됨",
    "liveTrading.loading": "로딩 중",
    "liveTrading.dataQuality": "데이터 품질",
    "liveTrading.issues": "개 이슈",
    "liveTrading.loadingTrades": "거래 데이터를 불러오는 중...",
    "liveTrading.alert": "알림",
    "liveTrading.watchlist": "워치리스트",
    "liveTrading.added": "추가됨",
    "liveTrading.watch": "워치",
    "liveTrading.advancedAiAnalysis": "고급 AI 분석",
    "liveTrading.confidenceLevel": "신뢰도",
    "liveTrading.advancedAnalyzing": "고급 AI 분석 중...",
    "liveTrading.realtimePriceInfo": "실시간 가격 정보",
    "liveTrading.insiderTradePrice": "내부자 거래가",
    "liveTrading.expectedImpact": "예상 영향",
    "liveTrading.similarTrades": "유사 거래",
    "liveTrading.count": "건",
    "liveTrading.pieces": "개",
    "liveTrading.analysisInProgress": "뉴스, 재무 데이터, 내부자 패턴을 종합 분석하고 있습니다",
    "liveTrading.basicAnalysis": "기본 분석",
    "liveTrading.loadingTradeData": "거래 데이터 로딩 중...",
    "liveTrading.fetchingLatestInsider": "최신 내부자 거래 정보를 불러오고 있습니다",
    "liveTrading.avgLoadingTime": "💡 평균 로딩 시간: 3-5초",
    "liveTrading.remaining": "개 남음",
    "liveTrading.myWatchlist": "내 워치리스트",
    "liveTrading.addToWatchlist": "워치리스트 추가",
    "liveTrading.emailAlerts": "이메일 알림",
    "liveTrading.smartAlerts": "스마트 알림",
    "liveTrading.watchlistAdded": "워치리스트 추가됨",
    "liveTrading.realtimeAlertsAvailable": "실시간 알림 설정도 가능합니다",
    "liveTrading.getRealtimeAlerts": "실시간 거래 알림을 받아보세요",
    "liveTrading.alertEmail": "알림 받을 이메일",
    "liveTrading.alertConditions": "알림 조건",
    "liveTrading.successfullyAdded": "성공적으로 추가되었습니다!",
    "liveTrading.additionComplete": "추가 완료!",
    "liveTrading.canViewSeparately": "의 내부자 거래 정보만 따로 볼 수 있습니다",
    "liveTrading.viewWatchlist": "워치리스트 보기",
    "liveTrading.whenInsiderTrade": "내부자 거래 발생 시",
    "liveTrading.whenPriceChange": "주가 급등락 시",
    "liveTrading.whenVolumeSpike": "거래량 급증 시",
    "liveTrading.largeTrades": "대량 거래 ($10M+)",
    "liveTrading.whenRecommendedPrice": "추천 매수가격 도달 시",
    "liveTrading.dataQualityReport": "데이터 품질 리포트",
    "liveTrading.validTrades": "유효한 거래",
    "liveTrading.todayTrades": "오늘 거래",
    "liveTrading.totalVolume": "총 거래량",
    "liveTrading.verifiedTrades": "검증된 거래",
    "liveTrading.activeInsiders": "활성 내부자",
    "liveTrading.verifiedTradesList": "검증된 내부자 거래 목록",
    "liveTrading.realData": "실제 데이터",
    "liveTrading.connectionActive": "실시간 연결 활성",
    "liveTrading.connectionLost": "연결 끊김",
    "liveTrading.freshData": "최신 데이터",
    "liveTrading.dataUpdateNeeded": "데이터 업데이트 필요",
    "liveTrading.qualityWarnings": "데이터 품질 주의사항:",
    "liveTrading.lastValidation": "마지막 검증",
    "liveTrading.noValidatedTrades": "검증된 거래 데이터가 없습니다.",
    "liveTrading.collectorRunning": "데이터 수집기가 실행 중이거나 새로운 거래를 기다리고 있습니다.",
    "liveTrading.shares": "주",
    "liveTrading.filingDateNotice.title": "SEC 공시일 안내",
    "liveTrading.filingDateNotice.description": '표시된 날짜는 실제 거래일이 아닌 SEC 공시일입니다. SEC 규정상 내부자는 거래 후 2영업일 이내에 신고해야 하지만, 일부 공시는 지연될 수 있습니다. "마지막 업데이트" 시간은 저희 시스템이 SEC 서버에서 이 데이터를 수집한 시점을 나타냅니다.',
    "liveTrading.loadingRealData": "실제 내부자 거래 데이터 로딩 중...",
    "liveTrading.dataLoadingFailed": "데이터 로딩 실패",
    "liveTrading.lastUpdated": "마지막 업데이트",
    "liveTrading.validatedData": "검증된 데이터",
    // Trade Card
    "tradeCard.filed": "신고됨",
    "tradeCard.shares": "주식수",
    "tradeCard.avgPrice": "평균 가격",
    "tradeCard.totalValue": "총 가치",
    "tradeCard.ownership": "소유권",
    "tradeCard.details": "세부정보",
    // Trade List
    "tradeList.recentTrades": "최근 내부자 거래",
    "tradeList.searchCompanies": "회사 검색...",
    "tradeList.sort": "정렬:",
    "tradeList.date": "날짜",
    "tradeList.value": "가치",
    "tradeList.noTradesFound": "조건에 맞는 거래가 없습니다.",
    "tradeList.loading": "로딩 중...",
    "tradeList.loadMore": "더 많은 거래 불러오기",
    "tradeList.noMatches": "조건에 맞는 거래가 없습니다.",
    "tradeList.searchPlaceholder": "회사 검색...",
    // Dashboard Stats
    "dashboardStats.todayTrades": "오늘의 거래",
    "dashboardStats.totalVolume": "총 거래량",
    "dashboardStats.fromLastWeek": "지난주 대비",
    "dashboardStats.recentActivity": "최근 활동",
    "dashboardStats.monitoring": "모든 주요 거래소에서 내부자 거래 모니터링",
    "dashboardStats.marketCoverage": "시장 커버리지",
    "dashboardStats.realTimeAnalysis": "실시간 SEC 신고 분석 및 거래 분류",
    "dashboardStats.topMovers": "오늘의 최고 상승주",
    "dashboardStats.topStocks": "가장 활발한 종목",
    "dashboardStats.trades": "거래",
    "dashboardStats.shares": "주식수",
    "dashboardStats.price": "주가",
    "dashboardStats.total": "총액",
    "dashboardStats.moreTrades": "개 추가 거래",
    "dashboardStats.noData": "거래 데이터가 없습니다",
    // Analytics page
    "analytics.subtitle": "포괄적인 내부자 거래 시장 분석 및 인사이트",
    "analytics.totalTrades": "총 거래",
    "analytics.transactionsRecorded": "기록된 내부자 거래",
    "analytics.totalVolume": "총 거래량",
    "analytics.combinedValue": "통합 거래 가치",
    "analytics.avgTradeSize": "평균 거래 규모",
    "analytics.averageValue": "평균 거래 가치",
    "analytics.companies": "회사",
    "analytics.uniqueTracked": "추적된 고유 회사",
    "analytics.tradeDistribution": "거래 유형 분포",
    "analytics.monthlyActivity": "월별 거래 활동",
    "analytics.topCompanies": "거래량 상위 회사",
    "analytics.trades": "거래",
    "analytics.combinedTransactionValue": "통합 거래 가치",
    "analytics.averageTransactionValue": "평균 거래 가치",
    "analytics.uniqueCompaniesTracked": "추적된 고유 회사",
    "analytics.tradeTypeDistribution": "거래 유형 분포",
    "analytics.monthlyTradingActivity": "월별 거래 활동",
    "analytics.topCompaniesByVolume": "거래량 상위 회사",
    "analytics.buys": "매수",
    "analytics.sells": "매도",
    // Trade Detail page
    "tradeDetail.notFound": "거래를 찾을 수 없음",
    "tradeDetail.notFoundMessage": "요청한 거래를 찾을 수 없습니다.",
    "tradeDetail.backToDashboard": "대시보드로 돌아가기",
    "tradeDetail.back": "뒤로",
    "tradeDetail.title": "거래 세부정보",
    "tradeDetail.companyInfo": "회사 정보",
    "tradeDetail.company": "회사",
    "tradeDetail.tickerSymbol": "티커 심볼",
    "tradeDetail.tradeType": "거래 유형",
    "tradeDetail.traderInfo": "거래자 정보",
    "tradeDetail.name": "이름",
    "tradeDetail.titlePosition": "직책/지위",
    "tradeDetail.ownership": "소유권",
    "tradeDetail.transactionDetails": "거래 세부정보",
    "tradeDetail.sharesTraded": "거래된 주식수",
    "tradeDetail.pricePerShare": "주당 가격",
    "tradeDetail.totalValue": "총 거래 가치",
    "tradeDetail.filingDate": "신고 날짜",
    "tradeDetail.currentPrice": "현재 주가",
    "tradeDetail.volume": "거래량",
    "tradeDetail.lastUpdated": "최종 업데이트",
    "tradeDetail.priceChangeSinceTrade": "내부자 거래 이후 가격 변동",
    "tradeDetail.priceMovement": "가격 변화",
    "tradeDetail.analysis": "상세 분석",
    "tradeDetail.priceComparison": "가격 비교",
    "tradeDetail.tradePrice": "거래 가격:",
    "tradeDetail.currentPriceLabel": "현재 가격:",
    "tradeDetail.perShareComparison": "주당 비교",
    "tradeDetail.secFiling": "SEC 신고 #",
    "tradeDetail.totalTransactionValue": "총 거래 가치",
    "tradeDetail.currentStockPrice": "현재 주가",
    "tradeDetail.detailedAnalysis": "상세 분석",
    "tradeDetail.actualTradePrice": "실제 거래 가격",
    "tradeDetail.insiderAvgPrice": "내부자 평균거래가",
    "tradeDetail.last30DaysAvg": "최근 30일 평균",
    "tradeDetail.sameTicker": "동일 티커 평균",
    "tradeDetail.currentMarketPrice": "현재 시장가",
    "tradeDetail.realtimeEstimate": "실시간 추정",
    "tradeDetail.marketClosed": "휴장 (최근가)",
    "tradeDetail.realtimePrice": "실시간 가격",
    "tradeDetail.lastClosePrice": "마지막 종가 (휴장 중)",
    "tradeDetail.aiAnalysisResults": "AI 분석결과",
    "tradeDetail.tradingPatternAnalysis": "거래 패턴 분석",
    "tradeDetail.investmentStrategy": "투자 전략",
    "tradeDetail.additionalInsights": "추가 인사이트",
    "tradeDetail.overallOpinion": "종합의견",
    "tradeDetail.buyRecommendation": "💹 매수 추천",
    "tradeDetail.sellRecommendation": "📉 매도 추천",
    "tradeDetail.holdRecommendation": "⏸️ 보류/관망",
    "tradeDetail.insiderBuyingActivity": "내부자 매수 활동이 긍정적입니다. 투자 검토를 권장합니다.",
    "tradeDetail.insiderSellingActivity": "내부자 매도 활동이 감지되었습니다. 신중한 접근이 필요합니다.",
    "tradeDetail.mixedInsiderActivity": "내부자 거래 패턴이 혼재되어 있습니다. 추가 정보 확인이 필요합니다.",
    "tradeDetail.confidenceLevel": "신뢰도",
    "tradeDetail.clickToExpand": "▼ 클릭하여 자세히 보기",
    "tradeDetail.clickToCollapse": "▲ 클릭하여 접기",
    "tradeDetail.marketAnalysis": "시장 분석",
    "tradeDetail.perShare": "주당",
    // Price Comparison Chart
    "priceChart.title": "가격 비교 차트",
    "priceChart.tradePrice": "거래 가격",
    "priceChart.currentPrice": "현재 가격",
    "priceChart.today": "오늘",
    "priceChart.insiderTrade": "내부자 거래",
    "priceChart.movement": "거래 이후 가격 변동",
    "priceChart.increased": "가격 상승",
    "priceChart.decreased": "가격 하락",
    "priceChart.tradePriceLabel": "거래 가격:",
    "priceChart.currentLabel": "현재:",
    // Ranking page
    "ranking.title": "추천매수 순위",
    "ranking.subtitle": "내부자 거래 패턴을 기반으로 한 AI 주식 추천",
    "ranking.topStocks": "추천 주식 TOP 10",
    "ranking.recommendation": "추천",
    "ranking.buyPotential": "매수 잠재력",
    "ranking.marketCap": "시가총액",
    "ranking.volume": "거래량",
    "ranking.priceChange": "가격 변동",
    "ranking.lastPrice": "현재 가격",
    "ranking.strongBuy": "적극매수",
    "ranking.buy": "매수",
    "ranking.hold": "보유",
    "ranking.analysis": "분석",
    "ranking.insiderActivity": "내부자 활동",
    "ranking.tradesLast30Days": "최근 30일 거래",
    "ranking.avgTradeValue": "평균 거래 가치",
    "ranking.netBuying": "순매수",
    "ranking.loading": "주식 순위를 불러오는 중...",
    "ranking.noData": "순위 데이터가 없습니다",
    "ranking.refreshData": "데이터 새로고침",
    "ranking.lockedTitle": "프리미엄 기능",
    "ranking.lockedDescription": "Insider Pro로 업그레이드하여 내부자 거래 패턴 기반 최고의 주식 추천을 확인하세요",
    "ranking.unlockButton": "상위 순위 잠금 해제",
    // PWA Install Prompt
    "pwa.prompt.title": "InsiderPulse 홈 화면에 추가",
    "pwa.prompt.subtitle": "설치 필요 없이 홈 화면에 바로 추가!",
    "pwa.benefits.notifications.title": "실시간 알림",
    "pwa.benefits.notifications.description": "거래 발생 시 즉시 푸시 알림",
    "pwa.benefits.fast.title": "빠른 속도",
    "pwa.benefits.fast.description": "홈 화면에서 빠르게 접근",
    "pwa.benefits.access.title": "간편한 접근",
    "pwa.benefits.access.description": "네이티브 앱처럼 작동",
    "pwa.button.install": "지금 설치",
    "pwa.button.later": "나중에",
    "pwa.button.understood": "확인",
    "pwa.ios.instruction": '공유 버튼을 누르고 "홈 화면에 추가"를 선택하세요',
    // Push Notifications
    "notification.permission.title": "알림 활성화",
    "notification.permission.description": "실시간 내부자 거래 알림을 받아보세요",
    "notification.permission.allow": "알림 허용",
    "notification.permission.deny": "나중에",
    "notification.settings.title": "알림 설정",
    "notification.settings.enabled": "푸시 알림 활성화됨",
    "notification.settings.disabled": "푸시 알림 비활성화됨",
    "notification.settings.enable": "활성화",
    "notification.settings.disable": "비활성화",
    "notification.type.trade": "대규모 거래 알림",
    "notification.type.pattern": "패턴 알림",
    "notification.type.digest": "주간 요약",
    // Not Found page
    "notFound.title": "404 - 페이지를 찾을 수 없습니다",
    "notFound.message": "요청하신 페이지가 존재하지 않습니다.",
    // Auth pages - Login
    "auth.login.title": "로그인",
    "auth.login.subtitle": "계정에 로그인하여 계속하세요",
    "auth.login.email": "이메일",
    "auth.login.password": "비밀번호",
    "auth.login.forgotPassword": "비밀번호를 잊으셨나요?",
    "auth.login.button": "로그인",
    "auth.login.signingIn": "로그인 중...",
    "auth.login.noAccount": "계정이 없으신가요?",
    "auth.login.signUp": "회원가입",
    "auth.login.welcome": "다시 오신 것을 환영합니다",
    "auth.login.welcomeDesc": "내부자 거래 데이터로 스마트한 투자를 이어가세요",
    "auth.login.realtimeData": "실시간 데이터",
    "auth.login.realtimeDesc": "지연 없는 즉시 업데이트",
    "auth.login.verifiedInfo": "검증된 정보",
    "auth.login.verifiedDesc": "SEC 공식 문서 기반",
    "auth.login.smartAlerts": "스마트 알림",
    "auth.login.smartAlertsDesc": "맞춤형 거래 알림",
    "auth.login.emailPlaceholder": "name@company.com",
    "auth.login.passwordPlaceholder": "비밀번호 입력",
    "auth.login.errorRequired": "이메일과 비밀번호를 입력해주세요",
    "auth.login.errorFailed": "로그인에 실패했습니다",
    // Auth pages - Signup
    "auth.signup.title": "계정 만들기",
    "auth.signup.subtitle": "지금 가입하고 실시간 인사이더 거래를 추적하세요.",
    "auth.signup.email": "이메일",
    "auth.signup.password": "비밀번호",
    "auth.signup.confirmPassword": "비밀번호 확인",
    "auth.signup.button": "계정 만들기",
    "auth.signup.creating": "계정 생성 중...",
    "auth.signup.haveAccount": "이미 계정이 있으신가요?",
    "auth.signup.signIn": "로그인",
    "auth.signup.success": "가입 완료",
    "auth.signup.successDesc": "이메일을 확인하여 계정을 인증해주세요",
    "auth.signup.heroTitle": "내부자들의 투자, 데이터로 따라가세요",
    "auth.signup.heroDesc": "SEC 공식 파일링 기반 실시간 내부자 거래 추적",
    "auth.signup.errorAllFields": "모든 필드를 입력해주세요",
    "auth.signup.errorPasswordLength": "비밀번호는 최소 8자 이상이어야 합니다",
    "auth.signup.errorPasswordMatch": "비밀번호가 일치하지 않습니다",
    "auth.signup.errorInvalidEmail": "유효한 이메일 주소를 입력해주세요",
    "auth.signup.errorFailed": "회원가입에 실패했습니다",
    "auth.signup.redirecting": "로그인 페이지로 이동 중...",
    "auth.signup.redirectingToVerification": "이메일 인증 페이지로 이동 중...",
    // Email verification
    "auth.verify.title": "이메일 인증",
    "auth.verify.verifying": "이메일 인증 중...",
    "auth.verify.success": "인증 완료!",
    "auth.verify.alreadyVerified": "이미 인증됨",
    "auth.verify.error": "인증 실패",
    "auth.verify.loading": "잠시만 기다려주세요...",
    "auth.verify.goToLogin": "로그인 페이지로 이동",
    "auth.verify.backToLogin": "로그인 페이지로 돌아가기",
    "auth.verify.successDesc": "이제 InsiderPulse의 모든 기능을 사용할 수 있습니다",
    "auth.verify.errorDesc": "인증 링크가 만료되었거나 유효하지 않습니다",
    "auth.verify.noToken": "인증 토큰이 없습니다",
    // Verify Code Page (6-digit code input)
    "auth.verifyCode.title": "이메일 인증",
    "auth.verifyCode.subtitle": "으로 발송된",
    "auth.verifyCode.enterCode": "6자리 인증 코드를 입력하세요",
    "auth.verifyCode.errorEnterAll": "6자리 코드를 모두 입력해주세요",
    "auth.verifyCode.errorFailed": "인증에 실패했습니다",
    "auth.verifyCode.codeValid": "코드가 10분 동안 유효합니다",
    "auth.verifyCode.verifying": "인증 중...",
    "auth.verifyCode.verify": "인증하기",
    "auth.verifyCode.resendCode": "코드 재발송",
    "auth.verifyCode.resending": "전송 중...",
    "auth.verifyCode.resendIn": "{seconds}초 후 재발송 가능",
    "auth.verifyCode.backToSignup": "회원가입으로 돌아가기",
    "auth.verifyCode.successTitle": "인증 완료!",
    "auth.verifyCode.successDesc": "이메일 인증이 완료되었습니다.\n로그인 페이지로 이동 중...",
    "auth.verifyCode.errorResend": "코드 재발송에 실패했습니다",
    // Missing General keys
    "general.close": "닫기",
    // Missing liveTrading keys
    "liveTrading.buy": "매수",
    "liveTrading.sell": "매도",
    "liveTrading.stockGrant": "주식 부여",
    "liveTrading.optionExercise": "옵션 행사",
    "liveTrading.giftDonation": "선물/기부",
    "liveTrading.other": "기타",
    "liveTrading.close": "닫기",
    "liveTrading.summary": "요약",
    // Missing Trade Detail keys
    "tradeDetail.shareCount": "주식 수",
    "tradeDetail.insiderInfo": "내부자 정보",
    "tradeDetail.position": "직책",
    "tradeDetail.reportDate": "보고일",
    "tradeDetail.priceAnalysis": "가격 분석 및 투자 인사이트",
    "tradeDetail.keyMetrics": "주요 지표",
    "tradeDetail.insiderTradePrice": "내부자 거래 가격",
    "tradeDetail.insiderAvgTradePrice": "내부자 평균 거래 가격",
    "tradeDetail.integratedAiAnalysis": "통합 AI 분석 결과",
    "tradeDetail.basicInfo": "기본 정보",
    "tradeDetail.priceAnalysisDashboard": "가격 분석 대시보드",
    "tradeDetail.marketOpeningHours": "시장 개장 시간 확인 (미국 동부 시간)",
    "tradeDetail.weekendExcluded": "주말 제외 (월~금)",
    "tradeDetail.marketHours": "시장 시간: 오전 9:30 - 오후 4:00 ET",
    "tradeDetail.insiderPulseWatermark": "InsiderPulse 워터마크 - 모달 중앙에 고정",
    "tradeDetail.viewSecFiling": "SEC 공식 파일링 보기 (sec.gov)",
    "tradeDetail.verifiedBySec": "SEC 파일링 데이터로 검증됨",
    "tradeDetail.shareScreenshot": "스크린샷 공유",
    "tradeDetail.totalTransactionAmount": "총 거래 금액",
    "tradeDetail.sharesCount": "거래 주식 수",
    "tradeDetail.shares": "주",
    "tradeDetail.tradeTime": "거래 시점",
    "tradeDetail.current": "현재",
    "tradeDetail.averageTradePrice": "평균 거래가",
    "tradeDetail.referencePrice": "참고가",
    "tradeDetail.basedOnSecFiling": "SEC 파일링 기준",
    "tradeDetail.aiAnalysisGenerating": "AI 분석 생성 중...",
    "tradeDetail.aiComprehensiveAnalysis": "AI 종합 분석",
    "tradeDetail.targetPriceAnalysis": "목표가격 분석",
    "tradeDetail.conservative": "보수적",
    "tradeDetail.realistic": "현실적",
    "tradeDetail.optimistic": "낙관적",
    "tradeDetail.riskAssessment": "리스크 평가",
    "tradeDetail.riskLevel": "위험도",
    "tradeDetail.investmentRecommendation": "투자 권고사항",
    "tradeDetail.aiConfidence": "AI 신뢰도",
    "tradeDetail.analysisTimeHorizon": "분석 기간",
    "tradeDetail.marketSentiment": "시장 심리",
    "tradeDetail.sentiment.bullish": "강세",
    "tradeDetail.sentiment.bearish": "약세",
    "tradeDetail.sentiment.neutral": "중립",
    "tradeDetail.priceChangeSinceTradeShort": "내부자가 대비",
    "tradeDetail.keyCatalysts": "주요 촉매 요인",
    "tradeDetail.latestNewsAnalysis": "최신 뉴스 분석",
    "tradeDetail.positive": "호재",
    "tradeDetail.negative": "악재",
    "tradeDetail.neutral": "중립",
    "tradeDetail.majorNews": "주요 뉴스",
    "tradeDetail.relevance": "관련도",
    "tradeDetail.aiAnalysisInProgress": "AI 분석이 진행 중입니다...",
    "tradeDetail.preparingAdvancedAnalysis": "고급 AI 분석 결과를 준비하고 있습니다",
    "tradeDetail.shareText": "{company} 내부자 거래 정보",
    // Missing Dashboard keys
    "dashboard.loadMoreTradesError": "더 많은 거래를 불러오지 못했습니다. 다시 시도해주세요.",
    // Missing Search keys
    "search.tradesFound": "개의 거래 검색됨",
    "search.outOfTotal": "(전체 {total}개 중)",
    // Missing Notification keys
    "notification.permission.required": "알림 권한이 필요합니다",
    "notification.tradeAlert": "{company} ({ticker}) 거래 알림",
    "notification.activated": "{ticker}의 거래 알림이 활성화되었습니다!",
    "notification.failed": "알림 설정에 실패했습니다. 다시 시도해주세요.",
    // Missing Watchlist keys
    "watchlist.remove": "와치리스트에서 제거",
    // Missing Price Chart keys
    "priceChart.tradeTime": "거래 시점",
    "priceChart.insiderTradePrice": "내부자 거래가",
    "priceChart.avgTradePrice": "평균 거래가",
    "priceChart.referencePrice": "참고가",
    "priceChart.current": "현재",
    "priceChart.tradeTimeBase": "거래 시점 기준",
    "priceChart.referencePriceLabel": "참고 가격",
    "priceChart.realtimeMarketPrice": "실시간 시장가",
    "priceChart.lastClosingPrice": "마지막 종가",
    "priceChart.basedOnInsiderTradePrice": "내부자 거래가 기준",
    // Missing PWA keys
    "pwa.prompt.addToHomeScreen": "홈 화면에 추가하세요",
    "pwa.notification.requirement": "{company}의 새로운 거래 알림을 받으려면 먼저 InsiderPulse를 홈 화면에 추가해야 합니다.",
    "pwa.ios.step1": "하단 공유 버튼 탭",
    "pwa.ios.step2": '"홈 화면에 추가" 선택',
    "pwa.ios.step3": '"추가" 탭',
    "pwa.android.step1": "우측 상단 메뉴(⋮) 탭",
    "pwa.android.step2": '"앱 설치" 또는 "홈 화면에 추가" 선택',
    "pwa.android.step3": '"설치" 탭',
    "pwa.afterInstall": "설치 후에는 이 버튼을 다시 눌러 <strong>{ticker}</strong>의 거래 알림을 구독할 수 있습니다.",
    // Landing Page
    "landing.browse": "둘러보기",
    "landing.tagline": "AI 기반 SEC 공시 분석",
    "landing.title": "InsiderPulse: 실시간 내부자 거래 추적",
    "landing.description": "SEC Form 4 공시를 AI로 분석하여 즉각적인 알림과 인사이트를 받으세요. 기업 내부자의 거래를 기반으로 정보에 입각한 투자 결정을 내리세요.",
    "landing.noCreditCard": "신용카드 불필요 • 무료 48시간 지연 데이터 • 언제든 업그레이드",
    "landing.features.title": "내부자 활동 추적을 위한 모든 기능",
    "landing.features.subtitle": "진지한 투자자를 위한 강력한 기능",
    "landing.features.aiAnalysis": "AI 기반 분석",
    "landing.features.aiAnalysisDesc": "고급 GPT 분석으로 모든 거래에서 매수/매도 신호와 중요도 점수(1-100)를 추출합니다",
    "landing.features.realtime": "실시간 업데이트",
    "landing.features.realtimeDesc": "WebSocket 기반 실시간 업데이트로 SEC에 제출되는 즉시 새로운 내부자 거래를 확인할 수 있습니다",
    "landing.features.filtering": "스마트 필터링",
    "landing.features.filteringDesc": "티커, 신호 유형, 중요도 점수, 거래 유형별로 필터링하여 중요한 거래를 찾으세요",
    "landing.features.alerts": "맞춤형 알림",
    "landing.features.alertsDesc": "특정 기업이나 거래 패턴에 대한 개인화된 알림을 설정하세요",
    "landing.features.secData": "SEC 데이터 직접 연동",
    "landing.features.secDataDesc": "공식 SEC EDGAR 공시에서 자동으로 수집하여 정확성과 규정 준수를 보장합니다",
    "landing.features.historical": "과거 분석",
    "landing.features.historicalDesc": "완전한 거래 기록과 패턴 분석으로 내부자 매수 트렌드를 파악하세요",
    "landing.howItWorks.title": "InsiderPulse 작동 방식",
    "landing.howItWorks.subtitle": "SEC 공시에서 실행 가능한 인사이트까지 몇 초 만에",
    "landing.howItWorks.step1": "자동 데이터 수집",
    "landing.howItWorks.step1Desc": "시스템이 24시간 SEC EDGAR 공시를 모니터링하여 10분마다 Form 4 내부자 거래 보고서를 자동으로 수집합니다.",
    "landing.howItWorks.step2": "AI 기반 분석",
    "landing.howItWorks.step2Desc": "각 거래는 고급 AI를 사용하여 즉시 분석되어 중요도 점수, 거래 신호 및 거래에 대한 주요 인사이트를 추출합니다.",
    "landing.howItWorks.step3": "즉각적인 알림",
    "landing.howItWorks.step3Desc": "프리미엄 사용자는 관심 목록 기업에서 중요한 내부자 거래가 발생하면 실시간 알림을 받습니다.",
    "landing.howItWorks.step4": "정보에 입각한 결정",
    "landing.howItWorks.step4Desc": "기업 내부자가 자신의 돈으로 무엇을 하는지를 기반으로 투자 전략을 안내하는 인사이트와 분석을 활용하세요.",
    "landing.pricing.title": "간단하고 투명한 가격",
    "landing.pricing.subtitle": "당신에게 맞는 플랜을 선택하세요",
    "landing.pricing.free": "무료",
    "landing.pricing.premium": "프리미엄",
    "landing.pricing.mostPopular": "가장 인기 있음",
    "landing.pricing.perMonth": "/월",
    "landing.pricing.freeFeature1": "48시간 지연 내부자 거래 데이터",
    "landing.pricing.freeFeature2": "AI 기반 분석 및 인사이트",
    "landing.pricing.freeFeature3": "기본 필터링 및 검색",
    "landing.pricing.freeFeature4": "과거 데이터 액세스",
    "landing.pricing.premiumFeature1": "실시간 내부자 거래 데이터",
    "landing.pricing.premiumFeature2": "WebSocket 실시간 업데이트",
    "landing.pricing.premiumFeature3": "맞춤형 알림 및 알람",
    "landing.pricing.premiumFeature4": "고급 필터링 및 분석",
    "landing.pricing.premiumFeature5": "우선 지원",
    "landing.pricing.signupFree": "무료로 시작하기",
    "landing.pricing.upgradePremium": "프리미엄으로 업그레이드",
    "landing.pricing.allPlans": "모든 플랜에 AI 기반 분석 포함 • 언제든 취소 • 숨겨진 비용 없음",
    "landing.pricing.monthly": "월간",
    "landing.pricing.yearly": "연간",
    "landing.pricing.monthlyPrice": "$14",
    "landing.pricing.yearlyPrice": "$112",
    "landing.pricing.monthlyPeriod": "/월",
    "landing.pricing.yearlyPeriod": "/년",
    "landing.pricing.monthlyTrial": "3일 무료 체험",
    "landing.pricing.yearlyTrial": "7일 무료 체험",
    "landing.pricing.yearlySaveOriginal": "$168",
    "landing.pricing.savePercent": "33% 절약",
    "landing.pricing.monthlyFeature1": "실시간 내부자 거래 (지연 없음)",
    "landing.pricing.monthlyFeature2": "AI 기반 분석 및 예측",
    "landing.pricing.monthlyFeature3": "고급 패턴 감지",
    "landing.pricing.monthlyFeature4": "실시간 푸시 알림",
    "landing.pricing.monthlyFeature5": "임원 거래 추적",
    "landing.pricing.yearlyFeature1": "월간 플랜의 모든 기능",
    "landing.pricing.yearlyFeature2": "연간 $56 절약",
    "landing.pricing.yearlyFeature3": "연장된 7일 체험",
    "landing.pricing.yearlyFeature4": "진지한 트레이더를 위한 최고의 가치",
    "landing.pricing.notReady": "아직 준비가 안 되셨나요? 무료로 시작하세요.",
    "landing.pricing.browseDelayed": "48시간 지연 데이터로 둘러보기",
    "landing.pricing.cancelAnytime": "언제든 취소 가능",
    "landing.pricing.securePayment": "안전한 결제",
    "landing.pricing.noHiddenFees": "숨겨진 비용 없음",
    "landing.footer.product": "제품",
    "landing.footer.pricing": "가격",
    "landing.footer.browseTrades": "거래 둘러보기",
    "landing.footer.company": "회사",
    "landing.footer.about": "소개",
    "landing.footer.blog": "블로그",
    "landing.footer.contact": "문의",
    "landing.footer.legal": "법적 고지",
    "landing.footer.privacy": "개인정보처리방침",
    "landing.footer.terms": "이용약관",
    "landing.footer.sitemap": "사이트맵",
    "landing.footer.connect": "소셜",
    "landing.footer.twitter": "트위터",
    "landing.footer.linkedin": "링크드인",
    "landing.footer.github": "깃허브",
    "landing.footer.copyright": "© 2025 All rights reserved",
    "landing.cta.title": "오늘부터 내부자 거래 추적 시작",
    "landing.cta.subtitle": "InsiderPulse를 사용하여 내부자 활동을 기반으로 정보에 입각한 거래 결정을 내리는 수천 명의 투자자와 함께하세요.",
    // Trade List Date Filters
    "tradeList.filters": "필터",
    "tradeList.dateRange": "기간",
    "tradeList.dateRange.all": "전체 기간",
    "tradeList.dateRange.today": "오늘",
    "tradeList.dateRange.week": "지난 주",
    "tradeList.dateRange.month": "지난 달",
    "tradeList.dateRange.threeMonths": "최근 3개월",
    "tradeList.dateRange.sixMonths": "최근 6개월",
    "tradeList.showingTrades": "{count}개 거래 표시 중"
  },
  ja: {
    // Navigation
    "nav.dashboard": "ダッシュボード",
    "nav.livetrading": "ライブトレーディング",
    "nav.analytics": "分析",
    "nav.alerts": "アラート",
    "nav.search": "検索",
    "nav.ranking": "トップ株",
    "nav.settings": "設定",
    // Dashboard
    "dashboard.title": "インサイダートラック プロ",
    "dashboard.subtitle": "AI搭載インサイダー取引モニター",
    "dashboard.lastUpdated": "最終更新",
    "dashboard.stats.todayTrades": "今日の取引",
    "dashboard.stats.totalVolume": "総取引量",
    "dashboard.recentActivity": "最近の活動",
    "dashboard.marketCoverage": "市場カバレッジ",
    "dashboard.topMoversToday": "今日の値上がり株",
    // Trades
    "trades.loadingStats": "取引統計を読み込み中...",
    "trades.failedStats": "取引統計の読み込みに失敗しました。ページを更新してください。",
    "trades.recentTrades": "最近のインサイダー取引",
    "trades.loadingTrades": "取引を読み込み中...",
    "trades.viewDetails": "詳細を見る",
    "trades.loadMore": "さらに取引を読み込む",
    "trades.noTrades": "取引がありません",
    "trades.company": "会社",
    "trades.shares": "株式数",
    "trades.price": "価格",
    "trades.total": "総価値",
    "trades.signal": "シグナル",
    "trades.significance": "重要度",
    "trades.filed": "提出日",
    // Settings
    "settings.title": "設定",
    "settings.language": "言語",
    "settings.theme": "テーマ",
    "settings.notifications": "通知",
    "settings.language.english": "英語",
    "settings.language.korean": "韓国語",
    "settings.language.japanese": "日本語",
    "settings.language.chinese": "中国語",
    "settings.theme.light": "ライト",
    "settings.theme.dark": "ダーク",
    "settings.theme.system": "システム",
    "settings.description": "アプリケーションの設定と環境設定を管理します。",
    "settings.themeDescription": "好みのテーマを選択してください",
    "settings.notificationsFuture": "通知設定は今後のアップデートで利用可能になります。",
    // WebSocket Status
    "websocket.connected": "ライブフィードに接続済み",
    "websocket.disconnected": "ライブフィードから切断",
    "websocket.connecting": "ライブフィードに接続中...",
    // General
    "general.loading": "読み込み中...",
    "general.error": "エラー",
    "general.success": "成功",
    "general.refresh": "更新",
    "general.save": "保存",
    "general.cancel": "キャンセル",
    "general.delete": "削除",
    // Free Zone & Access Control
    "freeZone.delayedData": "⏰ 48時間遅延データ",
    "freeZone.description": "{hours}時間前の取引を表示しています。Insider Proにアップグレードしてリアルタイムアクセス。",
    "freeZone.realtimeLocked": "🔒 リアルタイムデータロック中",
    "freeZone.unlockMessage": "24時間Insiderアクセスを無料でお試しください！",
    "freeZone.unlockButton": "今すぐ解除 ($0)",
    // Locked Trade Card
    "lockedTrade.realtimeInsider": "リアルタイムインサイダー取引検出",
    "lockedTrade.executive": "役員",
    "lockedTrade.insiders": "インサイダー",
    "lockedTrade.detected": "検出",
    "lockedTrade.realtimeZone": "リアルタイムゾーン",
    "lockedTrade.lockedTrades": "件のロック取引",
    "lockedTrade.unlockPrompt": "{count}件のリアルタイムインサイダー取引をアンロックして、インサイダーが今何をしているか確認！",
    "lockedTrade.startTrial": "5分間無料トライアル開始",
    "lockedTrade.unlockDescription": "以下の全取引を即座にアンロックし、リアルタイムのインサイダー活動を確認",
    "lockedTrade.unlockBelow": "以下をアンロック",
    // Trial Timer
    "trial.activeNotice": "✨ 無料トライアル有効:",
    "trial.remaining": "残り",
    "trial.expired": "期限切れ",
    "trial.upgradeButton": "🚀 Proにアップグレード",
    "trial.expiredNotice": "⏰ 無料トライアルが終了しました。",
    "trial.upgradePrompt": "Insider Proにアップグレードしてリアルタイムデータへのアクセスを継続。",
    "trial.subscribeNow": "今すぐ購読",
    // Trial Start Page
    "trial.heading": "InsiderPulse Pro 5分間無料トライアル",
    "trial.description": "リアルタイムのインサイダー取引を追跡し、AI分析を受けましょう",
    "trial.benefits.title": "Proの特典",
    "trial.benefits.realtime": "リアルタイム取引追跡",
    "trial.benefits.realtimeDesc": "遅延なく最新のインサイダー取引をリアルタイムで確認",
    "trial.benefits.ai": "AI分析とインサイト",
    "trial.benefits.aiDesc": "パターン認識と取引の意義分析",
    "trial.benefits.alerts": "カスタムアラート",
    "trial.benefits.alertsDesc": "関心のある銘柄と条件に合わせたアラート設定",
    "trial.benefits.filter": "純粋な売買シグナルのみ",
    "trial.benefits.filterDesc": "実際の資金移動に注目 - 株式報酬、オプション行使、アワードを除外",
    "trial.terms.title": "無料トライアル条件",
    "trial.terms.instant": "Pro機能を即座に利用可能",
    "trial.terms.noBilling": "本日の請求なし",
    "trial.terms.noChargeUntilEnd": "トライアル終了まで請求なし",
    "trial.terms.cancel": "いつでもキャンセル可能 — キャンセル時はサブスクリプションが終了します",
    "trial.form.title": "お支払い情報の入力",
    "trial.form.description": "5分間の無料トライアル後、自動的にサブスクリプションが開始されます",
    "trial.form.selectPlan": "サブスクリプションプランを選択",
    "trial.form.monthly": "月額プラン",
    "trial.form.yearly": "年間プラン",
    "trial.form.perMonth": "毎月請求",
    "trial.form.perYear": "年間請求",
    "trial.form.discount": "(33%オフ)",
    "trial.form.info1": "* 5分間の無料トライアル期間中はカードに請求されません。",
    "trial.form.info2": "* トライアル期間終了時に選択したプランに自動的に切り替わります。",
    "trial.form.info3": "* いつでもサブスクリプションをキャンセルでき、キャンセル時は即座にPro機能の使用が停止されます。",
    "trial.success.title": "トライアル開始！",
    "trial.success.message": "5分間の無料トライアルが有効になりました。今すぐリアルタイム取引追跡をご利用ください！",
    "trial.success.redirecting": "自動的にリダイレクトしています...",
    // Trial form additional translations
    "trial.yearly.perMonth": "/月",
    "trial.yearly.savings": "💰 年間$56節約",
    "trial.errors.stripeNotLoaded": "Stripeの読み込みに失敗しました",
    "trial.errors.enterCard": "カード情報を入力してください",
    "trial.errors.cardNotFound": "カード情報が見つかりません",
    "trial.errors.cardVerificationFailed": "カード情報の確認に失敗しました",
    "trial.errors.paymentSaveFailed": "支払い情報の保存に失敗しました",
    "trial.errors.activationFailed": "トライアルの有効化に失敗しました",
    "trial.errors.unknown": "不明なエラーが発生しました",
    "trial.form.cardInfo": "カード情報",
    "trial.form.securePayment": "安全な決済 · Stripe保護",
    "trial.form.processing": "処理中...",
    "trial.form.startTrial": "無料トライアルを開始",
    "trial.form.afterTrialMonthly": "5分後の自動請求: 月額$14",
    "trial.form.afterTrialYearly": "5分後の自動請求: 年額$112",
    // FOMO Alerts
    "fomo.trialExpiringSoon": "⚠️ トライアルは{hours}時間後に期限切れ！",
    "fomo.upgradeToKeepAccess": "今すぐアップグレードしてリアルタイムアクセスを維持。",
    "fomo.upgradeNow": "今すぐアップグレード",
    "fomo.missedGains": "😱 {value}相当のインサイダー取引{count}件を逃しました！",
    "fomo.dontMissNext": "次の大きな取引を逃さないで。",
    "fomo.subscribeNow": "今すぐ購読",
    "fomo.bigTradeAlert": "速報:",
    "fomo.bought": "が購入",
    "fomo.of": "",
    "fomo.unlockToSee": "- 詳細を見るにはアンロック！",
    "fomo.unlockNow": "今すぐアンロック",
    // Page specific
    "page.dashboard.subtitle": "リアルタイムインサイダー取引監視と市場インテリジェンス",
    "page.livetrading.title": "ライブトレーディング",
    "page.livetrading.subtitle": "AI搭載分析によるリアルタイムインサイダー取引活動",
    "page.search.placeholder": "企業、ティッカー、トレーダー、役職を検索...",
    "page.alerts.title": "スマートアラート",
    "page.alerts.subtitle": "インサイダー取引活動のインテリジェントアラート設定",
    "page.analytics.title": "市場分析",
    "page.analytics.subtitle": "インサイダー取引パターンの包括的分析",
    // WebSocket and Connection
    "connection.liveFeedActive": "ライブデータフィード有効 - リアルタイムSEC申告監視",
    "connection.connectionLost": "接続が失われました - 再接続を試行中...",
    "connection.liveFeed": "ライブフィード",
    "connection.disconnected": "切断済み",
    // Statistics and Data
    "stats.todayTrades": "今日の取引",
    "stats.totalVolume": "総取引量",
    "stats.tradingSummary": "取引サマリー",
    "stats.failedLoad": "取引統計の読み込みに失敗しました。ページを更新してください。",
    "stats.fromLastWeek": "先週比",
    // Filters and Search
    "filter.allTypes": "すべてのタイプ",
    "filter.buyOrders": "買い注文",
    "filter.sellOrders": "売り注文",
    "filter.allSignals": "すべてのシグナル",
    "filter.buySignal": "買いシグナル",
    "filter.sellSignal": "売りシグナル",
    "filter.holdSignal": "ホールドシグナル",
    "filter.buyOnly": "買いのみ",
    "filter.sellOnly": "売りのみ",
    // Placeholders
    "placeholder.searchCompany": "企業を検索...",
    "placeholder.searchTrader": "トレーダーを検索...",
    "placeholder.noLimit": "制限なし",
    "placeholder.preferredLanguage": "好みの言語を選択してください",
    // Alert types
    "alerts.type.volume": "取引量",
    "alerts.type.company": "会社名",
    "alerts.type.trader": "トレーダー役職",
    // Search page
    "search.title": "検索とフィルター",
    "search.subtitle": "高度な条件でインサイダー取引データを検索・フィルタリング",
    "search.filters": "フィルター",
    "search.clear": "クリア",
    "search.tradeType": "取引タイプ",
    "search.dateRange": "日付範囲",
    "search.sortBy": "並び順",
    "search.dateRange.all": "全期間",
    "search.dateRange.7d": "過去7日",
    "search.dateRange.30d": "過去30日",
    "search.dateRange.90d": "過去90日",
    "search.sort.recent": "最新順",
    "search.sort.value": "金額順",
    "search.sort.company": "会社名",
    "search.results": "結果",
    "search.buyTrades": "買い取引",
    "search.sellTrades": "売り取引",
    "search.totalVolume": "総取引量",
    "search.companies": "企業",
    "search.traders": "トレーダー",
    "search.totalFound": "総取引数",
    "search.combinedValue": "合計価値",
    "search.uniqueEntities": "ユニーク企業",
    "search.uniqueInsiders": "ユニークインサイダー",
    "search.searchResults": "検索結果",
    "search.noTrades": "取引が見つかりません",
    "search.placeholder.minValue": "1000000",
    "search.value": "最小値",
    // Alerts page
    "alerts.title": "スマートアラート",
    "alerts.subtitle": "インサイダー取引活動のインテリジェントアラート設定",
    "alerts.active": "アクティブアラート",
    "alerts.createNew": "新しいアラートを作成",
    "alerts.alertName": "アラート名",
    "alerts.alertType": "アラートタイプ",
    "alerts.condition": "条件",
    "alerts.value": "値",
    "alerts.paused": "一時停止",
    "alerts.noAlerts": "アラートが設定されていません",
    "alerts.createFirst": "下で最初のアラートを作成してください",
    "alerts.noMatches": "最近の一致がありません",
    "alerts.setupMatches": "アラートを設定して一致を確認してください",
    "alerts.condition.greaterThan": "以上",
    "alerts.condition.lessThan": "未満",
    "alerts.condition.equals": "等しい",
    "alerts.condition.contains": "含む",
    "alerts.placeholder.name": "例：大型アップル取引",
    "alerts.recentMatches": "最近の一致",
    // Live Trading page
    "liveTrading.filtersAndSearch": "フィルターと検索",
    "liveTrading.tradeType": "取引タイプ",
    "liveTrading.aiSignal": "AIシグナル",
    "liveTrading.companyTicker": "企業/ティッカー",
    "liveTrading.traderName": "トレーダー名",
    "liveTrading.minValue": "最小値 ($)",
    "liveTrading.maxValue": "最大値 ($)",
    "liveTrading.liveFeed": "ライブ取引フィード",
    "liveTrading.tradesShown": "取引表示中",
    "liveTrading.noTrades": "取引が見つかりません",
    "liveTrading.adjustFilters": "フィルターを調整してください",
    "liveTrading.insider": "インサイダー",
    "liveTrading.tradeDetails": "取引詳細",
    "liveTrading.totalValue": "総価値",
    "liveTrading.score": "スコア:",
    "liveTrading.loadMore": "さらに取引を読み込む",
    "liveTrading.activeNow": "現在アクティブ",
    "liveTrading.alertsSet": "アラート設定",
    "liveTrading.pageTitle": "すべての取引表示と検索",
    "liveTrading.pageTitleMobile": "取引検索",
    "liveTrading.pageSubtitle": "すべてのインサイダー取引データを検索・フィルタリング",
    "liveTrading.totalTrades": "総",
    "liveTrading.filtered": "フィルタリング",
    "liveTrading.realtimeStock": "リアルタイム株価",
    "liveTrading.loaded": "ロード済み",
    "liveTrading.loading": "ロード中",
    "liveTrading.dataQuality": "データ品質",
    "liveTrading.issues": "個の問題",
    "liveTrading.loadingTrades": "取引データをロード中...",
    "liveTrading.alert": "アラート",
    "liveTrading.watchlist": "ウォッチリスト",
    "liveTrading.added": "追加済み",
    "liveTrading.watch": "ウォッチ",
    "liveTrading.advancedAiAnalysis": "高度AI分析",
    "liveTrading.confidenceLevel": "信頼度",
    "liveTrading.advancedAnalyzing": "高度AI分析中...",
    "liveTrading.realtimePriceInfo": "リアルタイム価格情報",
    "liveTrading.insiderTradePrice": "インサイダー取引価格",
    "liveTrading.expectedImpact": "予想影響",
    "liveTrading.similarTrades": "類似取引",
    "liveTrading.count": "件",
    "liveTrading.pieces": "個",
    "liveTrading.analysisInProgress": "ニュース、財務データ、インサイダーパターンを総合的に分析中",
    "liveTrading.basicAnalysis": "基本分析",
    "liveTrading.loadingTradeData": "取引データをロード中...",
    "liveTrading.fetchingLatestInsider": "最新のインサイダー取引情報を取得中",
    "liveTrading.avgLoadingTime": "💡 平均ロード時間: 3-5秒",
    "liveTrading.remaining": "件残り",
    "liveTrading.myWatchlist": "私のウォッチリスト",
    "liveTrading.addToWatchlist": "ウォッチリストに追加",
    "liveTrading.emailAlerts": "メールアラート",
    "liveTrading.smartAlerts": "スマートアラート",
    "liveTrading.watchlistAdded": "ウォッチリストに追加済み",
    "liveTrading.realtimeAlertsAvailable": "リアルタイムアラート設定も可能です",
    "liveTrading.getRealtimeAlerts": "リアルタイム取引アラートを受信",
    "liveTrading.alertEmail": "アラート受信メール",
    "liveTrading.alertConditions": "アラート条件",
    "liveTrading.successfullyAdded": "正常に追加されました!",
    "liveTrading.additionComplete": "追加完了!",
    "liveTrading.canViewSeparately": "のインサイダー取引情報を別々に表示できます",
    "liveTrading.viewWatchlist": "ウォッチリストを表示",
    "liveTrading.whenInsiderTrade": "インサイダー取引発生時",
    "liveTrading.whenPriceChange": "株価急変時",
    "liveTrading.whenVolumeSpike": "取引量急増時",
    "liveTrading.largeTrades": "大量取引 ($10M+)",
    "liveTrading.whenRecommendedPrice": "推奨買い価格到達時",
    "liveTrading.dataQualityReport": "データ品質レポート",
    "liveTrading.validTrades": "有効な取引",
    "liveTrading.lastUpdated": "最終更新",
    "liveTrading.validatedData": "検証済みデータ",
    "liveTrading.shares": "株",
    "liveTrading.filingDateNotice.title": "SEC提出日について",
    "liveTrading.filingDateNotice.description": "表示されている日付は実際の取引日ではなく、SEC提出日です。SEC規則により、インサイダーは取引後2営業日以内に報告する必要がありますが、一部の提出は遅延する場合があります。「最終更新」のタイムスタンプは、当システムがSECサーバーからこのデータを収集した時点を示しています。",
    // Trade Card
    "tradeCard.filed": "提出済み",
    "tradeCard.shares": "株式数",
    "tradeCard.avgPrice": "平均価格",
    "tradeCard.totalValue": "総価値",
    "tradeCard.ownership": "所有権",
    "tradeCard.details": "詳細",
    // Trade List
    "tradeList.recentTrades": "最近のインサイダー取引",
    "tradeList.searchCompanies": "企業を検索...",
    "tradeList.sort": "ソート:",
    "tradeList.date": "日付",
    "tradeList.value": "価値",
    "tradeList.noTradesFound": "条件に一致する取引が見つかりません。",
    "tradeList.loading": "読み込み中...",
    "tradeList.loadMore": "さらに取引を読み込む",
    "tradeList.noMatches": "条件に一致する取引が見つかりません。",
    "tradeList.searchPlaceholder": "企業を検索...",
    // Dashboard Stats
    "dashboardStats.todayTrades": "今日の取引",
    "dashboardStats.totalVolume": "総取引量",
    "dashboardStats.fromLastWeek": "先週比",
    "dashboardStats.recentActivity": "最近の活動",
    "dashboardStats.monitoring": "すべての主要取引所でインサイダー取引を監視",
    "dashboardStats.marketCoverage": "市場カバレッジ",
    "dashboardStats.realTimeAnalysis": "リアルタイムSEC申告分析と取引分類",
    "dashboardStats.topMovers": "今日のトップムーバー",
    "dashboardStats.topStocks": "最も活発な銘柄",
    "dashboardStats.trades": "取引",
    "dashboardStats.shares": "株式数",
    "dashboardStats.price": "株価",
    "dashboardStats.total": "合計",
    "dashboardStats.moreTrades": "件の追加取引",
    "dashboardStats.noData": "取引データがありません",
    // Analytics page
    "analytics.subtitle": "包括的なインサイダー取引市場分析とインサイト",
    "analytics.totalTrades": "総取引数",
    "analytics.transactionsRecorded": "記録されたインサイダー取引",
    "analytics.totalVolume": "総取引量",
    "analytics.combinedValue": "合計取引価値",
    "analytics.avgTradeSize": "平均取引規模",
    "analytics.averageValue": "平均取引価値",
    "analytics.companies": "企業",
    "analytics.uniqueTracked": "追跡されたユニーク企業",
    "analytics.tradeDistribution": "取引タイプ分布",
    "analytics.monthlyActivity": "月次取引活動",
    "analytics.topCompanies": "取引量上位企業",
    "analytics.trades": "取引",
    "analytics.combinedTransactionValue": "合計取引価値",
    "analytics.averageTransactionValue": "平均取引価値",
    "analytics.uniqueCompaniesTracked": "追跡されたユニーク企業",
    "analytics.tradeTypeDistribution": "取引タイプ分布",
    "analytics.monthlyTradingActivity": "月次取引活動",
    "analytics.topCompaniesByVolume": "取引量上位企業",
    "analytics.buys": "買い",
    "analytics.sells": "売り",
    // Trade Detail page
    "tradeDetail.notFound": "取引が見つかりません",
    "tradeDetail.notFoundMessage": "要求された取引が見つかりませんでした。",
    "tradeDetail.backToDashboard": "ダッシュボードに戻る",
    "tradeDetail.back": "戻る",
    "tradeDetail.title": "取引詳細",
    "tradeDetail.companyInfo": "企業情報",
    "tradeDetail.company": "企業",
    "tradeDetail.tickerSymbol": "ティッカーシンボル",
    "tradeDetail.tradeType": "取引タイプ",
    "tradeDetail.traderInfo": "トレーダー情報",
    "tradeDetail.name": "名前",
    "tradeDetail.titlePosition": "役職/地位",
    "tradeDetail.ownership": "所有権",
    "tradeDetail.transactionDetails": "取引詳細",
    "tradeDetail.sharesTraded": "取引株式数",
    "tradeDetail.pricePerShare": "1株当たり価格",
    "tradeDetail.totalValue": "総取引価値",
    "tradeDetail.filingDate": "申告日",
    "tradeDetail.currentPrice": "現在の株価",
    "tradeDetail.volume": "取引量",
    "tradeDetail.lastUpdated": "最終更新",
    "tradeDetail.priceChangeSinceTrade": "インサイダー取引後の価格変動",
    "tradeDetail.priceMovement": "価格変動",
    "tradeDetail.analysis": "詳細分析",
    "tradeDetail.priceComparison": "価格比較",
    "tradeDetail.tradePrice": "取引価格:",
    "tradeDetail.currentPriceLabel": "現在価格:",
    "tradeDetail.perShareComparison": "1株当たり比較",
    "tradeDetail.secFiling": "SEC申告 #",
    "tradeDetail.totalTransactionValue": "総取引価値",
    "tradeDetail.currentStockPrice": "現在の株価",
    "tradeDetail.detailedAnalysis": "詳細分析",
    "tradeDetail.actualTradePrice": "実際の取引価格",
    "tradeDetail.insiderAvgPrice": "インサイダー平均取引価格",
    "tradeDetail.last30DaysAvg": "過去30日平均",
    "tradeDetail.sameTicker": "同一ティッカー平均",
    "tradeDetail.currentMarketPrice": "現在の市場価格",
    "tradeDetail.realtimeEstimate": "リアルタイム推定",
    "tradeDetail.marketClosed": "休場（最終価格）",
    "tradeDetail.realtimePrice": "リアルタイム価格",
    "tradeDetail.lastClosePrice": "最終終値（休場中）",
    "tradeDetail.aiAnalysisResults": "AI分析結果",
    "tradeDetail.tradingPatternAnalysis": "取引パターン分析",
    "tradeDetail.investmentStrategy": "投資戦略",
    "tradeDetail.additionalInsights": "追加インサイト",
    "tradeDetail.overallOpinion": "総合意見",
    "tradeDetail.buyRecommendation": "💹 買い推奨",
    "tradeDetail.sellRecommendation": "📉 売り推奨",
    "tradeDetail.holdRecommendation": "⏸️ 保留/様子見",
    "tradeDetail.insiderBuyingActivity": "インサイダーの買い活動が前向きです。投資検討をお勧めします。",
    "tradeDetail.insiderSellingActivity": "インサイダーの売り活動が検出されました。慎重なアプローチが必要です。",
    "tradeDetail.mixedInsiderActivity": "インサイダー取引パターンが混在しています。追加情報の確認が必要です。",
    "tradeDetail.confidenceLevel": "信頼度",
    "tradeDetail.clickToExpand": "▼ クリックして展開",
    "tradeDetail.clickToCollapse": "▲ クリックして折りたたむ",
    "tradeDetail.marketAnalysis": "市場分析",
    "tradeDetail.perShare": "1株当たり",
    "tradeDetail.shareScreenshot": "スクリーンショットを共有",
    "tradeDetail.totalTransactionAmount": "総取引金額",
    "tradeDetail.sharesCount": "取引株数",
    "tradeDetail.shares": "株",
    "tradeDetail.tradeTime": "取引時点",
    "tradeDetail.current": "現在",
    "tradeDetail.averageTradePrice": "平均取引価格",
    "tradeDetail.referencePrice": "参考価格",
    "tradeDetail.basedOnSecFiling": "SECファイリング基準",
    "tradeDetail.aiAnalysisGenerating": "AI分析を生成中...",
    "tradeDetail.aiComprehensiveAnalysis": "AI総合分析",
    "tradeDetail.targetPriceAnalysis": "目標価格分析",
    "tradeDetail.conservative": "保守的",
    "tradeDetail.realistic": "現実的",
    "tradeDetail.optimistic": "楽観的",
    "tradeDetail.riskAssessment": "リスク評価",
    "tradeDetail.riskLevel": "リスクレベル",
    "tradeDetail.investmentRecommendation": "投資推奨",
    "tradeDetail.aiConfidence": "AI信頼度",
    "tradeDetail.analysisTimeHorizon": "分析期間",
    "tradeDetail.marketSentiment": "市場センチメント",
    "tradeDetail.sentiment.bullish": "強気",
    "tradeDetail.sentiment.bearish": "弱気",
    "tradeDetail.sentiment.neutral": "中立",
    "tradeDetail.priceChangeSinceTradeShort": "インサイダー価格比",
    "tradeDetail.keyCatalysts": "主要触媒要因",
    "tradeDetail.latestNewsAnalysis": "最新ニュース分析",
    "tradeDetail.positive": "好材料",
    "tradeDetail.negative": "悪材料",
    "tradeDetail.neutral": "中立",
    "tradeDetail.majorNews": "主要ニュース",
    "tradeDetail.relevance": "関連度",
    "tradeDetail.aiAnalysisInProgress": "AI分析が進行中です...",
    "tradeDetail.preparingAdvancedAnalysis": "高度なAI分析結果を準備しています",
    "tradeDetail.shareText": "{company} インサイダー取引情報",
    // Price Comparison Chart
    "priceChart.title": "価格比較チャート",
    "priceChart.tradePrice": "取引価格",
    "priceChart.currentPrice": "現在価格",
    "priceChart.today": "今日",
    "priceChart.insiderTrade": "インサイダー取引",
    "priceChart.movement": "取引以降の価格変動",
    "priceChart.increased": "価格上昇",
    "priceChart.decreased": "価格下落",
    "priceChart.tradePriceLabel": "取引価格:",
    "priceChart.currentLabel": "現在:",
    // Ranking page
    "ranking.title": "トップ買い推奨",
    "ranking.subtitle": "インサイダー取引パターンに基づくAI株式推奨",
    "ranking.topStocks": "推奨株式トップ10",
    "ranking.recommendation": "推奨",
    "ranking.buyPotential": "買いポテンシャル",
    "ranking.marketCap": "時価総額",
    "ranking.volume": "取引量",
    "ranking.priceChange": "価格変動",
    "ranking.lastPrice": "現在価格",
    "ranking.strongBuy": "強い買い",
    "ranking.buy": "買い",
    "ranking.hold": "ホールド",
    "ranking.analysis": "分析",
    "ranking.insiderActivity": "インサイダー活動",
    "ranking.tradesLast30Days": "過去30日の取引",
    "ranking.avgTradeValue": "平均取引価値",
    "ranking.netBuying": "ネット買い",
    "ranking.loading": "株式ランキングを読み込み中...",
    "ranking.noData": "ランキングデータがありません",
    "ranking.refreshData": "データを更新",
    "ranking.lockedTitle": "プレミアム機能",
    "ranking.lockedDescription": "Insider Proにアップグレードして、インサイダー取引パターンに基づくトップの株式推奨をご覧ください",
    "ranking.unlockButton": "トップランキングのロック解除",
    // PWA Install Prompt
    "pwa.prompt.title": "InsiderPulseをホーム画面に追加",
    "pwa.prompt.subtitle": "インストール不要！ホーム画面に直接追加",
    "pwa.benefits.notifications.title": "リアルタイム通知",
    "pwa.benefits.notifications.description": "取引発生時に即座にプッシュ通知",
    "pwa.benefits.fast.title": "高速アクセス",
    "pwa.benefits.fast.description": "ホーム画面から素早くアクセス",
    "pwa.benefits.access.title": "簡単アクセス",
    "pwa.benefits.access.description": "ネイティブアプリのように動作",
    "pwa.button.install": "今すぐインストール",
    "pwa.button.later": "後で",
    "pwa.button.understood": "了解",
    "pwa.ios.instruction": "共有ボタンをタップして「ホーム画面に追加」を選択してください",
    // Push Notifications
    "notification.permission.title": "通知を有効にする",
    "notification.permission.description": "リアルタイムのインサイダー取引通知を受け取る",
    "notification.permission.allow": "通知を許可",
    "notification.permission.deny": "後で",
    "notification.settings.title": "通知設定",
    "notification.settings.enabled": "プッシュ通知が有効",
    "notification.settings.disabled": "プッシュ通知が無効",
    "notification.settings.enable": "有効にする",
    "notification.settings.disable": "無効にする",
    "notification.type.trade": "大規模取引通知",
    "notification.type.pattern": "パターン通知",
    "notification.type.digest": "週次サマリー",
    // Not Found page
    "notFound.title": "404 - ページが見つかりません",
    "notFound.message": "お探しのページは存在しません。",
    // Auth pages - Login
    "auth.login.title": "ログイン",
    "auth.login.subtitle": "アカウントにサインインして続行",
    "auth.login.email": "メールアドレス",
    "auth.login.password": "パスワード",
    "auth.login.forgotPassword": "パスワードをお忘れですか？",
    "auth.login.button": "サインイン",
    "auth.login.signingIn": "サインイン中...",
    "auth.login.noAccount": "アカウントをお持ちでないですか？",
    "auth.login.signUp": "新規登録",
    "auth.login.welcome": "お帰りなさい",
    "auth.login.welcomeDesc": "インサイダー取引データでスマート投資を続けましょう",
    "auth.login.realtimeData": "リアルタイムデータ",
    "auth.login.realtimeDesc": "遅延なしの即時更新",
    "auth.login.verifiedInfo": "検証済み情報",
    "auth.login.verifiedDesc": "SEC公式文書に基づく",
    "auth.login.smartAlerts": "スマート通知",
    "auth.login.smartAlertsDesc": "カスタマイズされた取引通知",
    "auth.login.emailPlaceholder": "name@company.com",
    "auth.login.passwordPlaceholder": "パスワードを入力",
    "auth.login.errorRequired": "メールアドレスとパスワードを入力してください",
    "auth.login.errorFailed": "ログインに失敗しました",
    // Auth pages - Signup
    "auth.signup.title": "アカウント作成",
    "auth.signup.subtitle": "無料で始めましょう。カード登録不要。",
    "auth.signup.email": "メールアドレス",
    "auth.signup.password": "パスワード",
    "auth.signup.confirmPassword": "パスワード確認",
    "auth.signup.button": "アカウント作成",
    "auth.signup.creating": "アカウント作成中...",
    "auth.signup.haveAccount": "すでにアカウントをお持ちですか？",
    "auth.signup.signIn": "サインイン",
    "auth.signup.success": "登録完了",
    "auth.signup.successDesc": "メールを確認してアカウントを認証してください",
    "auth.signup.heroTitle": "インサイダーの投資をデータで追跡",
    "auth.signup.heroDesc": "SEC公式ファイリングに基づくリアルタイムインサイダー取引追跡",
    "auth.signup.errorAllFields": "すべてのフィールドを入力してください",
    "auth.signup.errorPasswordLength": "パスワードは8文字以上である必要があります",
    "auth.signup.errorPasswordMatch": "パスワードが一致しません",
    "auth.signup.errorInvalidEmail": "有効なメールアドレスを入力してください",
    "auth.signup.errorFailed": "登録に失敗しました",
    "auth.signup.redirecting": "ログインページへ移動中...",
    "auth.signup.redirectingToVerification": "メール認証ページへ移動中...",
    // Email verification
    "auth.verify.title": "メール認証",
    "auth.verify.verifying": "メール認証中...",
    "auth.verify.success": "認証完了！",
    "auth.verify.alreadyVerified": "すでに認証済み",
    "auth.verify.error": "認証失敗",
    "auth.verify.loading": "お待ちください...",
    "auth.verify.goToLogin": "ログインページへ",
    "auth.verify.backToLogin": "ログインページに戻る",
    "auth.verify.successDesc": "InsiderPulseのすべての機能をご利用いただけます",
    "auth.verify.errorDesc": "認証リンクが期限切れまたは無効です",
    "auth.verify.noToken": "認証トークンがありません",
    // Verify Code Page (6-digit code input)
    "auth.verifyCode.title": "メール認証",
    "auth.verifyCode.subtitle": "に送信された",
    "auth.verifyCode.enterCode": "6桁の認証コードを入力してください",
    "auth.verifyCode.errorEnterAll": "6桁のコードをすべて入力してください",
    "auth.verifyCode.errorFailed": "認証に失敗しました",
    "auth.verifyCode.codeValid": "コードは10分間有効です",
    "auth.verifyCode.verifying": "認証中...",
    "auth.verifyCode.verify": "認証する",
    "auth.verifyCode.resendCode": "コード再送信",
    "auth.verifyCode.resending": "送信中...",
    "auth.verifyCode.resendIn": "{seconds}秒後に再送信可能",
    "auth.verifyCode.backToSignup": "新規登録に戻る",
    "auth.verifyCode.successTitle": "認証完了！",
    "auth.verifyCode.successDesc": "メール認証が完了しました。\nログインページへ移動中...",
    "auth.verifyCode.errorResend": "コードの再送信に失敗しました",
    // Landing Page
    "landing.browse": "閲覧",
    "landing.tagline": "AI搭載SEC申告分析",
    "landing.title": "InsiderPulse: インサイダー取引をリアルタイムで追跡",
    "landing.description": "SEC Form 4申告からAI分析による即時アラートとインサイトを取得。企業内部者の動向に基づいて情報に基づいた投資判断を行います。",
    "landing.noCreditCard": "クレジットカード不要 • 無料48時間遅延データ • いつでもアップグレード",
    "landing.features.title": "インサイダー活動追跡に必要なすべて",
    "landing.features.subtitle": "真剣な投資家のための強力な機能",
    "landing.features.aiAnalysis": "AI搭載分析",
    "landing.features.aiAnalysisDesc": "高度なGPT分析により、すべての取引から買い/売りシグナルと重要度スコア（1-100）を抽出",
    "landing.features.realtime": "リアルタイム更新",
    "landing.features.realtimeDesc": "WebSocket搭載のライブ更新により、SECに提出された瞬間に新しいインサイダー取引を配信",
    "landing.features.filtering": "スマートフィルタリング",
    "landing.features.filteringDesc": "ティッカー、シグナルタイプ、重要度スコア、取引タイプでフィルタリングして重要な取引を見つける",
    "landing.features.alerts": "カスタムアラート",
    "landing.features.alertsDesc": "特定の企業や取引パターンに対するパーソナライズされた通知を設定",
    "landing.features.secData": "SEC直接データ",
    "landing.features.secDataDesc": "公式SEC EDGAR申告からの自動収集により精度とコンプライアンスを保証",
    "landing.features.historical": "過去分析",
    "landing.features.historicalDesc": "完全な取引履歴とパターン分析にアクセスしてインサイダー購入トレンドを特定",
    "landing.pricing.title": "シンプルで透明な価格設定",
    "landing.pricing.subtitle": "あなたに最適なプランを選択",
    "landing.pricing.mostPopular": "最も人気",
    "landing.pricing.monthly": "月額",
    "landing.pricing.yearly": "年額",
    "landing.pricing.monthlyPrice": "$14",
    "landing.pricing.yearlyPrice": "$112",
    "landing.pricing.monthlyPeriod": "/月",
    "landing.pricing.yearlyPeriod": "/年",
    "landing.pricing.monthlyTrial": "3日間無料トライアル",
    "landing.pricing.yearlyTrial": "7日間無料トライアル",
    "landing.pricing.yearlySaveOriginal": "$168",
    "landing.pricing.savePercent": "33%節約",
    "landing.pricing.monthlyFeature1": "リアルタイムインサイダー取引（遅延なし）",
    "landing.pricing.monthlyFeature2": "AI搭載分析と予測",
    "landing.pricing.monthlyFeature3": "高度なパターン検出",
    "landing.pricing.monthlyFeature4": "ライブプッシュ通知",
    "landing.pricing.monthlyFeature5": "役員取引追跡",
    "landing.pricing.yearlyFeature1": "月額プランのすべて",
    "landing.pricing.yearlyFeature2": "年間$56節約",
    "landing.pricing.yearlyFeature3": "延長7日間トライアル",
    "landing.pricing.yearlyFeature4": "本格的なトレーダーに最適",
    "landing.pricing.notReady": "まだ準備ができていませんか？無料で始めましょう。",
    "landing.pricing.browseDelayed": "48時間遅延で閲覧",
    "landing.pricing.cancelAnytime": "いつでもキャンセル可能",
    "landing.pricing.securePayment": "安全な決済",
    "landing.pricing.noHiddenFees": "隠れた料金なし",
    "landing.footer.product": "製品",
    "landing.footer.pricing": "料金",
    "landing.footer.browseTrades": "取引を閲覧",
    "landing.footer.company": "会社",
    "landing.footer.about": "概要",
    "landing.footer.blog": "ブログ",
    "landing.footer.contact": "お問い合わせ",
    "landing.footer.legal": "法的事項",
    "landing.footer.privacy": "プライバシー",
    "landing.footer.terms": "利用規約",
    "landing.footer.sitemap": "サイトマップ",
    "landing.footer.connect": "ソーシャル",
    "landing.footer.twitter": "Twitter",
    "landing.footer.linkedin": "LinkedIn",
    "landing.footer.github": "GitHub",
    "landing.footer.copyright": "© 2025 All rights reserved",
    // Trade List Date Filters
    "tradeList.filters": "フィルター",
    "tradeList.dateRange": "期間",
    "tradeList.dateRange.all": "全期間",
    "tradeList.dateRange.today": "今日",
    "tradeList.dateRange.week": "先週",
    "tradeList.dateRange.month": "先月",
    "tradeList.dateRange.threeMonths": "過去3ヶ月",
    "tradeList.dateRange.sixMonths": "過去6ヶ月",
    "tradeList.showingTrades": "{count}件の取引を表示中"
  },
  zh: {
    // Navigation
    "nav.dashboard": "仪表盘",
    "nav.livetrading": "实时交易",
    "nav.analytics": "分析",
    "nav.alerts": "提醒",
    "nav.search": "搜索",
    "nav.ranking": "热门股票",
    "nav.settings": "设置",
    // Dashboard
    "dashboard.title": "内幕交易追踪专业版",
    "dashboard.subtitle": "AI驱动的内幕交易监控器",
    "dashboard.lastUpdated": "最后更新",
    "dashboard.stats.todayTrades": "今日交易",
    "dashboard.stats.totalVolume": "总交易量",
    "dashboard.recentActivity": "最近活动",
    "dashboard.marketCoverage": "市场覆盖",
    "dashboard.topMoversToday": "今日热门股",
    // Trades
    "trades.loadingStats": "正在加载交易统计...",
    "trades.failedStats": "加载交易统计失败。请刷新页面。",
    "trades.recentTrades": "最近的内幕交易",
    "trades.loadingTrades": "正在加载交易...",
    "trades.viewDetails": "查看详情",
    "trades.loadMore": "加载更多交易",
    "trades.noTrades": "没有可用的交易",
    "trades.company": "公司",
    "trades.shares": "股份",
    "trades.price": "价格",
    "trades.total": "总价值",
    "trades.signal": "信号",
    "trades.significance": "重要性",
    "trades.filed": "提交日期",
    // Settings
    "settings.title": "设置",
    "settings.language": "语言",
    "settings.theme": "主题",
    "settings.notifications": "通知",
    "settings.language.english": "英语",
    "settings.language.korean": "韩语",
    "settings.language.japanese": "日语",
    "settings.language.chinese": "中文",
    "settings.theme.light": "浅色",
    "settings.theme.dark": "深色",
    "settings.theme.system": "系统",
    "settings.description": "管理您的应用程序偏好和设置。",
    "settings.themeDescription": "选择您喜欢的主题",
    "settings.notificationsFuture": "通知设置将在未来更新中提供。",
    // WebSocket Status
    "websocket.connected": "已连接到实时推送",
    "websocket.disconnected": "实时推送已断开",
    "websocket.connecting": "正在连接到实时推送...",
    // General
    "general.loading": "加载中...",
    "general.error": "错误",
    "general.success": "成功",
    "general.refresh": "刷新",
    "general.save": "保存",
    "general.cancel": "取消",
    "general.delete": "删除",
    // Free Zone & Access Control
    "freeZone.delayedData": "⏰ 48小时延迟数据",
    "freeZone.description": "您正在查看{hours}小时前的交易。升级到Insider Pro以获得实时访问。",
    "freeZone.realtimeLocked": "🔒 实时数据已锁定",
    "freeZone.unlockMessage": "免费试用24小时Insider访问！",
    "freeZone.unlockButton": "立即解锁 ($0)",
    // Locked Trade Card
    "lockedTrade.realtimeInsider": "检测到实时内幕交易",
    "lockedTrade.executive": "高管",
    "lockedTrade.insiders": "内幕人士",
    "lockedTrade.detected": "检测到",
    "lockedTrade.realtimeZone": "实时区域",
    "lockedTrade.lockedTrades": "笔锁定交易",
    "lockedTrade.unlockPrompt": "解锁{count}笔实时内幕交易，看看内幕人士现在在做什么！",
    "lockedTrade.startTrial": "开始5分钟免费试用",
    "lockedTrade.unlockDescription": "立即解锁下方所有交易并查看实时内幕活动",
    "lockedTrade.unlockBelow": "解锁下方",
    // Trial Timer
    "trial.activeNotice": "✨ 免费试用激活:",
    "trial.remaining": "剩余",
    "trial.expired": "已过期",
    "trial.upgradeButton": "🚀 升级到Pro",
    "trial.expiredNotice": "⏰ 您的免费试用已结束。",
    "trial.upgradePrompt": "升级到Insider Pro以继续访问实时数据。",
    "trial.subscribeNow": "立即订阅",
    // Trial Start Page
    "trial.heading": "InsiderPulse Pro 5分钟免费试用",
    "trial.description": "追踪实时内幕交易并获得AI分析",
    "trial.benefits.title": "Pro权益",
    "trial.benefits.realtime": "实时交易追踪",
    "trial.benefits.realtimeDesc": "零延迟获取最新内幕交易",
    "trial.benefits.ai": "AI分析与洞察",
    "trial.benefits.aiDesc": "模式识别和交易意义分析",
    "trial.benefits.alerts": "自定义提醒",
    "trial.benefits.alertsDesc": "为关注的股票和条件设置提醒",
    "trial.benefits.filter": "仅显示纯粹的买卖信号",
    "trial.benefits.filterDesc": "专注于实际资金流动 - 过滤掉股权授予、期权行权和奖励",
    "trial.terms.title": "免费试用条款",
    "trial.terms.instant": "立即使用Pro功能",
    "trial.terms.noBilling": "今日不收费",
    "trial.terms.noChargeUntilEnd": "试用结束前不收费",
    "trial.terms.cancel": "随时取消 — 取消后订阅立即终止",
    "trial.form.title": "输入付款信息",
    "trial.form.description": "5分钟免费试用后自动开始订阅",
    "trial.form.selectPlan": "选择订阅计划",
    "trial.form.monthly": "月度订阅",
    "trial.form.yearly": "年度订阅",
    "trial.form.perMonth": "每月计费",
    "trial.form.perYear": "每年计费",
    "trial.form.discount": "(33%折扣)",
    "trial.form.info1": "* 5分钟免费试用期间不会从卡中扣费。",
    "trial.form.info2": "* 试用期结束时自动转换为所选计划。",
    "trial.form.info3": "* 随时可以取消订阅，取消后Pro功能立即停用。",
    "trial.success.title": "试用开始！",
    "trial.success.message": "5分钟免费试用已激活。立即开始使用实时交易追踪！",
    "trial.success.redirecting": "正在自动跳转...",
    // Trial form additional translations
    "trial.yearly.perMonth": "/月",
    "trial.yearly.savings": "💰 每年节省$56",
    "trial.errors.stripeNotLoaded": "Stripe加载失败",
    "trial.errors.enterCard": "请输入卡信息",
    "trial.errors.cardNotFound": "找不到卡信息",
    "trial.errors.cardVerificationFailed": "卡验证失败",
    "trial.errors.paymentSaveFailed": "保存付款信息失败",
    "trial.errors.activationFailed": "试用激活失败",
    "trial.errors.unknown": "发生未知错误",
    "trial.form.cardInfo": "卡信息",
    "trial.form.securePayment": "安全付款 · Stripe保护",
    "trial.form.processing": "处理中...",
    "trial.form.startTrial": "开始免费试用",
    "trial.form.afterTrialMonthly": "5分钟后自动计费: 每月$14",
    "trial.form.afterTrialYearly": "5分钟后自动计费: 每年$112",
    // FOMO Alerts
    "fomo.trialExpiringSoon": "⚠️ 试用将在{hours}小时后过期！",
    "fomo.upgradeToKeepAccess": "立即升级以保持实时访问。",
    "fomo.upgradeNow": "立即升级",
    "fomo.missedGains": "😱 您错过了价值{value}的{count}笔内幕交易！",
    "fomo.dontMissNext": "不要错过下一笔大交易。",
    "fomo.subscribeNow": "立即订阅",
    "fomo.bigTradeAlert": "突发:",
    "fomo.bought": "刚刚买入",
    "fomo.of": "",
    "fomo.unlockToSee": "- 解锁查看详情！",
    "fomo.unlockNow": "立即解锁",
    // Page specific
    "page.dashboard.subtitle": "实时内幕交易监控和市场情报",
    "page.livetrading.title": "实时交易",
    "page.livetrading.subtitle": "带AI分析的实时内幕交易活动",
    "page.search.placeholder": "搜索公司、股票代码、交易员或职位...",
    "page.alerts.title": "智能提醒",
    "page.alerts.subtitle": "为内幕交易活动设置智能提醒",
    "page.analytics.title": "市场分析",
    "page.analytics.subtitle": "内幕交易模式的综合分析",
    // WebSocket and Connection
    "connection.liveFeedActive": "实时数据推送已激活 - 实时SEC文件监控",
    "connection.connectionLost": "连接已断开 - 正在尝试重新连接...",
    "connection.liveFeed": "实时推送",
    "connection.disconnected": "已断开",
    // Statistics and Data
    "stats.todayTrades": "今日交易",
    "stats.totalVolume": "总交易量",
    "stats.tradingSummary": "交易摘要",
    "stats.failedLoad": "加载交易统计失败。请刷新页面。",
    "stats.fromLastWeek": "与上周相比",
    // Filters and Search
    "filter.allTypes": "所有类型",
    "filter.buyOrders": "买入订单",
    "filter.sellOrders": "卖出订单",
    "filter.allSignals": "所有信号",
    "filter.buySignal": "买入信号",
    "filter.sellSignal": "卖出信号",
    "filter.holdSignal": "持有信号",
    "filter.buyOnly": "仅买入",
    "filter.sellOnly": "仅卖出",
    // Placeholders
    "placeholder.searchCompany": "搜索公司...",
    "placeholder.searchTrader": "搜索交易员...",
    "placeholder.noLimit": "无限制",
    "placeholder.preferredLanguage": "选择您的首选语言",
    // Alert types
    "alerts.type.volume": "交易量",
    "alerts.type.company": "公司名称",
    "alerts.type.trader": "交易员职位",
    // Search page
    "search.title": "搜索和筛选",
    "search.subtitle": "使用高级条件搜索和筛选内幕交易数据",
    "search.filters": "筛选器",
    "search.clear": "清除",
    "search.tradeType": "交易类型",
    "search.dateRange": "日期范围",
    "search.sortBy": "排序方式",
    "search.dateRange.all": "全部时间",
    "search.dateRange.7d": "过去7天",
    "search.dateRange.30d": "过去30天",
    "search.dateRange.90d": "过去90天",
    "search.sort.recent": "最新",
    "search.sort.value": "金额最高",
    "search.sort.company": "公司名称",
    "search.results": "结果",
    "search.buyTrades": "买入交易",
    "search.sellTrades": "卖出交易",
    "search.totalVolume": "总交易量",
    "search.companies": "公司",
    "search.traders": "交易员",
    "search.totalFound": "找到的总交易数",
    "search.combinedValue": "综合价值",
    "search.uniqueEntities": "独特实体",
    "search.uniqueInsiders": "独特内幕人士",
    "search.searchResults": "搜索结果",
    "search.noTrades": "未找到交易",
    "search.placeholder.minValue": "1000000",
    "search.value": "最小值",
    // Alerts page
    "alerts.title": "智能提醒",
    "alerts.subtitle": "为内幕交易活动设置智能提醒",
    "alerts.active": "活动提醒",
    "alerts.createNew": "创建新提醒",
    "alerts.alertName": "提醒名称",
    "alerts.alertType": "提醒类型",
    "alerts.condition": "条件",
    "alerts.value": "值",
    "alerts.paused": "暂停",
    "alerts.noAlerts": "尚未配置提醒",
    "alerts.createFirst": "在下方创建您的第一个提醒",
    "alerts.noMatches": "最近没有匹配",
    "alerts.setupMatches": "设置提醒以在此查看匹配",
    "alerts.condition.greaterThan": "大于",
    "alerts.condition.lessThan": "小于",
    "alerts.condition.equals": "等于",
    "alerts.condition.contains": "包含",
    "alerts.placeholder.name": "例如：大型苹果交易",
    "alerts.recentMatches": "最近匹配",
    // Live Trading page
    "liveTrading.filtersAndSearch": "筛选器和搜索",
    "liveTrading.tradeType": "交易类型",
    "liveTrading.aiSignal": "AI信号",
    "liveTrading.companyTicker": "公司/股票代码",
    "liveTrading.traderName": "交易员姓名",
    "liveTrading.minValue": "最小值 ($)",
    "liveTrading.maxValue": "最大值 ($)",
    "liveTrading.liveFeed": "实时交易推送",
    "liveTrading.tradesShown": "显示的交易",
    "liveTrading.noTrades": "未找到交易",
    "liveTrading.adjustFilters": "尝试调整您的筛选器",
    "liveTrading.insider": "内幕人士",
    "liveTrading.tradeDetails": "交易详情",
    "liveTrading.totalValue": "总价值",
    "liveTrading.score": "评分:",
    "liveTrading.loadMore": "加载更多交易",
    "liveTrading.activeNow": "当前活跃",
    "liveTrading.alertsSet": "提醒设置",
    "liveTrading.pageTitle": "所有交易显示与搜索",
    "liveTrading.pageTitleMobile": "交易搜索",
    "liveTrading.pageSubtitle": "搜索和过滤所有内幕交易数据",
    "liveTrading.totalTrades": "总计",
    "liveTrading.filtered": "已过滤",
    "liveTrading.realtimeStock": "实时股价",
    "liveTrading.loaded": "已加载",
    "liveTrading.loading": "加载中",
    "liveTrading.dataQuality": "数据质量",
    "liveTrading.issues": "个问题",
    "liveTrading.loadingTrades": "正在加载交易数据...",
    "liveTrading.alert": "提醒",
    "liveTrading.watchlist": "关注列表",
    "liveTrading.added": "已添加",
    "liveTrading.watch": "关注",
    "liveTrading.advancedAiAnalysis": "高级AI分析",
    "liveTrading.confidenceLevel": "置信度",
    "liveTrading.advancedAnalyzing": "高级AI分析中...",
    "liveTrading.realtimePriceInfo": "实时价格信息",
    "liveTrading.insiderTradePrice": "内幕人士交易价格",
    "liveTrading.expectedImpact": "预期影响",
    "liveTrading.similarTrades": "相似交易",
    "liveTrading.count": "笔",
    "liveTrading.pieces": "个",
    "liveTrading.analysisInProgress": "正在综合分析新闻、财务数据和内幕人士模式",
    "liveTrading.basicAnalysis": "基础分析",
    "liveTrading.loadingTradeData": "正在加载交易数据...",
    "liveTrading.fetchingLatestInsider": "正在获取最新内幕交易信息",
    "liveTrading.avgLoadingTime": "💡 平均加载时间: 3-5秒",
    "liveTrading.remaining": "个剩余",
    "liveTrading.myWatchlist": "我的关注列表",
    "liveTrading.addToWatchlist": "添加到关注列表",
    "liveTrading.emailAlerts": "邮件提醒",
    "liveTrading.smartAlerts": "智能提醒",
    "liveTrading.watchlistAdded": "已添加到关注列表",
    "liveTrading.realtimeAlertsAvailable": "也可以设置实时提醒",
    "liveTrading.getRealtimeAlerts": "接收实时交易提醒",
    "liveTrading.alertEmail": "提醒接收邮箱",
    "liveTrading.alertConditions": "提醒条件",
    "liveTrading.successfullyAdded": "成功添加!",
    "liveTrading.additionComplete": "添加完成!",
    "liveTrading.canViewSeparately": "的内幕交易信息可以单独查看",
    "liveTrading.viewWatchlist": "查看关注列表",
    "liveTrading.whenInsiderTrade": "内幕交易发生时",
    "liveTrading.whenPriceChange": "股价大幅波动时",
    "liveTrading.whenVolumeSpike": "交易量激增时",
    "liveTrading.largeTrades": "大额交易 ($10M+)",
    "liveTrading.whenRecommendedPrice": "达到推荐买入价格时",
    "liveTrading.dataQualityReport": "数据质量报告",
    "liveTrading.validTrades": "有效交易",
    "liveTrading.lastUpdated": "最后更新",
    "liveTrading.validatedData": "已验证数据",
    "liveTrading.shares": "股",
    "liveTrading.filingDateNotice.title": "关于SEC提交日期",
    "liveTrading.filingDateNotice.description": '显示的日期是SEC提交日期，而非实际交易日期。根据SEC规定，内部人员必须在交易后2个工作日内报告，但某些提交可能会延迟。"最后更新"时间戳显示我们的系统从SEC服务器收集此数据的时间。',
    // Trade Card
    "tradeCard.filed": "已提交",
    "tradeCard.shares": "股数",
    "tradeCard.avgPrice": "平均价格",
    "tradeCard.totalValue": "总价值",
    "tradeCard.ownership": "所有权",
    "tradeCard.details": "详情",
    // Trade List
    "tradeList.recentTrades": "最近内幕交易",
    "tradeList.searchCompanies": "搜索公司...",
    "tradeList.sort": "排序:",
    "tradeList.date": "日期",
    "tradeList.value": "价值",
    "tradeList.noTradesFound": "未找到符合您条件的交易。",
    "tradeList.loading": "加载中...",
    "tradeList.loadMore": "加载更多交易",
    "tradeList.noMatches": "未找到符合您条件的交易。",
    "tradeList.searchPlaceholder": "搜索公司...",
    // Dashboard Stats
    "dashboardStats.todayTrades": "今日交易",
    "dashboardStats.totalVolume": "总交易量",
    "dashboardStats.fromLastWeek": "与上周相比",
    "dashboardStats.recentActivity": "最近活动",
    "dashboardStats.monitoring": "监控所有主要交易所的内幕交易",
    "dashboardStats.marketCoverage": "市场覆盖",
    "dashboardStats.realTimeAnalysis": "实时SEC文件分析和交易分类",
    "dashboardStats.topMovers": "今日热门",
    "dashboardStats.topStocks": "最活跃股票",
    "dashboardStats.trades": "笔交易",
    "dashboardStats.shares": "股数",
    "dashboardStats.price": "股价",
    "dashboardStats.total": "总额",
    "dashboardStats.moreTrades": "笔额外交易",
    "dashboardStats.noData": "暂无交易数据",
    // Analytics page
    "analytics.subtitle": "全面的内幕交易市场分析和洞察",
    "analytics.totalTrades": "总交易数",
    "analytics.transactionsRecorded": "记录的内幕交易",
    "analytics.totalVolume": "总交易量",
    "analytics.combinedValue": "综合交易价值",
    "analytics.avgTradeSize": "平均交易规模",
    "analytics.averageValue": "平均交易价值",
    "analytics.companies": "公司",
    "analytics.uniqueTracked": "跟踪的独特公司",
    "analytics.tradeDistribution": "交易类型分布",
    "analytics.monthlyActivity": "月度交易活动",
    "analytics.topCompanies": "按交易量排名的顶级公司",
    "analytics.trades": "交易",
    "analytics.combinedTransactionValue": "综合交易价值",
    "analytics.averageTransactionValue": "平均交易价值",
    "analytics.uniqueCompaniesTracked": "跟踪的独特公司",
    "analytics.tradeTypeDistribution": "交易类型分布",
    "analytics.monthlyTradingActivity": "月度交易活动",
    "analytics.topCompaniesByVolume": "按交易量排名的顶级公司",
    "analytics.buys": "买入",
    "analytics.sells": "卖出",
    // Trade Detail page
    "tradeDetail.notFound": "未找到交易",
    "tradeDetail.notFoundMessage": "无法找到请求的交易。",
    "tradeDetail.backToDashboard": "返回仪表盘",
    "tradeDetail.back": "返回",
    "tradeDetail.title": "交易详情",
    "tradeDetail.companyInfo": "公司信息",
    "tradeDetail.company": "公司",
    "tradeDetail.tickerSymbol": "股票代码",
    "tradeDetail.tradeType": "交易类型",
    "tradeDetail.traderInfo": "交易员信息",
    "tradeDetail.name": "姓名",
    "tradeDetail.titlePosition": "职位/地位",
    "tradeDetail.ownership": "所有权",
    "tradeDetail.transactionDetails": "交易详情",
    "tradeDetail.sharesTraded": "交易股数",
    "tradeDetail.pricePerShare": "每股价格",
    "tradeDetail.totalValue": "总交易价值",
    "tradeDetail.filingDate": "提交日期",
    "tradeDetail.currentPrice": "当前股价",
    "tradeDetail.volume": "交易量",
    "tradeDetail.lastUpdated": "最后更新",
    "tradeDetail.priceChangeSinceTrade": "内部交易后价格变动",
    "tradeDetail.priceMovement": "价格变化",
    "tradeDetail.analysis": "详细分析",
    "tradeDetail.priceComparison": "价格比较",
    "tradeDetail.tradePrice": "交易价格：",
    "tradeDetail.currentPriceLabel": "当前价格：",
    "tradeDetail.perShareComparison": "每股比较",
    "tradeDetail.secFiling": "SEC文件 #",
    "tradeDetail.totalTransactionValue": "总交易价值",
    "tradeDetail.currentStockPrice": "当前股价",
    "tradeDetail.detailedAnalysis": "详细分析",
    "tradeDetail.actualTradePrice": "实际交易价格",
    "tradeDetail.insiderAvgPrice": "内幕人士平均交易价格",
    "tradeDetail.last30DaysAvg": "过去30天平均",
    "tradeDetail.sameTicker": "同股票代码平均",
    "tradeDetail.currentMarketPrice": "当前市场价格",
    "tradeDetail.realtimeEstimate": "实时估价",
    "tradeDetail.marketClosed": "休市（最近价格）",
    "tradeDetail.realtimePrice": "实时价格",
    "tradeDetail.lastClosePrice": "最后收盘价（休市中）",
    "tradeDetail.aiAnalysisResults": "AI分析结果",
    "tradeDetail.tradingPatternAnalysis": "交易模式分析",
    "tradeDetail.investmentStrategy": "投资策略",
    "tradeDetail.additionalInsights": "额外洞察",
    "tradeDetail.overallOpinion": "综合意见",
    "tradeDetail.buyRecommendation": "💹 买入推荐",
    "tradeDetail.sellRecommendation": "📉 卖出推荐",
    "tradeDetail.holdRecommendation": "⏸️ 持有/观望",
    "tradeDetail.insiderBuyingActivity": "内部人买入活动积极。建议考虑投资。",
    "tradeDetail.insiderSellingActivity": "检测到内部人卖出活动。建议谨慎行事。",
    "tradeDetail.mixedInsiderActivity": "内部人交易模式混合。需要进一步了解信息。",
    "tradeDetail.confidenceLevel": "置信度",
    "tradeDetail.clickToExpand": "▼ 点击展开",
    "tradeDetail.clickToCollapse": "▲ 点击收起",
    "tradeDetail.marketAnalysis": "市场分析",
    "tradeDetail.perShare": "每股",
    "tradeDetail.shareScreenshot": "分享截图",
    "tradeDetail.totalTransactionAmount": "总交易金额",
    "tradeDetail.sharesCount": "交易股数",
    "tradeDetail.shares": "股",
    "tradeDetail.tradeTime": "交易时点",
    "tradeDetail.current": "当前",
    "tradeDetail.averageTradePrice": "平均交易价",
    "tradeDetail.referencePrice": "参考价",
    "tradeDetail.basedOnSecFiling": "基于SEC文件",
    "tradeDetail.aiAnalysisGenerating": "正在生成AI分析...",
    "tradeDetail.aiComprehensiveAnalysis": "AI综合分析",
    "tradeDetail.targetPriceAnalysis": "目标价格分析",
    "tradeDetail.conservative": "保守",
    "tradeDetail.realistic": "现实",
    "tradeDetail.optimistic": "乐观",
    "tradeDetail.riskAssessment": "风险评估",
    "tradeDetail.riskLevel": "风险等级",
    "tradeDetail.investmentRecommendation": "投资建议",
    "tradeDetail.aiConfidence": "AI置信度",
    "tradeDetail.analysisTimeHorizon": "分析时间范围",
    "tradeDetail.marketSentiment": "市场情绪",
    "tradeDetail.sentiment.bullish": "看涨",
    "tradeDetail.sentiment.bearish": "看跌",
    "tradeDetail.sentiment.neutral": "中性",
    "tradeDetail.priceChangeSinceTradeShort": "对比内部价",
    "tradeDetail.keyCatalysts": "关键催化因素",
    "tradeDetail.latestNewsAnalysis": "最新新闻分析",
    "tradeDetail.positive": "利好",
    "tradeDetail.negative": "利空",
    "tradeDetail.neutral": "中性",
    "tradeDetail.majorNews": "重要新闻",
    "tradeDetail.relevance": "相关度",
    "tradeDetail.aiAnalysisInProgress": "AI分析进行中...",
    "tradeDetail.preparingAdvancedAnalysis": "正在准备高级AI分析结果",
    "tradeDetail.shareText": "{company} 内部人交易信息",
    // Price Comparison Chart
    "priceChart.title": "价格比较图表",
    "priceChart.tradePrice": "交易价格",
    "priceChart.currentPrice": "当前价格",
    "priceChart.today": "今天",
    "priceChart.insiderTrade": "内幕交易",
    "priceChart.movement": "交易后价格变动",
    "priceChart.increased": "价格上涨",
    "priceChart.decreased": "价格下跌",
    "priceChart.tradePriceLabel": "交易价格：",
    "priceChart.currentLabel": "当前：",
    // Ranking page
    "ranking.title": "热门买入推荐",
    "ranking.subtitle": "基于内幕交易模式的AI股票推荐",
    "ranking.topStocks": "推荐股票前10名",
    "ranking.recommendation": "推荐",
    "ranking.buyPotential": "买入潜力",
    "ranking.marketCap": "市值",
    "ranking.volume": "交易量",
    "ranking.priceChange": "价格变动",
    "ranking.lastPrice": "当前价格",
    "ranking.strongBuy": "强烈买入",
    "ranking.buy": "买入",
    "ranking.hold": "持有",
    "ranking.analysis": "分析",
    "ranking.insiderActivity": "内幕人士活动",
    "ranking.tradesLast30Days": "过去30天交易",
    "ranking.avgTradeValue": "平均交易价值",
    "ranking.netBuying": "净买入",
    "ranking.loading": "正在加载股票排名...",
    "ranking.noData": "没有排名数据",
    "ranking.refreshData": "刷新数据",
    "ranking.lockedTitle": "高级功能",
    "ranking.lockedDescription": "升级到Insider Pro，查看基于内幕交易模式的顶级股票推荐",
    "ranking.unlockButton": "解锁顶级排名",
    // PWA Install Prompt
    "pwa.prompt.title": "添加 InsiderPulse 到主屏幕",
    "pwa.prompt.subtitle": "无需安装！直接添加到主屏幕",
    "pwa.benefits.notifications.title": "实时通知",
    "pwa.benefits.notifications.description": "交易发生时立即推送通知",
    "pwa.benefits.fast.title": "快速访问",
    "pwa.benefits.fast.description": "从主屏幕快速访问",
    "pwa.benefits.access.title": "便捷访问",
    "pwa.benefits.access.description": "像原生应用一样运行",
    "pwa.button.install": "立即安装",
    "pwa.button.later": "稍后",
    "pwa.button.understood": "知道了",
    "pwa.ios.instruction": '点击分享按钮，然后选择"添加到主屏幕"',
    // Push Notifications
    "notification.permission.title": "启用通知",
    "notification.permission.description": "接收实时内幕交易提醒",
    "notification.permission.allow": "允许通知",
    "notification.permission.deny": "稍后",
    "notification.settings.title": "通知设置",
    "notification.settings.enabled": "推送通知已启用",
    "notification.settings.disabled": "推送通知已禁用",
    "notification.settings.enable": "启用",
    "notification.settings.disable": "禁用",
    "notification.type.trade": "大额交易提醒",
    "notification.type.pattern": "模式提醒",
    "notification.type.digest": "每周摘要",
    // Not Found page
    "notFound.title": "404 - 页面未找到",
    "notFound.message": "您要查找的页面不存在。",
    // Auth pages - Login
    "auth.login.title": "登录",
    "auth.login.subtitle": "登录您的账户以继续",
    "auth.login.email": "电子邮件",
    "auth.login.password": "密码",
    "auth.login.forgotPassword": "忘记密码？",
    "auth.login.button": "登录",
    "auth.login.signingIn": "登录中...",
    "auth.login.noAccount": "没有账户？",
    "auth.login.signUp": "注册",
    "auth.login.welcome": "欢迎回来",
    "auth.login.welcomeDesc": "继续使用内幕交易数据进行智能投资",
    "auth.login.realtimeData": "实时数据",
    "auth.login.realtimeDesc": "即时更新，无延迟",
    "auth.login.verifiedInfo": "验证信息",
    "auth.login.verifiedDesc": "基于SEC官方文件",
    "auth.login.smartAlerts": "智能提醒",
    "auth.login.smartAlertsDesc": "定制化交易提醒",
    "auth.login.emailPlaceholder": "name@company.com",
    "auth.login.passwordPlaceholder": "输入密码",
    "auth.login.errorRequired": "请输入电子邮件和密码",
    "auth.login.errorFailed": "登录失败",
    // Auth pages - Signup
    "auth.signup.title": "创建账户",
    "auth.signup.subtitle": "免费开始。无需信用卡。",
    "auth.signup.email": "电子邮件",
    "auth.signup.password": "密码",
    "auth.signup.confirmPassword": "确认密码",
    "auth.signup.button": "创建账户",
    "auth.signup.creating": "创建账户中...",
    "auth.signup.haveAccount": "已有账户？",
    "auth.signup.signIn": "登录",
    "auth.signup.success": "注册完成",
    "auth.signup.successDesc": "请查看您的电子邮件以验证您的账户",
    "auth.signup.heroTitle": "用数据追踪内幕投资",
    "auth.signup.heroDesc": "基于SEC官方文件的实时内幕交易追踪",
    "auth.signup.errorAllFields": "请填写所有字段",
    "auth.signup.errorPasswordLength": "密码必须至少8个字符",
    "auth.signup.errorPasswordMatch": "密码不匹配",
    "auth.signup.errorInvalidEmail": "请输入有效的电子邮件地址",
    "auth.signup.errorFailed": "注册失败",
    "auth.signup.redirecting": "正在跳转到登录页面...",
    "auth.signup.redirectingToVerification": "正在跳转到邮箱验证页面...",
    // Email verification
    "auth.verify.title": "电子邮件验证",
    "auth.verify.verifying": "验证电子邮件中...",
    "auth.verify.success": "验证完成！",
    "auth.verify.alreadyVerified": "已验证",
    "auth.verify.error": "验证失败",
    "auth.verify.loading": "请稍候...",
    "auth.verify.goToLogin": "前往登录页面",
    "auth.verify.backToLogin": "返回登录页面",
    "auth.verify.successDesc": "您现在可以使用所有InsiderPulse功能",
    "auth.verify.errorDesc": "验证链接已过期或无效",
    "auth.verify.noToken": "无验证令牌",
    // Verify Code Page (6-digit code input)
    "auth.verifyCode.title": "电子邮件验证",
    "auth.verifyCode.subtitle": "已发送至",
    "auth.verifyCode.enterCode": "请输入6位验证码",
    "auth.verifyCode.errorEnterAll": "请输入全部6位数字",
    "auth.verifyCode.errorFailed": "验证失败",
    "auth.verifyCode.codeValid": "验证码10分钟内有效",
    "auth.verifyCode.verifying": "验证中...",
    "auth.verifyCode.verify": "验证",
    "auth.verifyCode.resendCode": "重新发送验证码",
    "auth.verifyCode.resending": "发送中...",
    "auth.verifyCode.resendIn": "{seconds}秒后可重新发送",
    "auth.verifyCode.backToSignup": "返回注册",
    "auth.verifyCode.successTitle": "验证完成！",
    "auth.verifyCode.successDesc": "电子邮件验证已完成。\n正在跳转到登录页面...",
    "auth.verifyCode.errorResend": "重新发送验证码失败",
    // Landing Page
    "landing.browse": "浏览",
    "landing.tagline": "AI驱动的SEC申报分析",
    "landing.title": "InsiderPulse: 实时追踪内幕交易",
    "landing.description": "从SEC Form 4申报中获取AI驱动的即时警报和洞察。基于企业内部人士的行为做出明智的投资决策。",
    "landing.noCreditCard": "无需信用卡 • 免费48小时延迟数据 • 随时升级",
    "landing.features.title": "追踪内幕活动所需的一切",
    "landing.features.subtitle": "为认真的投资者设计的强大功能",
    "landing.features.aiAnalysis": "AI驱动分析",
    "landing.features.aiAnalysisDesc": "高级GPT分析从每笔交易中提取买/卖信号和重要性评分（1-100）",
    "landing.features.realtime": "实时更新",
    "landing.features.realtimeDesc": "WebSocket驱动的实时更新，在向SEC提交的瞬间提供新的内幕交易",
    "landing.features.filtering": "智能过滤",
    "landing.features.filteringDesc": "按股票代码、信号类型、重要性评分和交易类型过滤，找到重要的交易",
    "landing.features.alerts": "自定义警报",
    "landing.features.alertsDesc": "为特定公司或交易模式设置个性化通知",
    "landing.features.secData": "SEC直接数据",
    "landing.features.secDataDesc": "从官方SEC EDGAR申报自动收集，确保准确性和合规性",
    "landing.features.historical": "历史分析",
    "landing.features.historicalDesc": "访问完整的交易历史和模式分析，识别内幕购买趋势",
    "landing.pricing.title": "简单透明的定价",
    "landing.pricing.subtitle": "选择适合您的计划",
    "landing.pricing.mostPopular": "最受欢迎",
    "landing.pricing.monthly": "月付",
    "landing.pricing.yearly": "年付",
    "landing.pricing.monthlyPrice": "$14",
    "landing.pricing.yearlyPrice": "$112",
    "landing.pricing.monthlyPeriod": "/月",
    "landing.pricing.yearlyPeriod": "/年",
    "landing.pricing.monthlyTrial": "3天免费试用",
    "landing.pricing.yearlyTrial": "7天免费试用",
    "landing.pricing.yearlySaveOriginal": "$168",
    "landing.pricing.savePercent": "节省33%",
    "landing.pricing.monthlyFeature1": "实时内幕交易（无延迟）",
    "landing.pricing.monthlyFeature2": "AI驱动分析与预测",
    "landing.pricing.monthlyFeature3": "高级模式检测",
    "landing.pricing.monthlyFeature4": "实时推送通知",
    "landing.pricing.monthlyFeature5": "高管交易追踪",
    "landing.pricing.yearlyFeature1": "月付计划的所有功能",
    "landing.pricing.yearlyFeature2": "每年节省$56",
    "landing.pricing.yearlyFeature3": "延长7天试用",
    "landing.pricing.yearlyFeature4": "认真交易者的最佳价值",
    "landing.pricing.notReady": "还没准备好？免费开始。",
    "landing.pricing.browseDelayed": "以48小时延迟浏览",
    "landing.pricing.cancelAnytime": "随时取消",
    "landing.pricing.securePayment": "安全支付",
    "landing.pricing.noHiddenFees": "无隐藏费用",
    "landing.footer.product": "产品",
    "landing.footer.pricing": "定价",
    "landing.footer.browseTrades": "浏览交易",
    "landing.footer.company": "公司",
    "landing.footer.about": "关于",
    "landing.footer.blog": "博客",
    "landing.footer.contact": "联系",
    "landing.footer.legal": "法律",
    "landing.footer.privacy": "隐私",
    "landing.footer.terms": "条款",
    "landing.footer.sitemap": "网站地图",
    "landing.footer.connect": "社交",
    "landing.footer.twitter": "Twitter",
    "landing.footer.linkedin": "LinkedIn",
    "landing.footer.github": "GitHub",
    "landing.footer.copyright": "© 2025 All rights reserved",
    // Trade List Date Filters
    "tradeList.filters": "筛选",
    "tradeList.dateRange": "日期范围",
    "tradeList.dateRange.all": "全部时间",
    "tradeList.dateRange.today": "今天",
    "tradeList.dateRange.week": "上周",
    "tradeList.dateRange.month": "上月",
    "tradeList.dateRange.threeMonths": "最近3个月",
    "tradeList.dateRange.sixMonths": "最近6个月",
    "tradeList.showingTrades": "显示{count}笔交易"
  }
};
const LanguageContext = createContext(void 0);
const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    if (typeof window === "undefined") {
      return "en";
    }
    try {
      const savedLanguage = localStorage.getItem("language");
      if (savedLanguage && Object.keys(translations).includes(savedLanguage)) {
        console.log("🌍 Using saved language preference:", savedLanguage);
        localStorage.setItem("language-selected", "true");
        return savedLanguage;
      }
      const browserLang = navigator.language.toLowerCase();
      console.log("🌍 Detecting browser language:", browserLang);
      let detectedLang = "en";
      if (browserLang.startsWith("ko")) detectedLang = "ko";
      else if (browserLang.startsWith("ja")) detectedLang = "ja";
      else if (browserLang.startsWith("zh")) detectedLang = "zh";
      localStorage.setItem("language", detectedLang);
      localStorage.setItem("language-selected", "true");
      return detectedLang;
    } catch (error) {
      console.error("Language initialization error:", error);
      return "en";
    }
  });
  const handleSetLanguage = (lang) => {
    setLanguage(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("language", lang);
    }
  };
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
    }
  }, [language]);
  const t = (key, variables) => {
    const currentTranslations = translations[language];
    const fallbackTranslations = translations.en;
    let text = currentTranslations[key] || fallbackTranslations[key] || key;
    if (variables) {
      Object.entries(variables).forEach(([varKey, varValue]) => {
        text = text.replace(`{${varKey}}`, String(varValue));
      });
    }
    return text;
  };
  return /* @__PURE__ */ jsx(LanguageContext.Provider, { value: { language, setLanguage: handleSetLanguage, t }, children });
};
const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === void 0) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
const API_BASE_URL = "/api";
class ApiClient {
  constructor() {
    this.token = null;
    this.getTradingStats = async () => {
      return this.request("/stats");
    };
    this.getTrades = async () => {
      return this.getInsiderTrades();
    };
    this.getInsiderTrades = async (limit = 20, offset = 0, fromDate, toDate, sortBy) => {
      const response = await this.getInsiderTradesWithAccess(limit, offset, fromDate, toDate, sortBy);
      return response.trades;
    };
    this.getInsiderTradesWithAccess = async (limit = 20, offset = 0, fromDate, toDate, sortBy) => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString()
      });
      if (fromDate) {
        params.append("from", fromDate.toISOString().split("T")[0]);
      }
      if (toDate) {
        params.append("to", toDate.toISOString().split("T")[0]);
      }
      if (sortBy && (sortBy === "filedDate" || sortBy === "createdAt")) {
        params.append("sortBy", sortBy);
      }
      const url = `/trades?${params.toString()}`;
      console.log(`🌐 [API] Requesting: ${url}`);
      const result = await this.request(url, {
        headers: {
          "x-user-id": "demo-user"
          // TODO: Get from auth context
        }
      });
      console.log(`[API] Received ${result.trades.length} trades, access level:`, result.accessLevel);
      return result;
    };
    this.getInsiderTradeById = async (id) => {
      return this.request(`/trades/${id}`);
    };
    this.activateTrial = async () => {
      console.log("🎯 [API] Activating trial...");
      try {
        const headers = {
          "Content-Type": "application/json"
        };
        if (this.token) {
          headers["Authorization"] = `Bearer ${this.token}`;
        }
        const response = await fetch(`${API_BASE_URL}/trial/activate`, {
          method: "POST",
          headers
        });
        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Failed to activate trial:", error);
        return {
          success: false,
          message: "Network error. Please try again.",
          error: error instanceof Error ? error.message : "Unknown error"
        };
      }
    };
    this.createTrialSetupIntent = async () => {
      console.log("💳 [API] Creating SetupIntent for trial...");
      return this.request("/trial/setup-intent", {
        method: "POST"
      });
    };
    this.activateTrialWithCard = async (paymentMethodId, planType) => {
      console.log("🎯 [API] Activating trial with card...", { planType });
      return this.request("/trial/activate", {
        method: "POST",
        body: JSON.stringify({ paymentMethodId, planType })
      });
    };
    this.getTrialStatus = async () => {
      const timestamp = Date.now();
      return this.request(`/trial/status?t=${timestamp}`);
    };
    this.getHealth = async () => {
      return this.request("/health");
    };
    this.signup = async (email, password) => {
      return this.request("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
    };
    this.login = async (email, password) => {
      const response = await this.request("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      if (response.success && response.token) {
        this.setToken(response.token);
      }
      return response;
    };
    this.verifyToken = async () => {
      return this.request("/auth/verify");
    };
    this.requestPasswordReset = async (email) => {
      return this.request("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email })
      });
    };
    this.resetPassword = async (token, newPassword) => {
      return this.request("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, newPassword })
      });
    };
  }
  setToken(token) {
    if (token) {
      console.log("🔑 [API CLIENT] Token set:", token.substring(0, 20) + "...");
      this.token = token;
    } else {
      console.log("🔓 [API CLIENT] Token cleared");
      this.token = null;
    }
  }
  async request(endpoint, options) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      "Content-Type": "application/json"
    };
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
      console.log("🔑 [API CLIENT] Adding Authorization header to request:", endpoint);
    } else {
      console.log("⚠️ [API CLIENT] No token available for request:", endpoint);
    }
    if (options == null ? void 0 : options.headers) {
      const headerObj = options.headers;
      Object.entries(headerObj).forEach(([key, value]) => {
        if (key.toLowerCase() !== "authorization") {
          headers[key] = String(value);
        }
      });
    }
    try {
      const response = await fetch(url, {
        ...options,
        headers
      });
      const text = await response.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        console.error("Failed to parse response as JSON:", text);
        throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`);
      }
      if (!response.ok) {
        if (response.status === 401) {
          console.log("🔓 Token expired or invalid, clearing session");
          localStorage.removeItem("authToken");
          localStorage.removeItem("authUser");
          this.setToken(null);
          window.dispatchEvent(new Event("auth:logout"));
        }
        const errorMessage = data.message || data.error || response.statusText;
        console.error(`[API Error] ${response.status} ${endpoint}:`, errorMessage);
        throw new Error(errorMessage);
      }
      return data;
    } catch (error) {
      console.error(`API request to ${endpoint} failed:`, error);
      throw error;
    }
  }
}
const apiClient = new ApiClient();
const queryKeys = {
  stats: ["stats"],
  trades: {
    all: ["trades"],
    list: (params) => ["trades", "list", params],
    detail: (id) => ["trades", "detail", id]
  },
  tradesList: {
    all: ["trades", "list"],
    list: (params) => ["trades", "list", params],
    detail: (id) => ["trades", "detail", id]
  },
  trial: {
    status: ["trial", "status"]
  },
  health: ["health"]
};
const AuthContext = createContext(void 0);
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(typeof window === "undefined" ? false : true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState("login");
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem("authToken");
      const savedUser = localStorage.getItem("authUser");
      if (savedToken && savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          apiClient.setToken(savedToken);
          console.log("🔐 Verifying saved token...");
          const verifyResponse = await apiClient.verifyToken();
          if (verifyResponse.success && verifyResponse.user) {
            console.log("✅ Token is valid, restoring session");
            console.log("   📊 User tier:", verifyResponse.user.subscriptionTier);
            console.log("   📊 User status:", verifyResponse.user.subscriptionStatus);
            setUser(verifyResponse.user);
            setToken(savedToken);
            localStorage.setItem("authUser", JSON.stringify(verifyResponse.user));
          } else {
            console.log("❌ Token is invalid, clearing session");
            localStorage.removeItem("authToken");
            localStorage.removeItem("authUser");
            apiClient.setToken(null);
          }
        } catch (error) {
          console.error("❌ Failed to verify token:", error);
          console.error("   Error details:", error instanceof Error ? error.message : String(error));
          console.log("   🧹 Clearing invalid session data");
          localStorage.removeItem("authToken");
          localStorage.removeItem("authUser");
          apiClient.setToken(null);
        }
      } else {
        console.log("ℹ️ No saved session found in localStorage");
      }
      console.log("✅ Auth initialization complete. Authenticated:", !!savedToken && !!savedUser);
      setIsLoading(false);
    };
    initAuth();
  }, []);
  const login = (newUser, newToken) => {
    console.log("🔐 [AUTH CONTEXT] Login called with user:", {
      email: newUser.email,
      tier: newUser.subscriptionTier,
      status: newUser.subscriptionStatus,
      hasUsedTrial: newUser.hasUsedTrial
    });
    setUser(newUser);
    setToken(newToken);
    localStorage.setItem("authToken", newToken);
    localStorage.setItem("authUser", JSON.stringify(newUser));
    apiClient.setToken(newToken);
    console.log("✅ [AUTH CONTEXT] User logged in and state updated");
    console.log("   💾 Token saved to localStorage");
    console.log("   🔑 Token set in API client:", newToken.substring(0, 20) + "...");
  };
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    apiClient.setToken(null);
  };
  const refreshUser = async () => {
    const savedToken = localStorage.getItem("authToken");
    if (!savedToken) {
      console.log("⚠️ No token found, cannot refresh user");
      return false;
    }
    try {
      console.log("🔄 Manually refreshing user data from server...");
      apiClient.setToken(savedToken);
      const verifyResponse = await apiClient.verifyToken();
      if (verifyResponse.success && verifyResponse.user) {
        console.log("✅ User data refreshed successfully:", verifyResponse.user);
        console.log("   📊 Subscription tier:", verifyResponse.user.subscriptionTier);
        console.log("   📊 Subscription status:", verifyResponse.user.subscriptionStatus);
        setUser(verifyResponse.user);
        setToken(savedToken);
        localStorage.setItem("authUser", JSON.stringify(verifyResponse.user));
        return true;
      } else {
        console.log("❌ Failed to refresh user data");
        return false;
      }
    } catch (error) {
      console.error("❌ Error refreshing user data:", error);
      return false;
    }
  };
  useEffect(() => {
    const handleAuthLogout = () => {
      console.log("🔓 Received auth:logout event, logging out...");
      logout();
    };
    window.addEventListener("auth:logout", handleAuthLogout);
    return () => {
      window.removeEventListener("auth:logout", handleAuthLogout);
    };
  }, []);
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible" && user && token) {
        console.log("👁️ Tab became visible, refreshing user data...");
        await refreshUser();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user, token]);
  const openAuthModal = (mode) => {
    setAuthModalMode(mode);
    setShowAuthModal(true);
  };
  const closeAuthModal = () => {
    setShowAuthModal(false);
  };
  return /* @__PURE__ */ jsx(
    AuthContext.Provider,
    {
      value: {
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        showAuthModal,
        authModalMode,
        login,
        logout,
        refreshUser,
        openAuthModal,
        closeAuthModal
      },
      children: isLoading ? /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsx("div", { className: "animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" }) }) : children
    }
  );
}
function useAuth() {
  const context = useContext(AuthContext);
  if (context === void 0) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
function hasPremiumAccess(user) {
  if (!user) {
    return false;
  }
  const isPro = user.subscriptionTier === "insider" || user.subscriptionTier === "insider_pro";
  const now = /* @__PURE__ */ new Date();
  const hasValidStatus = user.subscriptionStatus === "active" || user.subscriptionStatus === "trialing" || user.subscriptionStatus === "canceled";
  const hasActiveAccess = hasValidStatus && (!user.subscriptionEndDate || new Date(user.subscriptionEndDate) > now);
  console.log("[SUBSCRIPTION UTILS] hasPremiumAccess check:", {
    email: user.email,
    tier: user.subscriptionTier,
    status: user.subscriptionStatus,
    endDate: user.subscriptionEndDate,
    isPro,
    hasValidStatus,
    hasActiveAccess,
    result: isPro && hasActiveAccess
  });
  return isPro && hasActiveAccess;
}
function formatTimeRemaining(endDate) {
  if (!endDate) {
    return "00시간:00분";
  }
  const now = /* @__PURE__ */ new Date();
  const end = new Date(endDate);
  const diffMs = end.getTime() - now.getTime();
  if (diffMs <= 0) {
    return "00시간:00분";
  }
  const totalMinutes = Math.floor(diffMs / (1e3 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, "0")}시간:${minutes.toString().padStart(2, "0")}분`;
}
function getSubscriptionDisplayName(tier) {
  if (!tier || tier === "free" || tier === "outsider") {
    return "Outsider";
  }
  if (tier === "insider" || tier === "insider_pro") {
    return "Insider";
  }
  return "Outsider";
}
function getStatusDisplayName(status) {
  switch (status) {
    case "active":
      return "활성";
    case "trialing":
      return "무료체험 중";
    case "canceled":
      return "취소됨 (기간 내 사용 가능)";
    case "inactive":
      return "비활성";
    default:
      return "비활성";
  }
}
const logoLight$6 = "/Gemini_Generated_Image_wdqi0fwdqi0fwdqi.png";
const logoDark$6 = "/insiderpulse_logo1.png";
const getMenuItems = (t) => [
  {
    title: "Live Trading",
    url: "/trades",
    icon: TrendingUp,
    key: "live-trades"
  },
  {
    title: "Top Stocks",
    url: "/ranking",
    icon: Star,
    key: "ranking"
  },
  {
    title: "Profile",
    url: "/profile",
    icon: User,
    key: "profile"
  }
];
function AppSidebar() {
  const [location2] = useLocation();
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const [, navigate2] = useLocation();
  const [watchlist, setWatchlist] = useState([]);
  useEffect(() => {
    const loadWatchlist = () => {
      try {
        const saved = localStorage.getItem("watchlist");
        if (saved) {
          setWatchlist(JSON.parse(saved));
        }
      } catch (error) {
        console.error("Failed to load watchlist:", error);
      }
    };
    loadWatchlist();
    const handleStorageChange = (e) => {
      if (e.key === "watchlist" && e.newValue) {
        try {
          setWatchlist(JSON.parse(e.newValue));
        } catch (error) {
          console.error("Failed to parse watchlist from storage event:", error);
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);
    const handleWatchlistUpdate = () => {
      loadWatchlist();
    };
    window.addEventListener("watchlistUpdate", handleWatchlistUpdate);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("watchlistUpdate", handleWatchlistUpdate);
    };
  }, []);
  const handleRemoveFromWatchlist = (ticker) => {
    const updated = watchlist.filter((item) => item.ticker !== ticker);
    setWatchlist(updated);
    localStorage.setItem("watchlist", JSON.stringify(updated));
    window.dispatchEvent(new Event("watchlistUpdate"));
  };
  const handleToggleAlert = (e, ticker, companyName) => {
    e.stopPropagation();
    try {
      const savedAlerts = localStorage.getItem("insiderAlerts");
      const alerts = savedAlerts ? JSON.parse(savedAlerts) : [];
      const existingAlertIndex = alerts.findIndex(
        (alert2) => alert2.ticker === ticker && alert2.type === "COMPANY"
      );
      if (existingAlertIndex >= 0) {
        alerts[existingAlertIndex].isActive = !alerts[existingAlertIndex].isActive;
        localStorage.setItem("insiderAlerts", JSON.stringify(alerts));
      } else {
        const newAlert = {
          id: Date.now().toString(),
          type: "COMPANY",
          condition: "equals",
          value: companyName,
          ticker,
          isActive: true,
          name: `${companyName} (${ticker}) 거래 알림`,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        alerts.push(newAlert);
        localStorage.setItem("insiderAlerts", JSON.stringify(alerts));
      }
      window.dispatchEvent(new Event("watchlistUpdate"));
    } catch (error) {
      console.error("Failed to toggle alert:", error);
    }
  };
  const isAlertActive = (ticker) => {
    try {
      const savedAlerts = localStorage.getItem("insiderAlerts");
      if (!savedAlerts) return false;
      const alerts = JSON.parse(savedAlerts);
      const alert2 = alerts.find((a) => a.ticker === ticker && a.type === "COMPANY");
      return (alert2 == null ? void 0 : alert2.isActive) || false;
    } catch (error) {
      return false;
    }
  };
  const handleLogout = () => {
    logout();
    navigate2("/login");
  };
  const menuItems = getMenuItems();
  return /* @__PURE__ */ jsxs(Sidebar, { "data-testid": "app-sidebar", children: [
    /* @__PURE__ */ jsx(SidebarHeader, { className: "p-0", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center -my-2", children: [
      /* @__PURE__ */ jsx(
        "img",
        {
          src: logoLight$6,
          alt: "InsiderPulse",
          className: "block dark:hidden h-[163px] md:h-[204px] w-auto object-contain",
          "data-testid": "app-logo-light"
        }
      ),
      /* @__PURE__ */ jsx(
        "img",
        {
          src: logoDark$6,
          alt: "InsiderPulse",
          className: "hidden dark:block h-[163px] md:h-[204px] w-auto object-contain",
          "data-testid": "app-logo-dark"
        }
      )
    ] }) }),
    /* @__PURE__ */ jsxs(SidebarContent, { children: [
      /* @__PURE__ */ jsxs(SidebarGroup, { children: [
        /* @__PURE__ */ jsx(SidebarGroupLabel, { children: "Navigation" }),
        /* @__PURE__ */ jsx(SidebarGroupContent, { children: /* @__PURE__ */ jsx(SidebarMenu, { children: menuItems.map((item) => /* @__PURE__ */ jsx(SidebarMenuItem, { children: /* @__PURE__ */ jsx(
          SidebarMenuButton,
          {
            asChild: true,
            "data-active": location2 === item.url,
            "data-testid": `sidebar-nav-${item.key}`,
            children: /* @__PURE__ */ jsxs(Link, { href: item.url, onClick: () => {
              console.log(`Navigation to ${item.title} clicked`);
            }, children: [
              /* @__PURE__ */ jsx(item.icon, { className: "h-4 w-4" }),
              /* @__PURE__ */ jsx("span", { children: item.title }),
              item.badge && /* @__PURE__ */ jsx(Badge, { className: "ml-auto h-5 w-auto text-xs", children: item.badge })
            ] })
          }
        ) }, item.key)) }) })
      ] }),
      /* @__PURE__ */ jsxs(SidebarGroup, { children: [
        /* @__PURE__ */ jsxs(SidebarGroupLabel, { children: [
          "Watchlist (",
          watchlist.length,
          ")"
        ] }),
        /* @__PURE__ */ jsx(SidebarGroupContent, { children: /* @__PURE__ */ jsx("div", { className: "space-y-1", children: watchlist.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground text-center py-4", children: [
          "No stocks in watchlist.",
          /* @__PURE__ */ jsx("br", {}),
          "Add stocks from Live Trading."
        ] }) : watchlist.map((item) => /* @__PURE__ */ jsxs(
          "div",
          {
            className: "group flex items-center justify-between p-2 rounded-md hover:bg-accent cursor-pointer",
            "data-testid": `watchlist-${item.ticker.toLowerCase()}`,
            children: [
              /* @__PURE__ */ jsxs(
                "div",
                {
                  className: "flex-1 flex flex-col min-w-0",
                  onClick: () => navigate2("/trades"),
                  children: [
                    /* @__PURE__ */ jsx("span", { className: "text-sm font-medium", children: item.ticker }),
                    /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground truncate", children: item.companyName })
                  ]
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
                /* @__PURE__ */ jsx(
                  Button,
                  {
                    variant: "ghost",
                    size: "sm",
                    className: `h-6 w-6 p-0 ${isAlertActive(item.ticker) ? "text-blue-500" : "opacity-0 group-hover:opacity-100"}`,
                    onClick: (e) => handleToggleAlert(e, item.ticker, item.companyName),
                    title: isAlertActive(item.ticker) ? "알림 활성화됨" : "알림 설정",
                    children: /* @__PURE__ */ jsx(Bell, { className: `h-3 w-3 ${isAlertActive(item.ticker) ? "fill-current" : ""}` })
                  }
                ),
                /* @__PURE__ */ jsx(
                  Button,
                  {
                    variant: "ghost",
                    size: "sm",
                    className: "opacity-0 group-hover:opacity-100 h-6 w-6 p-0",
                    onClick: (e) => {
                      e.stopPropagation();
                      handleRemoveFromWatchlist(item.ticker);
                    },
                    title: "제거",
                    children: /* @__PURE__ */ jsx(X, { className: "h-3 w-3" })
                  }
                )
              ] })
            ]
          },
          item.ticker
        )) }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(SidebarFooter, { className: "p-4 space-y-3", children: [
      user && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 p-2 rounded-lg bg-muted/50", children: [
        /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center", children: /* @__PURE__ */ jsx(User, { className: "h-4 w-4 text-primary" }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm font-medium truncate", children: user.email }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: user.subscriptionTier === "insider_pro" || user.subscriptionTier === "insider" ? "Insider" : "Outsider" })
        ] })
      ] }),
      user && !hasPremiumAccess(user) && /* @__PURE__ */ jsx(
        Button,
        {
          className: "w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-semibold",
          asChild: true,
          "data-testid": "button-upgrade-premium",
          children: /* @__PURE__ */ jsxs(Link, { href: "/premium-checkout", onClick: () => {
            console.log("[APP SIDEBAR] Upgrade button clicked. User:", {
              tier: user.subscriptionTier,
              status: user.subscriptionStatus,
              hasPremium: hasPremiumAccess(user)
            });
          }, children: [
            /* @__PURE__ */ jsx(Crown, { className: "h-4 w-4 mr-2" }),
            "Upgrade to Insider"
          ] })
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs text-muted-foreground", children: [
        /* @__PURE__ */ jsx("div", { className: "w-2 h-2 bg-chart-2 rounded-full animate-pulse" }),
        /* @__PURE__ */ jsx("span", { children: "Live data feed active" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "ghost",
            size: "sm",
            className: "justify-start text-xs flex-1",
            asChild: true,
            "data-testid": "button-settings",
            children: /* @__PURE__ */ jsxs(Link, { href: "/settings", onClick: () => console.log("Settings clicked"), children: [
              /* @__PURE__ */ jsx(Settings$1, { className: "h-3 w-3 mr-2" }),
              t("nav.settings")
            ] })
          }
        ),
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "ghost",
            size: "sm",
            className: "justify-start text-xs",
            onClick: handleLogout,
            "data-testid": "button-logout",
            children: /* @__PURE__ */ jsx(LogOut, { className: "h-3 w-3" })
          }
        )
      ] })
    ] })
  ] });
}
function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldBeDark = savedTheme === "dark" || !savedTheme && systemPrefersDark;
    setIsDark(shouldBeDark);
    updateTheme(shouldBeDark);
  }, []);
  const updateTheme = (dark) => {
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };
  const toggleTheme = () => {
    const newTheme = !isDark;
    console.log("Theme toggled to:", newTheme ? "dark" : "light");
    setIsDark(newTheme);
    updateTheme(newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };
  return /* @__PURE__ */ jsxs(
    Button,
    {
      variant: "ghost",
      size: "icon",
      onClick: toggleTheme,
      className: "h-9 w-9",
      "data-testid": "button-theme-toggle",
      children: [
        isDark ? /* @__PURE__ */ jsx(Sun, { className: "h-4 w-4" }) : /* @__PURE__ */ jsx(Moon, { className: "h-4 w-4" }),
        /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Toggle theme" })
      ]
    }
  );
}
const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuSubTrigger = React.forwardRef(({ className, inset, children, ...props }, ref) => /* @__PURE__ */ jsxs(
  DropdownMenuPrimitive.SubTrigger,
  {
    ref,
    className: cn(
      "flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      inset && "pl-8",
      className
    ),
    ...props,
    children: [
      children,
      /* @__PURE__ */ jsx(ChevronRight, { className: "ml-auto" })
    ]
  }
));
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;
const DropdownMenuSubContent = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  DropdownMenuPrimitive.SubContent,
  {
    ref,
    className: cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-dropdown-menu-content-transform-origin]",
      className
    ),
    ...props
  }
));
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;
const DropdownMenuContent = React.forwardRef(({ className, sideOffset = 4, ...props }, ref) => /* @__PURE__ */ jsx(DropdownMenuPrimitive.Portal, { children: /* @__PURE__ */ jsx(
  DropdownMenuPrimitive.Content,
  {
    ref,
    sideOffset,
    className: cn(
      "z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-dropdown-menu-content-transform-origin]",
      className
    ),
    ...props
  }
) }));
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;
const DropdownMenuItem = React.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ jsx(
  DropdownMenuPrimitive.Item,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      inset && "pl-8",
      className
    ),
    ...props
  }
));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;
const DropdownMenuCheckboxItem = React.forwardRef(({ className, children, checked, ...props }, ref) => /* @__PURE__ */ jsxs(
  DropdownMenuPrimitive.CheckboxItem,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    checked,
    ...props,
    children: [
      /* @__PURE__ */ jsx("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ jsx(DropdownMenuPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx(Check, { className: "h-4 w-4" }) }) }),
      children
    ]
  }
));
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;
const DropdownMenuRadioItem = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs(
  DropdownMenuPrimitive.RadioItem,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    ...props,
    children: [
      /* @__PURE__ */ jsx("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ jsx(DropdownMenuPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx(Circle, { className: "h-2 w-2 fill-current" }) }) }),
      children
    ]
  }
));
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;
const DropdownMenuLabel = React.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ jsx(
  DropdownMenuPrimitive.Label,
  {
    ref,
    className: cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className
    ),
    ...props
  }
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;
const DropdownMenuSeparator = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  DropdownMenuPrimitive.Separator,
  {
    ref,
    className: cn("-mx-1 my-1 h-px bg-muted", className),
    ...props
  }
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;
const languageOptions = [
  { value: "en", label: "English", flag: "🇺🇸" },
  { value: "ko", label: "한국어", flag: "🇰🇷" },
  { value: "ja", label: "日本語", flag: "🇯🇵" },
  { value: "zh", label: "中文", flag: "🇨🇳" }
];
function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const currentLanguage = languageOptions.find((opt) => opt.value === language);
  const handleLanguageChange = (newLanguage) => {
    console.log("Language changed to:", newLanguage);
    setLanguage(newLanguage);
  };
  return /* @__PURE__ */ jsxs(DropdownMenu, { children: [
    /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(
      Button,
      {
        variant: "ghost",
        size: "icon",
        className: "h-9 w-9",
        "data-testid": "button-language-selector",
        children: [
          /* @__PURE__ */ jsx("span", { className: "text-lg", role: "img", "aria-label": currentLanguage == null ? void 0 : currentLanguage.label, children: (currentLanguage == null ? void 0 : currentLanguage.flag) || "🌐" }),
          /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Select language" })
        ]
      }
    ) }),
    /* @__PURE__ */ jsx(DropdownMenuContent, { align: "end", className: "w-40", children: languageOptions.map((option) => /* @__PURE__ */ jsxs(
      DropdownMenuItem,
      {
        onClick: () => handleLanguageChange(option.value),
        className: `flex items-center gap-3 cursor-pointer ${language === option.value ? "bg-accent" : ""}`,
        "data-testid": `language-option-${option.value}`,
        children: [
          /* @__PURE__ */ jsx("span", { className: "text-lg", role: "img", "aria-label": option.label, children: option.flag }),
          /* @__PURE__ */ jsx("span", { className: "font-medium", children: option.label })
        ]
      },
      option.value
    )) })
  ] });
}
function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const { t, language } = useLanguage();
  const [location2] = useLocation();
  useEffect(() => {
    if (location2 !== "/trades") {
      return;
    }
    const cardRegistered = localStorage.getItem("card-registered") === "true";
    if (!cardRegistered) {
      return;
    }
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    const isInstalled = localStorage.getItem("pwa-installed") === "true";
    const isDismissed = localStorage.getItem("pwa-prompt-dismissed") === "true";
    if (isStandalone) {
      localStorage.setItem("pwa-installed", "true");
      return;
    }
    if (isInstalled || isDismissed) {
      return;
    }
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => {
        setShowPrompt(true);
      }, 3e3);
    };
    window.addEventListener("beforeinstallprompt", handler);
    const isIOS2 = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if ((isIOS2 || isSafari) && !isStandalone && !isDismissed) {
      setTimeout(() => {
        setShowPrompt(true);
      }, 3e3);
    }
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, [location2]);
  const handleInstall = async () => {
    if (!deferredPrompt) {
      setShowPrompt(false);
      return;
    }
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        console.log("User accepted the install prompt");
        localStorage.setItem("pwa-installed", "true");
      }
      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error("Error installing PWA:", error);
    }
  };
  const handleDismiss = () => {
    setShowPrompt(false);
  };
  if (!showPrompt) return null;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const benefits = [
    {
      icon: /* @__PURE__ */ jsx(Bell, { className: "h-5 w-5" }),
      title: t("pwa.benefits.notifications.title"),
      description: t("pwa.benefits.notifications.description")
    },
    {
      icon: /* @__PURE__ */ jsx(Zap, { className: "h-5 w-5" }),
      title: t("pwa.benefits.fast.title"),
      description: t("pwa.benefits.fast.description")
    },
    {
      icon: /* @__PURE__ */ jsx(Smartphone, { className: "h-5 w-5" }),
      title: t("pwa.benefits.access.title"),
      description: t("pwa.benefits.access.description")
    }
  ];
  return /* @__PURE__ */ jsxs(Fragment$1, { children: [
    /* @__PURE__ */ jsx(
      "div",
      {
        className: "fixed inset-0 z-50 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200",
        onClick: handleDismiss
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "fixed inset-x-0 bottom-0 z-50 animate-in slide-in-from-bottom duration-300", children: /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-md px-4 pb-safe", children: /* @__PURE__ */ jsxs("div", { className: "relative overflow-hidden rounded-2xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: handleDismiss,
          className: "absolute right-3 top-3 z-10 rounded-full p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all",
          "aria-label": "Close",
          children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "p-5", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-5 text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "mb-3 flex justify-center", children: /* @__PURE__ */ jsx(
            "img",
            {
              src: "/insiderpulse_logo2.png",
              alt: "InsiderPulse",
              className: "h-16 w-16 rounded-xl object-contain"
            }
          ) }),
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-gray-900 dark:text-white mb-2", children: t("pwa.prompt.title") }),
          /* @__PURE__ */ jsx("div", { className: "inline-block px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg", children: /* @__PURE__ */ jsx("p", { className: "text-base font-bold text-white", children: t("pwa.prompt.subtitle") }) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mb-4 space-y-2", children: benefits.map((benefit, index) => /* @__PURE__ */ jsxs(
          "div",
          {
            className: "flex items-center gap-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 p-2.5",
            children: [
              /* @__PURE__ */ jsx("div", { className: "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 dark:bg-blue-500/20", children: /* @__PURE__ */ jsx("div", { className: "text-blue-600 dark:text-blue-400", children: benefit.icon }) }),
              /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsx("h4", { className: "text-sm font-medium text-gray-900 dark:text-white", children: benefit.title }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-600 dark:text-gray-400 truncate", children: benefit.description })
              ] })
            ]
          },
          index
        )) }),
        isIOS && /* @__PURE__ */ jsxs("div", { className: "mb-4 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 p-4 border-2 border-blue-400 shadow-xl", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-2", children: [
            /* @__PURE__ */ jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm", children: /* @__PURE__ */ jsx(Share2, { className: "h-6 w-6 text-white" }) }),
            /* @__PURE__ */ jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm", children: /* @__PURE__ */ jsx(Plus, { className: "h-6 w-6 text-white" }) })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-white leading-snug", children: t("pwa.ios.instruction") })
        ] }),
        !isIOS && /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleInstall,
            className: "w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-base font-bold text-white shadow-xl shadow-blue-500/40 transition-all hover:shadow-2xl hover:shadow-blue-500/50 hover:scale-[1.02]",
            children: t("pwa.button.install")
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "absolute -right-16 -top-16 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl" }),
      /* @__PURE__ */ jsx("div", { className: "absolute -bottom-16 -left-16 h-32 w-32 rounded-full bg-indigo-500/10 blur-3xl" })
    ] }) }) })
  ] });
}
const AccessContext = createContext(void 0);
function AccessProvider({ children }) {
  const [accessLevel, setAccessLevel] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, token, user, refreshUser } = useAuth();
  const refreshAccessLevel = async () => {
    console.log("🔄 [ACCESS CONTEXT] Refreshing access level...");
    console.log("   isAuthenticated:", isAuthenticated);
    console.log("   user:", user ? {
      email: user.email,
      tier: user.subscriptionTier,
      status: user.subscriptionStatus
    } : "null");
    if (!isAuthenticated || !token) {
      console.log("🔒 [ACCESS CONTEXT] User not authenticated, setting free access");
      setAccessLevel({
        hasRealtimeAccess: false,
        isDelayed: true,
        delayHours: 48
      });
      return;
    }
    try {
      const trialStatus = await apiClient.getTrialStatus();
      console.log("✅ [ACCESS CONTEXT] Trial status received:", {
        canAccessRealtime: trialStatus.canAccessRealtime,
        tier: trialStatus.tier,
        status: trialStatus.status,
        isTrialing: trialStatus.isTrialing,
        hasUsedTrial: trialStatus.hasUsedTrial,
        trialExpiresAt: trialStatus.trialExpiresAt
      });
      setAccessLevel({
        hasRealtimeAccess: trialStatus.canAccessRealtime,
        isDelayed: !trialStatus.canAccessRealtime,
        delayHours: trialStatus.canAccessRealtime ? 0 : 48,
        isTrialing: trialStatus.isTrialing,
        trialExpiresAt: trialStatus.trialExpiresAt,
        hasUsedTrial: trialStatus.hasUsedTrial,
        tier: trialStatus.tier,
        status: trialStatus.status
      });
      console.log("✅ [ACCESS CONTEXT] Access level updated:", {
        hasRealtimeAccess: trialStatus.canAccessRealtime,
        isTrialing: trialStatus.isTrialing,
        hasUsedTrial: trialStatus.hasUsedTrial
      });
      const userDataIsStale = user && (user.subscriptionTier !== trialStatus.tier || user.subscriptionStatus !== trialStatus.status);
      if (userDataIsStale && refreshUser) {
        console.log("⚠️ [ACCESS CONTEXT] User data appears stale, refreshing from server...");
        console.log("   Current user:", { tier: user.subscriptionTier, status: user.subscriptionStatus });
        console.log("   API says:", { tier: trialStatus.tier, status: trialStatus.status });
        await refreshUser();
      }
    } catch (error) {
      console.error("❌ [ACCESS CONTEXT] Failed to fetch access level:", error);
      console.error("   Error details:", error instanceof Error ? error.message : String(error));
      let hasPremiumFromUser = false;
      if (user && user.subscriptionTier === "insider_pro") {
        if (user.subscriptionStatus === "active" || user.subscriptionStatus === "trialing") {
          hasPremiumFromUser = true;
        } else if (user.subscriptionStatus === "canceled" && user.subscriptionEndDate) {
          const endDate = new Date(user.subscriptionEndDate);
          const now = /* @__PURE__ */ new Date();
          hasPremiumFromUser = endDate > now;
        }
      }
      console.log("⚠️ [ACCESS CONTEXT] API error - using fallback logic");
      console.log("   User data:", {
        tier: user == null ? void 0 : user.subscriptionTier,
        status: user == null ? void 0 : user.subscriptionStatus,
        endDate: user == null ? void 0 : user.subscriptionEndDate,
        hasPremium: hasPremiumFromUser
      });
      if (hasPremiumFromUser) {
        console.log("✅ [ACCESS CONTEXT] Fallback: User has valid premium subscription");
        setAccessLevel({
          hasRealtimeAccess: true,
          isDelayed: false,
          delayHours: 0,
          tier: user.subscriptionTier,
          status: user.subscriptionStatus
        });
      } else {
        console.log("🔒 [ACCESS CONTEXT] Fallback: Defaulting to free access");
        setAccessLevel({
          hasRealtimeAccess: false,
          isDelayed: true,
          delayHours: 48
        });
      }
    }
  };
  useEffect(() => {
    console.log("🔄 [ACCESS CONTEXT] useEffect triggered - isAuthenticated:", isAuthenticated, ", token:", !!token);
    const loadAccessLevel = async () => {
      setIsLoading(true);
      await refreshAccessLevel();
      setIsLoading(false);
    };
    loadAccessLevel();
  }, [isAuthenticated, token, user == null ? void 0 : user.subscriptionTier, user == null ? void 0 : user.subscriptionStatus]);
  return /* @__PURE__ */ jsx(AccessContext.Provider, { value: { accessLevel, setAccessLevel, isLoading, refreshAccessLevel }, children });
}
function useAccess() {
  const context = useContext(AccessContext);
  if (context === void 0) {
    throw new Error("useAccess must be used within an AccessProvider");
  }
  return context;
}
const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);
const Label = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  LabelPrimitive.Root,
  {
    ref,
    className: cn(labelVariants(), className),
    ...props
  }
));
Label.displayName = LabelPrimitive.Root.displayName;
const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
const Alert = React.forwardRef(({ className, variant, ...props }, ref) => /* @__PURE__ */ jsx(
  "div",
  {
    ref,
    role: "alert",
    className: cn(alertVariants({ variant }), className),
    ...props
  }
));
Alert.displayName = "Alert";
const AlertTitle = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  "h5",
  {
    ref,
    className: cn("mb-1 font-medium leading-none tracking-tight", className),
    ...props
  }
));
AlertTitle.displayName = "AlertTitle";
const AlertDescription = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  "div",
  {
    ref,
    className: cn("text-sm [&_p]:leading-relaxed", className),
    ...props
  }
));
AlertDescription.displayName = "AlertDescription";
function AuthModal() {
  const [, navigate2] = useLocation();
  const { showAuthModal, authModalMode, login, closeAuthModal } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState(authModalMode);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const inputRefs = useRef([]);
  useEffect(() => {
    setMode(authModalMode);
  }, [authModalMode]);
  useEffect(() => {
    if (!showAuthModal) {
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setError("");
      setCode(["", "", "", "", "", ""]);
      setVerificationSuccess(false);
    }
  }, [showAuthModal]);
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1e3);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError(t("auth.login.errorRequired"));
      return;
    }
    setIsLoading(true);
    try {
      const response = await apiClient.login(email, password);
      if (response.success && response.user && response.token) {
        login(response.user, response.token);
        closeAuthModal();
      } else {
        setError(response.message || t("auth.login.errorFailed"));
      }
    } catch (err) {
      setError(err.message || t("auth.login.errorFailed"));
    } finally {
      setIsLoading(false);
    }
  };
  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password || !confirmPassword) {
      setError(t("auth.signup.errorAllFields"));
      return;
    }
    if (password.length < 8) {
      setError(t("auth.signup.errorPasswordLength"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("auth.signup.errorPasswordMatch"));
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(t("auth.signup.errorInvalidEmail"));
      return;
    }
    setIsLoading(true);
    try {
      const response = await apiClient.signup(email, password);
      if (response.success) {
        setMode("verify");
        setCode(["", "", "", "", "", ""]);
        setTimeout(() => {
          var _a;
          (_a = inputRefs.current[0]) == null ? void 0 : _a.focus();
        }, 100);
      } else {
        setError(response.message || t("auth.signup.errorFailed"));
      }
    } catch (err) {
      setError(err.message || t("auth.signup.errorFailed"));
    } finally {
      setIsLoading(false);
    }
  };
  const handleCodeChange = (index, value) => {
    var _a;
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    if (value && index < 5) {
      (_a = inputRefs.current[index + 1]) == null ? void 0 : _a.focus();
    }
  };
  const handleCodeKeyDown = (index, e) => {
    var _a;
    if (e.key === "Backspace" && !code[index] && index > 0) {
      (_a = inputRefs.current[index - 1]) == null ? void 0 : _a.focus();
    }
  };
  const handleCodePaste = (e) => {
    var _a;
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newCode = [...code];
    pastedData.split("").forEach((digit, index) => {
      if (index < 6) {
        newCode[index] = digit;
      }
    });
    setCode(newCode);
    const nextEmptyIndex = newCode.findIndex((c) => !c);
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
    (_a = inputRefs.current[focusIndex]) == null ? void 0 : _a.focus();
  };
  const handleVerifyCode = async (e) => {
    e == null ? void 0 : e.preventDefault();
    setError("");
    const codeString = code.join("");
    if (codeString.length !== 6) {
      setError(t("auth.verifyCode.errorEnterAll"));
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: codeString })
      });
      const data = await response.json();
      if (data.success) {
        setVerificationSuccess(true);
        setTimeout(async () => {
          try {
            const loginResponse = await apiClient.login(email, password);
            if (loginResponse.success && loginResponse.user && loginResponse.token) {
              login(loginResponse.user, loginResponse.token);
              closeAuthModal();
            }
          } catch (err) {
            console.error("Auto-login failed:", err);
            closeAuthModal();
          }
        }, 1500);
      } else {
        setError(data.message || t("auth.verifyCode.errorFailed"));
      }
    } catch (err) {
      setError(err.message || t("auth.verifyCode.errorFailed"));
    } finally {
      setIsLoading(false);
    }
  };
  const handleResendCode = async () => {
    var _a;
    if (resendCooldown > 0) return;
    setIsResending(true);
    setError("");
    try {
      const response = await fetch("/api/auth/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (data.success) {
        setResendCooldown(60);
        setCode(["", "", "", "", "", ""]);
        (_a = inputRefs.current[0]) == null ? void 0 : _a.focus();
      } else {
        setError(data.message || t("auth.verifyCode.errorResend"));
      }
    } catch (err) {
      setError(err.message || t("auth.verifyCode.errorResend"));
    } finally {
      setIsResending(false);
    }
  };
  useEffect(() => {
    if (mode === "verify" && code.every((digit) => digit !== "") && !isLoading) {
      handleVerifyCode();
    }
  }, [code, mode, isLoading]);
  if (!showAuthModal) return null;
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4", children: /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-md p-6 relative", children: [
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: closeAuthModal,
        className: "absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200",
        children: /* @__PURE__ */ jsx(X, { className: "h-5 w-5" })
      }
    ),
    verificationSuccess ? /* @__PURE__ */ jsxs("div", { className: "space-y-6 py-12 text-center", children: [
      /* @__PURE__ */ jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center", children: /* @__PURE__ */ jsx(CheckCircle, { className: "h-8 w-8 text-white" }) }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-slate-900 dark:text-white mb-2", children: t("auth.verifyCode.successTitle") }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-600 dark:text-slate-400", children: t("auth.verifyCode.successDesc") })
      ] })
    ] }) : mode === "verify" ? (
      /* Verification Code View */
      /* @__PURE__ */ jsxs(Fragment$1, { children: [
        /* @__PURE__ */ jsxs("div", { className: "text-center mb-8", children: [
          /* @__PURE__ */ jsx("div", { className: "inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 mb-4", children: /* @__PURE__ */ jsx(Mail, { className: "h-8 w-8 text-white" }) }),
          /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold mb-2", children: t("auth.verifyCode.title") }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
            /* @__PURE__ */ jsx("strong", { children: email }),
            t("auth.verifyCode.subtitle"),
            /* @__PURE__ */ jsx("br", {}),
            t("auth.verifyCode.enterCode")
          ] })
        ] }),
        error && /* @__PURE__ */ jsxs(Alert, { variant: "destructive", className: "mb-4", children: [
          /* @__PURE__ */ jsx(AlertCircle, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsx(AlertDescription, { children: error })
        ] }),
        /* @__PURE__ */ jsxs("form", { onSubmit: handleVerifyCode, className: "space-y-6", children: [
          /* @__PURE__ */ jsx("div", { className: "flex justify-center gap-2", children: code.map((digit, index) => /* @__PURE__ */ jsx(
            "input",
            {
              ref: (el) => inputRefs.current[index] = el,
              type: "text",
              inputMode: "numeric",
              pattern: "\\d*",
              maxLength: 1,
              value: digit,
              onChange: (e) => handleCodeChange(index, e.target.value),
              onKeyDown: (e) => handleCodeKeyDown(index, e),
              onPaste: handleCodePaste,
              disabled: isLoading,
              className: "w-12 h-14 text-center text-2xl font-bold border-2 border-slate-300 dark:border-slate-600 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-slate-800 text-slate-900 dark:text-white",
              autoFocus: index === 0
            },
            index
          )) }),
          /* @__PURE__ */ jsx("p", { className: "text-center text-sm text-slate-500", children: t("auth.verifyCode.codeValid") }),
          /* @__PURE__ */ jsx(
            Button,
            {
              type: "submit",
              className: "w-full",
              disabled: isLoading || code.join("").length !== 6,
              children: isLoading ? /* @__PURE__ */ jsxs(Fragment$1, { children: [
                /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }),
                t("auth.verifyCode.verifying")
              ] }) : t("auth.verifyCode.verify")
            }
          ),
          /* @__PURE__ */ jsx("div", { className: "text-center", children: /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: handleResendCode,
              disabled: resendCooldown > 0 || isResending,
              className: "text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 font-medium disabled:text-slate-400 disabled:cursor-not-allowed",
              children: isResending ? /* @__PURE__ */ jsxs(Fragment$1, { children: [
                /* @__PURE__ */ jsx(Loader2, { className: "inline h-3 w-3 animate-spin mr-1" }),
                t("auth.verifyCode.resending")
              ] }) : resendCooldown > 0 ? t("auth.verifyCode.resendIn", { seconds: resendCooldown }) : t("auth.verifyCode.resendCode")
            }
          ) }),
          /* @__PURE__ */ jsx("div", { className: "text-center pt-4 border-t", children: /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: () => setMode("signup"),
              className: "text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white inline-flex items-center gap-1",
              children: [
                /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
                t("auth.verifyCode.backToSignup")
              ]
            }
          ) })
        ] })
      ] })
    ) : (
      /* Login/Signup Form View */
      /* @__PURE__ */ jsxs(Fragment$1, { children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold mb-2", children: mode === "login" ? t("auth.login.title") : t("auth.signup.title") }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: mode === "login" ? t("auth.login.subtitle") : t("auth.signup.subtitle") })
        ] }),
        error && /* @__PURE__ */ jsxs(Alert, { variant: "destructive", className: "mb-4", children: [
          /* @__PURE__ */ jsx(AlertCircle, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsx(AlertDescription, { children: error })
        ] }),
        /* @__PURE__ */ jsxs("form", { onSubmit: mode === "login" ? handleLogin : handleSignup, className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "email", children: t("auth.login.email") }),
            /* @__PURE__ */ jsx(
              Input,
              {
                id: "email",
                type: "email",
                placeholder: t("auth.login.emailPlaceholder"),
                value: email,
                onChange: (e) => setEmail(e.target.value),
                disabled: isLoading
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsx(Label, { htmlFor: "password", children: t("auth.login.password") }),
              mode === "login" && /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  className: "text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white",
                  onClick: () => {
                    closeAuthModal();
                    navigate2("/forgot-password");
                  },
                  children: t("auth.login.forgotPassword")
                }
              )
            ] }),
            /* @__PURE__ */ jsx(
              Input,
              {
                id: "password",
                type: "password",
                placeholder: t("auth.login.passwordPlaceholder"),
                value: password,
                onChange: (e) => setPassword(e.target.value),
                disabled: isLoading
              }
            )
          ] }),
          mode === "signup" && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "confirmPassword", children: t("auth.signup.confirmPassword") }),
            /* @__PURE__ */ jsx(
              Input,
              {
                id: "confirmPassword",
                type: "password",
                placeholder: t("auth.login.passwordPlaceholder"),
                value: confirmPassword,
                onChange: (e) => setConfirmPassword(e.target.value),
                disabled: isLoading
              }
            )
          ] }),
          /* @__PURE__ */ jsx(
            Button,
            {
              type: "submit",
              className: "w-full",
              disabled: isLoading,
              children: isLoading ? /* @__PURE__ */ jsxs(Fragment$1, { children: [
                /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }),
                mode === "login" ? t("auth.login.signingIn") : t("auth.signup.creating")
              ] }) : mode === "login" ? t("auth.login.button") : t("auth.signup.button")
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-6 text-center text-sm", children: mode === "login" ? /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground", children: [
          t("auth.login.noAccount"),
          " ",
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setMode("signup"),
              className: "text-primary font-semibold hover:underline",
              children: t("auth.login.signUp")
            }
          )
        ] }) : /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground", children: [
          t("auth.signup.haveAccount"),
          " ",
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setMode("login"),
              className: "text-primary font-semibold hover:underline",
              children: t("auth.signup.signIn")
            }
          )
        ] }) })
      ] })
    )
  ] }) });
}
function LanguageSelection({ onLanguageSelected }) {
  const { setLanguage } = useLanguage();
  const [selectedLang, setSelectedLang] = useState(null);
  const languages = [
    {
      code: "en",
      name: "English",
      nativeName: "English",
      flag: "🇺🇸"
    },
    {
      code: "ko",
      name: "Korean",
      nativeName: "한국어",
      flag: "🇰🇷"
    },
    {
      code: "ja",
      name: "Japanese",
      nativeName: "日本語",
      flag: "🇯🇵"
    },
    {
      code: "zh",
      name: "Chinese",
      nativeName: "中文",
      flag: "🇨🇳"
    }
  ];
  const handleLanguageSelect = (lang) => {
    setSelectedLang(lang);
    setLanguage(lang);
    localStorage.setItem("language-selected", "true");
    setTimeout(() => {
      if (onLanguageSelected) {
        onLanguageSelected();
      }
    }, 300);
  };
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-md", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center mb-8", children: [
      /* @__PURE__ */ jsx(
        "img",
        {
          src: "/insiderpulse_logo1.png",
          alt: "InsiderPulse Pro",
          className: "h-56 mx-auto mb-6"
        }
      ),
      /* @__PURE__ */ jsx("p", { className: "text-gray-200 text-lg font-medium", children: "Select your language" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50 p-6", children: [
      /* @__PURE__ */ jsx("div", { className: "space-y-3", children: languages.map((lang) => /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => handleLanguageSelect(lang.code),
          className: `w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${selectedLang === lang.code ? "border-green-500 bg-green-500/10" : "border-gray-700 hover:border-green-500/50 hover:bg-gray-700/50"}`,
          children: [
            /* @__PURE__ */ jsx("div", { className: "text-4xl", children: lang.flag }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 text-left", children: [
              /* @__PURE__ */ jsx("div", { className: "font-semibold text-white", children: lang.nativeName }),
              /* @__PURE__ */ jsx("div", { className: "text-sm text-gray-400", children: lang.name })
            ] }),
            selectedLang === lang.code && /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center w-6 h-6 rounded-full bg-green-500", children: /* @__PURE__ */ jsx(Check, { className: "w-4 h-4 text-white" }) })
          ]
        },
        lang.code
      )) }),
      /* @__PURE__ */ jsx("div", { className: "mt-6 text-center text-sm text-gray-500", children: "You can change this later in settings" })
    ] })
  ] }) });
}
const Card = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  "div",
  {
    ref,
    className: cn(
      "shadcn-card rounded-xl border bg-card border-card-border text-card-foreground shadow-sm",
      className
    ),
    ...props
  }
));
Card.displayName = "Card";
const CardHeader = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  "div",
  {
    ref,
    className: cn("flex flex-col space-y-1.5 p-6", className),
    ...props
  }
));
CardHeader.displayName = "CardHeader";
const CardTitle = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  "div",
  {
    ref,
    className: cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    ),
    ...props
  }
));
CardTitle.displayName = "CardTitle";
const CardDescription = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  "div",
  {
    ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
CardDescription.displayName = "CardDescription";
const CardContent = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", { ref, className: cn("p-6 pt-0", className), ...props }));
CardContent.displayName = "CardContent";
const CardFooter = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  "div",
  {
    ref,
    className: cn("flex items-center p-6 pt-0", className),
    ...props
  }
));
CardFooter.displayName = "CardFooter";
function DashboardStats({ stats }) {
  const { t } = useLanguage();
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1
    }).format(value);
  };
  const statCards = [
    {
      title: t("dashboardStats.todayTrades"),
      value: stats.todayTrades.toLocaleString(),
      icon: TrendingUp,
      change: "+12%",
      positive: true
    },
    {
      title: t("dashboardStats.totalVolume"),
      value: formatCurrency(stats.totalVolume),
      icon: DollarSign,
      change: "+8.2%",
      positive: true
    }
  ];
  return /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: statCards.map((stat, index) => {
    const Icon = stat.icon;
    return /* @__PURE__ */ jsxs(Card, { className: "hover-elevate", "data-testid": `stat-card-${index}`, children: [
      /* @__PURE__ */ jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [
        /* @__PURE__ */ jsx(CardTitle, { className: "text-sm font-medium text-muted-foreground", children: stat.title }),
        /* @__PURE__ */ jsx(Icon, { className: "h-4 w-4 text-muted-foreground" })
      ] }),
      /* @__PURE__ */ jsxs(CardContent, { children: [
        /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold", "data-testid": `stat-value-${index}`, children: stat.value }),
        /* @__PURE__ */ jsxs("p", { className: `text-xs ${stat.positive ? "text-chart-2" : "text-destructive"}`, children: [
          stat.change,
          " ",
          t("dashboardStats.fromLastWeek")
        ] })
      ] })
    ] }, index);
  }) });
}
const Select = SelectPrimitive.Root;
const SelectValue = SelectPrimitive.Value;
const SelectTrigger = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs(
  SelectPrimitive.Trigger,
  {
    ref,
    className: cn(
      "flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className
    ),
    ...props,
    children: [
      children,
      /* @__PURE__ */ jsx(SelectPrimitive.Icon, { asChild: true, children: /* @__PURE__ */ jsx(ChevronDown, { className: "h-4 w-4 opacity-50" }) })
    ]
  }
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;
const SelectScrollUpButton = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SelectPrimitive.ScrollUpButton,
  {
    ref,
    className: cn(
      "flex cursor-default items-center justify-center py-1",
      className
    ),
    ...props,
    children: /* @__PURE__ */ jsx(ChevronUp, { className: "h-4 w-4" })
  }
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;
const SelectScrollDownButton = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SelectPrimitive.ScrollDownButton,
  {
    ref,
    className: cn(
      "flex cursor-default items-center justify-center py-1",
      className
    ),
    ...props,
    children: /* @__PURE__ */ jsx(ChevronDown, { className: "h-4 w-4" })
  }
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;
const SelectContent = React.forwardRef(({ className, children, position = "popper", ...props }, ref) => /* @__PURE__ */ jsx(SelectPrimitive.Portal, { children: /* @__PURE__ */ jsxs(
  SelectPrimitive.Content,
  {
    ref,
    className: cn(
      "relative z-50 max-h-[--radix-select-content-available-height] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-select-content-transform-origin]",
      position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
      className
    ),
    position,
    ...props,
    children: [
      /* @__PURE__ */ jsx(SelectScrollUpButton, {}),
      /* @__PURE__ */ jsx(
        SelectPrimitive.Viewport,
        {
          className: cn(
            "p-1",
            position === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
          ),
          children
        }
      ),
      /* @__PURE__ */ jsx(SelectScrollDownButton, {})
    ]
  }
) }));
SelectContent.displayName = SelectPrimitive.Content.displayName;
const SelectLabel = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SelectPrimitive.Label,
  {
    ref,
    className: cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className),
    ...props
  }
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;
const SelectItem = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs(
  SelectPrimitive.Item,
  {
    ref,
    className: cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    ...props,
    children: [
      /* @__PURE__ */ jsx("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ jsx(SelectPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx(Check, { className: "h-4 w-4" }) }) }),
      /* @__PURE__ */ jsx(SelectPrimitive.ItemText, { children })
    ]
  }
));
SelectItem.displayName = SelectPrimitive.Item.displayName;
const SelectSeparator = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SelectPrimitive.Separator,
  {
    ref,
    className: cn("-mx-1 my-1 h-px bg-muted", className),
    ...props
  }
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;
const generateInitials = (name) => {
  const words = name.split(" ").filter((w) => w.length > 1);
  return words.slice(0, 2).map((w) => w[0]).join("").toUpperCase();
};
function CompanyLogo({ ticker, companyName, size = "lg" }) {
  const [logoError, setLogoError] = useState(false);
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14"
  };
  if (logoError || !ticker) {
    const initials = generateInitials(companyName);
    return /* @__PURE__ */ jsx("div", { className: `${sizeClasses[size]} bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-white text-base shadow-md`, children: initials });
  }
  return /* @__PURE__ */ jsx("div", { className: `${sizeClasses[size]} relative overflow-hidden`, children: /* @__PURE__ */ jsx(
    "img",
    {
      src: `https://assets.parqet.com/logos/resolution/${ticker.toUpperCase()}.png`,
      alt: `${companyName} logo`,
      className: "w-full h-full rounded-lg object-contain",
      onError: (e) => {
        const target = e.target;
        if (target.src.includes("parqet.com")) {
          target.src = `https://eodhd.com/img/logos/US/${ticker.toUpperCase()}.png`;
        } else {
          setLogoError(true);
        }
      }
    }
  ) });
}
function TradeCard({ trade, onViewDetails }) {
  const { t } = useLanguage();
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1
    }).format(value);
  };
  const formatDate = (date) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };
  const handleViewDetails = () => {
    console.log("View details clicked for trade:", trade.id);
    onViewDetails == null ? void 0 : onViewDetails(trade);
  };
  const getTradeIcon = (tradeType) => {
    switch (tradeType) {
      case "BUY":
        return /* @__PURE__ */ jsx(TrendingUp, { className: "h-4 w-4 text-green-600" });
      case "SELL":
        return /* @__PURE__ */ jsx(TrendingDown, { className: "h-4 w-4 text-red-600" });
      default:
        return /* @__PURE__ */ jsx(Minus, { className: "h-4 w-4 text-gray-500" });
    }
  };
  const getTradeColor = (tradeType) => {
    switch (tradeType) {
      case "BUY":
        return "bg-green-100 text-green-800 border-green-200";
      case "SELL":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };
  return /* @__PURE__ */ jsx(Card, { className: "hover-elevate", "data-testid": `trade-card-${trade.id}`, children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between mb-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 flex-1", children: [
        /* @__PURE__ */ jsx(
          CompanyLogo,
          {
            ticker: trade.ticker,
            companyName: trade.companyName,
            size: "lg"
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold text-foreground", "data-testid": "company-name", children: trade.companyName }),
            trade.ticker && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-xs font-mono", children: trade.ticker })
          ] }),
          trade.traderName && /* @__PURE__ */ jsxs("div", { className: "mb-1", children: [
            /* @__PURE__ */ jsx("div", { className: "text-sm font-medium text-foreground", "data-testid": "trader-name", children: trade.traderName }),
            trade.traderTitle && /* @__PURE__ */ jsx("div", { className: "text-xs font-normal text-muted-foreground", "data-testid": "trader-title", children: trade.traderTitle })
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
            t("tradeCard.filed"),
            " ",
            formatDate(trade.filedDate)
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2", children: trade.tradeType && /* @__PURE__ */ jsxs(Badge, { className: `flex items-center gap-1 text-xs ${getTradeColor(trade.tradeType)}`, "data-testid": "trade-type", children: [
        getTradeIcon(trade.tradeType),
        trade.tradeType
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4 mb-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "text-xs font-medium text-muted-foreground", children: t("tradeCard.shares") }),
        /* @__PURE__ */ jsx("div", { className: "text-sm font-mono text-foreground", "data-testid": "shares", children: trade.shares.toLocaleString() })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "text-xs font-medium text-muted-foreground", children: t("tradeCard.avgPrice") }),
        /* @__PURE__ */ jsxs("div", { className: "text-sm font-mono text-foreground", "data-testid": "price-per-share", children: [
          "$",
          trade.pricePerShare.toFixed(2)
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "col-span-2", children: [
        /* @__PURE__ */ jsx("div", { className: "text-xs font-medium text-muted-foreground", children: t("tradeCard.totalValue") }),
        /* @__PURE__ */ jsx("div", { className: "text-lg font-bold text-foreground", "data-testid": "total-value", children: formatCurrency(trade.totalValue) }),
        trade.ownershipPercentage && trade.ownershipPercentage > 0 && /* @__PURE__ */ jsxs("div", { className: "text-xs font-normal text-muted-foreground mt-1", children: [
          trade.ownershipPercentage,
          "% ",
          t("tradeCard.ownership")
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsxs(
      Button,
      {
        variant: "ghost",
        size: "sm",
        onClick: handleViewDetails,
        className: "text-xs",
        "data-testid": "button-view-details",
        children: [
          /* @__PURE__ */ jsx(ExternalLink, { className: "h-3 w-3 mr-1" }),
          t("tradeCard.details")
        ]
      }
    ) })
  ] }) });
}
function TradeList({ trades, loading, loadingMore = false, hasMoreData = true, onLoadMore, onDateRangeChange, onSortChange }) {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [dateFilter, setDateFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const filteredTrades = trades.filter((trade) => {
    const matchesSearch = trade.companyName.toLowerCase().includes(searchTerm.toLowerCase()) || trade.ticker && trade.ticker.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  }).sort((a, b) => {
    switch (sortBy) {
      case "value":
        return b.totalValue - a.totalValue;
      default:
        return new Date(b.filedDate).getTime() - new Date(a.filedDate).getTime();
    }
  });
  const handleSearch = (value) => {
    console.log("Search term changed:", value);
    setSearchTerm(value);
  };
  const handleSort = (sort) => {
    console.log("Sort changed:", sort);
    setSortBy(sort);
    onSortChange == null ? void 0 : onSortChange(sort === "date" ? "filedDate" : "filedDate");
  };
  const handleDateFilterChange = (value) => {
    setDateFilter(value);
    const now = /* @__PURE__ */ new Date();
    let fromDate;
    let toDate;
    switch (value) {
      case "today":
        fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case "week":
        fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1e3);
        toDate = now;
        break;
      case "month":
        fromDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        toDate = now;
        break;
      case "3months":
        fromDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        toDate = now;
        break;
      case "6months":
        fromDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        toDate = now;
        break;
      case "all":
      default:
        fromDate = void 0;
        toDate = void 0;
        break;
    }
    onDateRangeChange == null ? void 0 : onDateRangeChange(fromDate, toDate);
  };
  const handleLoadMore = () => {
    console.log("Load more clicked");
    if (!loadingMore && hasMoreData) {
      onLoadMore == null ? void 0 : onLoadMore();
    }
  };
  const handleViewDetails = (trade) => {
    console.log("Navigating to trade details:", trade.id);
    setLocation(`/trade/${trade.id}`);
  };
  return /* @__PURE__ */ jsxs(Card, { "data-testid": "trade-list", children: [
    /* @__PURE__ */ jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4", children: [
        /* @__PURE__ */ jsx(CardTitle, { className: "text-lg font-semibold", children: t("tradeList.recentTrades") }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "outline",
              size: "sm",
              onClick: () => setShowFilters(!showFilters),
              "data-testid": "button-toggle-filters",
              children: [
                /* @__PURE__ */ jsx(Filter, { className: "h-4 w-4 mr-2" }),
                t("tradeList.filters")
              ]
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                placeholder: t("tradeList.searchCompanies"),
                value: searchTerm,
                onChange: (e) => handleSearch(e.target.value),
                className: "pl-9 w-48",
                "data-testid": "input-search"
              }
            )
          ] })
        ] })
      ] }),
      showFilters && /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-md", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Calendar, { className: "h-4 w-4 text-muted-foreground" }),
          /* @__PURE__ */ jsxs("span", { className: "text-sm text-muted-foreground", children: [
            t("tradeList.dateRange"),
            ":"
          ] }),
          /* @__PURE__ */ jsxs(Select, { value: dateFilter, onValueChange: handleDateFilterChange, children: [
            /* @__PURE__ */ jsx(SelectTrigger, { className: "w-[140px]", "data-testid": "select-date-filter", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxs(SelectContent, { children: [
              /* @__PURE__ */ jsx(SelectItem, { value: "all", children: t("tradeList.dateRange.all") }),
              /* @__PURE__ */ jsx(SelectItem, { value: "today", children: t("tradeList.dateRange.today") }),
              /* @__PURE__ */ jsx(SelectItem, { value: "week", children: t("tradeList.dateRange.week") }),
              /* @__PURE__ */ jsx(SelectItem, { value: "month", children: t("tradeList.dateRange.month") }),
              /* @__PURE__ */ jsx(SelectItem, { value: "3months", children: t("tradeList.dateRange.threeMonths") }),
              /* @__PURE__ */ jsx(SelectItem, { value: "6months", children: t("tradeList.dateRange.sixMonths") })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: t("tradeList.showingTrades", { count: filteredTrades.length }) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex flex-wrap items-center gap-2", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
        /* @__PURE__ */ jsx(SortDesc, { className: "h-4 w-4 text-muted-foreground" }),
        /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground", children: t("tradeList.sort") }),
        [
          { key: "date", label: t("tradeList.date") },
          { key: "value", label: t("tradeList.value") }
        ].map((sort) => /* @__PURE__ */ jsx(
          Badge,
          {
            variant: sortBy === sort.key ? "default" : "outline",
            className: "cursor-pointer text-xs hover-elevate",
            onClick: () => handleSort(sort.key),
            "data-testid": `sort-${sort.key}`,
            children: sort.label
          },
          sort.key
        ))
      ] }) })
    ] }),
    /* @__PURE__ */ jsx(CardContent, { children: loading && filteredTrades.length === 0 ? /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center py-8", "data-testid": "loading-state", children: /* @__PURE__ */ jsxs("div", { className: "animate-pulse flex space-x-4", children: [
      /* @__PURE__ */ jsx("div", { className: "rounded-md bg-muted h-4 w-4" }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 space-y-2 py-1", children: [
        /* @__PURE__ */ jsx("div", { className: "h-4 bg-muted rounded w-3/4" }),
        /* @__PURE__ */ jsx("div", { className: "h-4 bg-muted rounded w-1/2" })
      ] })
    ] }) }) : filteredTrades.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-center py-8 text-muted-foreground", "data-testid": "empty-state", children: /* @__PURE__ */ jsx("p", { children: t("tradeList.noTradesFound") }) }) : /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      filteredTrades.map((trade) => /* @__PURE__ */ jsx(
        TradeCard,
        {
          trade,
          onViewDetails: handleViewDetails
        },
        trade.id
      )),
      onLoadMore && /* @__PURE__ */ jsx("div", { className: "flex justify-center pt-4", children: !hasMoreData ? /* @__PURE__ */ jsx("div", { className: "text-center text-muted-foreground py-2", children: /* @__PURE__ */ jsx("p", { className: "text-sm", children: t("tradeList.noMoreData") }) }) : /* @__PURE__ */ jsx(
        Button,
        {
          variant: "outline",
          onClick: handleLoadMore,
          disabled: loadingMore,
          "data-testid": "button-load-more",
          children: loadingMore ? t("tradeList.loading") : t("tradeList.loadMore")
        }
      ) })
    ] }) })
  ] });
}
const logoLight$5 = "/assets/Gemini_Generated_Image_wdqi0fwdqi0fwdqi-Photoroom_1757888880167-BnhrSNJc.png";
const logoDark$5 = "/assets/inverted_with_green_1757888880166-D3vveTue.png";
function TradeDetailModal({
  isOpen,
  onClose,
  trade,
  onAddToWatchlist,
  isInWatchlist = false
}) {
  var _a;
  const { t, language } = useLanguage();
  const [showPWAGuide, setShowPWAGuide] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  useState(false);
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);
  const [comprehensiveAnalysis, setComprehensiveAnalysis] = useState(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [isHistoricalTrade, setIsHistoricalTrade] = useState(false);
  const [tradeAge, setTradeAge] = useState(0);
  const [priceHistory, setPriceHistory] = useState([]);
  const [isLoadingPriceHistory, setIsLoadingPriceHistory] = useState(false);
  const [priceHistoryError, setPriceHistoryError] = useState(null);
  const [expandedNews, setExpandedNews] = useState(/* @__PURE__ */ new Set());
  const modalRef = useRef(null);
  const toggleNewsExpansion = (index) => {
    setExpandedNews((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };
  const formatTimeAgo = (date) => {
    const dateLocale = language === "ko" ? ko : language === "ja" ? ja : language === "zh" ? zhCN : enUS;
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: dateLocale
    });
  };
  useEffect(() => {
    const checkPWAInstalled = () => {
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone || document.referrer.includes("android-app://");
      setIsPWAInstalled(isStandalone);
    };
    checkPWAInstalled();
  }, []);
  useEffect(() => {
    if (isOpen && trade && !trade.comprehensiveAnalysis) {
      loadComprehensiveAnalysis();
    }
  }, [isOpen, trade]);
  useEffect(() => {
    if (isOpen && trade && trade.ticker && !isHistoricalTrade) {
      loadPriceHistory();
    }
  }, [isOpen, trade == null ? void 0 : trade.id, isHistoricalTrade]);
  const loadComprehensiveAnalysis = async () => {
    if (!trade) return;
    try {
      setIsLoadingAnalysis(true);
      const response = await fetch(`/api/trades/${trade.id}/comprehensive-analysis?language=${language}`);
      if (response.ok) {
        const data = await response.json();
        if (data.isHistorical) {
          console.log(`📦 Historical trade detected (${data.tradeAge} days old) - showing basic info only`);
          setIsHistoricalTrade(true);
          setTradeAge(data.tradeAge);
          setComprehensiveAnalysis(null);
        } else {
          setIsHistoricalTrade(false);
          setComprehensiveAnalysis(data);
        }
      } else {
        console.error("Failed to load AI analysis:", response.statusText);
      }
    } catch (error) {
      console.error("Error loading AI analysis:", error);
    } finally {
      setIsLoadingAnalysis(false);
    }
  };
  const loadPriceHistory = async () => {
    if (!trade || !trade.ticker) {
      console.warn("Cannot load price history: missing trade or ticker");
      return;
    }
    const ticker = trade.ticker.trim();
    if (!ticker || ticker.length === 0) {
      console.error("Invalid ticker:", trade.ticker);
      setPriceHistoryError("INVALID_TICKER");
      setIsLoadingPriceHistory(false);
      return;
    }
    try {
      setIsLoadingPriceHistory(true);
      setPriceHistoryError(null);
      const tradeDate = new Date(trade.filedDate);
      if (isNaN(tradeDate.getTime())) {
        console.error("Invalid trade date:", trade.filedDate);
        setPriceHistoryError("INVALID_DATE");
        setPriceHistory([]);
        return;
      }
      const startDate = new Date(tradeDate);
      startDate.setDate(startDate.getDate() - 7);
      const potentialEndDate = new Date(tradeDate);
      potentialEndDate.setDate(potentialEndDate.getDate() + 7);
      const today = /* @__PURE__ */ new Date();
      const endDate = potentialEndDate > today ? today : potentialEndDate;
      const fromDate = startDate.toISOString().split("T")[0];
      const toDate = endDate.toISOString().split("T")[0];
      console.log(`📊 Loading price history for ${ticker}: ${fromDate} to ${toDate}`);
      const response = await fetch(`/api/stocks/${ticker}/history?from=${fromDate}&to=${toDate}`);
      if (response.ok) {
        const data = await response.json();
        if (!data || data.length === 0) {
          console.warn(`⚠️ No price data returned for ${ticker} in range ${fromDate} to ${toDate}`);
          setPriceHistoryError("NO_DATA");
          setPriceHistory([]);
          return;
        }
        const transformedData = data.map((item) => ({
          date: item.date,
          close: parseFloat(item.close)
        }));
        console.log(`✅ Loaded ${transformedData.length} price data points for ${ticker}`);
        setPriceHistory(transformedData);
        setPriceHistoryError(null);
      } else {
        console.error(`Failed to load price history for ${ticker}: HTTP ${response.status}`);
        setPriceHistoryError("API_ERROR");
        setPriceHistory([]);
      }
    } catch (error) {
      console.error("Error loading price history:", error);
      setPriceHistoryError("FETCH_ERROR");
      setPriceHistory([]);
    } finally {
      setIsLoadingPriceHistory(false);
    }
  };
  const handleScreenshot = async () => {
    if (!modalRef.current) return;
    try {
      setIsCapturing(true);
      await new Promise((resolve) => setTimeout(resolve, 100));
      const canvas = await html2canvas(modalRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff"
      });
      const dataUrl = canvas.toDataURL("image/png");
      if (navigator.share) {
        const blob = await (await fetch(dataUrl)).blob();
        await navigator.share({
          title: `InsiderPulse: ${trade.ticker}`,
          text: t("tradeDetail.shareText").replace("{company}", trade.companyName),
          files: [
            new File([blob], `insider_trade_${trade.ticker}.png`, {
              type: "image/png"
            })
          ]
        });
      } else {
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = `insider_trade_${trade.ticker}_${(/* @__PURE__ */ new Date()).getTime()}.png`;
        link.click();
      }
    } catch (error) {
      console.error("스크린샷 공유 중 오류 발생:", error);
    } finally {
      setIsCapturing(false);
    }
  };
  if (!isOpen || !trade) return null;
  const isMarketOpen = () => {
    const now = /* @__PURE__ */ new Date();
    const easternTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
    const day = easternTime.getDay();
    const hour = easternTime.getHours();
    const minute = easternTime.getMinutes();
    const currentTime = hour * 60 + minute;
    if (day === 0 || day === 6) return false;
    const marketOpen = 9 * 60 + 30;
    const marketClose = 16 * 60;
    return currentTime >= marketOpen && currentTime <= marketClose;
  };
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  const getLocale = () => {
    const localeMap = {
      en: "en-US",
      ko: "ko-KR",
      ja: "ja-JP",
      zh: "zh-CN"
    };
    return localeMap[language] || "en-US";
  };
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString(getLocale(), {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };
  const getCompanyInitials = (name) => {
    const words = name.split(" ").filter((w) => w.length > 1);
    return words.slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  };
  const getTradeTypeIcon = (tradeType) => {
    const iconClass = `h-4 w-4 ${getTradeTypeIconColor(tradeType)}`;
    switch (tradeType == null ? void 0 : tradeType.toUpperCase()) {
      case "BUY":
      case "PURCHASE":
        return /* @__PURE__ */ jsx(TrendingUp, { className: iconClass });
      case "SELL":
      case "SALE":
        return /* @__PURE__ */ jsx(TrendingDown, { className: iconClass });
      default:
        return /* @__PURE__ */ jsx(DollarSign, { className: iconClass });
    }
  };
  const getTradeTypeIconColor = (tradeType) => {
    switch (tradeType == null ? void 0 : tradeType.toUpperCase()) {
      case "BUY":
      case "PURCHASE":
        return "text-green-600";
      case "SELL":
      case "SALE":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };
  const getTradeTypeColor = (tradeType) => {
    switch (tradeType == null ? void 0 : tradeType.toUpperCase()) {
      case "BUY":
      case "PURCHASE":
        return "bg-green-100 text-green-800 border-green-200";
      case "SELL":
      case "SALE":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: "modal-backdrop fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4",
      onClick: onClose,
      children: [
        /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 flex items-center justify-center pointer-events-none z-40 overflow-hidden", children: [
          /* @__PURE__ */ jsx(
            "img",
            {
              src: logoLight$5,
              alt: "InsiderPulse",
              className: "w-80 h-auto opacity-10 select-none dark:hidden"
            }
          ),
          /* @__PURE__ */ jsx(
            "img",
            {
              src: logoDark$5,
              alt: "InsiderPulse",
              className: "w-80 h-auto opacity-10 select-none hidden dark:block"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs(
          Card,
          {
            ref: modalRef,
            className: "modal-content card-professional max-w-[95vw] sm:max-w-2xl w-full max-h-[80vh] overflow-y-auto overflow-x-hidden relative",
            onClick: (e) => e.stopPropagation(),
            children: [
              /* @__PURE__ */ jsx(CardHeader, { className: "relative z-10 px-3 sm:px-6", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between flex-wrap gap-2", children: [
                /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2 sm:gap-3 min-w-0", children: [
                  trade.ticker ? /* @__PURE__ */ jsxs("div", { className: "relative w-10 h-10 flex-shrink-0", children: [
                    /* @__PURE__ */ jsx(
                      "img",
                      {
                        src: `https://assets.parqet.com/logos/resolution/${trade.ticker}.png`,
                        alt: `${trade.companyName} logo`,
                        className: "w-10 h-10 rounded-lg object-contain",
                        onError: (e) => {
                          var _a2;
                          const target = e.target;
                          if (target.src.includes("parqet.com")) {
                            target.src = `https://eodhd.com/img/logos/US/${trade.ticker}.png`;
                          } else {
                            target.style.display = "none";
                            const fallbackDiv = (_a2 = target.parentElement) == null ? void 0 : _a2.querySelector(".fallback-logo");
                            if (fallbackDiv) fallbackDiv.style.display = "flex";
                          }
                        }
                      }
                    ),
                    /* @__PURE__ */ jsx("div", { className: "fallback-logo w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center text-white font-bold hidden", style: { display: "none" }, children: getCompanyInitials(trade.companyName) })
                  ] }) : /* @__PURE__ */ jsx("div", { className: "w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center text-white font-bold", children: getCompanyInitials(trade.companyName) }),
                  /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
                    /* @__PURE__ */ jsx("h3", { className: "text-sm sm:text-lg font-bold truncate", children: trade.companyName }),
                    /* @__PURE__ */ jsx("p", { className: "text-xs sm:text-sm text-muted-foreground", children: trade.ticker })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 sm:gap-2 flex-shrink-0", children: [
                  onAddToWatchlist && /* @__PURE__ */ jsxs(
                    Button,
                    {
                      size: "sm",
                      variant: isInWatchlist ? "default" : "outline",
                      onClick: () => onAddToWatchlist(trade),
                      className: "btn-professional px-2 sm:px-3",
                      title: isInWatchlist ? t("watchlist.remove") : t("liveTrading.watchlist"),
                      "data-testid": isInWatchlist ? "button-remove-watchlist" : "button-add-watchlist",
                      children: [
                        /* @__PURE__ */ jsx(Bookmark, { className: `h-4 w-4 ${isInWatchlist ? "fill-current" : ""}` }),
                        /* @__PURE__ */ jsx("span", { className: "hidden sm:inline ml-1", children: isInWatchlist ? t("watchlist.remove") : t("liveTrading.watchlist") })
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    Button,
                    {
                      variant: "ghost",
                      size: "sm",
                      onClick: handleScreenshot,
                      disabled: isCapturing,
                      className: "btn-professional",
                      title: t("tradeDetail.shareScreenshot"),
                      children: isCapturing ? /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(Camera, { className: "h-4 w-4" })
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    Button,
                    {
                      variant: "ghost",
                      size: "sm",
                      onClick: onClose,
                      className: "btn-professional",
                      children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
                    }
                  )
                ] })
              ] }) }),
              /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4 relative z-10 px-3 sm:px-6", children: [
                /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 sm:p-6 rounded-lg space-y-4", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4", children: [
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("p", { className: "text-xs sm:text-sm text-muted-foreground mb-1", children: t("tradeDetail.tradeType") }),
                      /* @__PURE__ */ jsxs(Badge, { className: `btn-professional font-bold text-sm sm:text-lg px-3 py-1.5 sm:px-4 sm:py-2 flex items-center gap-2 w-fit ${getTradeTypeColor(trade.tradeType)}`, children: [
                        getTradeTypeIcon(trade.tradeType),
                        trade.tradeType
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "sm:text-right", children: [
                      /* @__PURE__ */ jsx("p", { className: "text-xs sm:text-sm text-muted-foreground mb-1", children: t("tradeDetail.totalTransactionAmount") }),
                      /* @__PURE__ */ jsx("p", { className: `text-2xl sm:text-3xl font-black ${((_a = trade.tradeType) == null ? void 0 : _a.toUpperCase()) === "BUY" ? "text-green-600" : "text-red-600"}`, children: formatCurrency(trade.totalValue) })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4 pt-4 border-t border-white/50 dark:border-gray-700", children: [
                    /* @__PURE__ */ jsxs("div", { className: "bg-white/50 dark:bg-gray-900/50 p-3 rounded-lg", children: [
                      /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mb-1", children: t("tradeDetail.sharesCount") }),
                      /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold", children: trade.shares.toLocaleString() }),
                      /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-1", children: t("tradeDetail.shares") })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "bg-white/50 dark:bg-gray-900/50 p-3 rounded-lg", children: [
                      /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mb-1", children: t("tradeDetail.pricePerShare") }),
                      /* @__PURE__ */ jsxs("p", { className: "text-2xl font-bold", children: [
                        "$",
                        trade.pricePerShare.toFixed(2)
                      ] }),
                      /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-1", children: t("tradeDetail.perShare") })
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800", children: [
                  /* @__PURE__ */ jsxs("h4", { className: "font-bold mb-3 flex items-center gap-2 text-base", children: [
                    /* @__PURE__ */ jsx(User, { className: "h-5 w-5 text-slate-600 dark:text-slate-400" }),
                    t("tradeDetail.insiderInfo")
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                      /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "bg-white dark:bg-gray-800", children: t("tradeDetail.name") }),
                      /* @__PURE__ */ jsx("p", { className: "font-bold text-lg", children: trade.traderName })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                      /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "bg-white dark:bg-gray-800", children: t("tradeDetail.titlePosition") }),
                      /* @__PURE__ */ jsx("p", { className: "font-semibold text-slate-700 dark:text-slate-300", children: trade.traderTitle })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mt-3 pt-3 border-t", children: [
                      /* @__PURE__ */ jsx(Calendar, { className: "h-5 w-5 text-amber-600" }),
                      /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:gap-2", children: [
                        /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground font-medium", children: [
                          t("tradeDetail.transactionDate") || "Transaction Date",
                          ":"
                        ] }),
                        /* @__PURE__ */ jsx("p", { className: "font-bold text-base text-slate-900 dark:text-white", children: formatDate(trade.filedDate) })
                      ] })
                    ] })
                  ] })
                ] }),
                trade.secFilingUrl && /* @__PURE__ */ jsxs("div", { className: "border-t pt-4", children: [
                  /* @__PURE__ */ jsxs(
                    "a",
                    {
                      href: trade.secFilingUrl,
                      target: "_blank",
                      rel: "noopener noreferrer",
                      className: "flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold hover:underline",
                      children: [
                        /* @__PURE__ */ jsx("svg", { className: "h-5 w-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" }) }),
                        t("tradeDetail.viewSecFiling")
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [
                    "✓ ",
                    t("tradeDetail.verifiedBySec")
                  ] })
                ] }),
                !isHistoricalTrade && /* @__PURE__ */ jsxs("div", { className: "border-t pt-4", children: [
                  /* @__PURE__ */ jsxs("h4", { className: "font-semibold mb-4 flex items-center gap-2 text-base", children: [
                    /* @__PURE__ */ jsx(BarChart3, { className: "h-5 w-5 text-slate-600 dark:text-slate-400" }),
                    t("tradeDetail.priceAnalysis")
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "mb-6 bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700", children: [
                    /* @__PURE__ */ jsx("h5", { className: "text-sm font-semibold mb-4 text-slate-700 dark:text-slate-300", children: t("priceChart.title") }),
                    isLoadingPriceHistory ? /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center h-[200px]", children: [
                      /* @__PURE__ */ jsx(Loader2, { className: "h-8 w-8 animate-spin text-primary" }),
                      /* @__PURE__ */ jsx("span", { className: "ml-3 text-sm", children: t("priceChart.loadingHistory") || "Loading price history..." })
                    ] }) : priceHistory.length > 0 ? /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: 240, children: /* @__PURE__ */ jsxs(
                      LineChart,
                      {
                        data: priceHistory,
                        margin: { top: 5, right: 20, left: 0, bottom: 5 },
                        children: [
                          /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#e5e7eb" }),
                          /* @__PURE__ */ jsx(
                            XAxis,
                            {
                              dataKey: "date",
                              stroke: "#6b7280",
                              style: { fontSize: "11px" },
                              tickFormatter: (value) => {
                                const date = new Date(value);
                                return `${date.getMonth() + 1}/${date.getDate()}`;
                              }
                            }
                          ),
                          /* @__PURE__ */ jsx(
                            YAxis,
                            {
                              stroke: "#6b7280",
                              style: { fontSize: "12px" },
                              tickFormatter: (value) => `$${value.toFixed(2)}`,
                              domain: ["auto", "auto"]
                            }
                          ),
                          /* @__PURE__ */ jsx(
                            Tooltip$1,
                            {
                              contentStyle: {
                                backgroundColor: "rgba(255, 255, 255, 0.95)",
                                border: "1px solid #e5e7eb",
                                borderRadius: "6px",
                                fontSize: "12px"
                              },
                              formatter: (value) => [`$${value.toFixed(2)}`, t("priceChart.price") || "Price"],
                              labelFormatter: (label) => {
                                const date = new Date(label);
                                return date.toLocaleDateString(getLocale(), { month: "short", day: "numeric", year: "numeric" });
                              }
                            }
                          ),
                          /* @__PURE__ */ jsx(
                            ReferenceArea,
                            {
                              x1: (() => {
                                const tradeDate = new Date(trade.filedDate);
                                const dayBefore = new Date(tradeDate);
                                dayBefore.setDate(dayBefore.getDate() - 1);
                                return dayBefore.toISOString().split("T")[0];
                              })(),
                              x2: (() => {
                                const tradeDate = new Date(trade.filedDate);
                                const dayAfter = new Date(tradeDate);
                                dayAfter.setDate(dayAfter.getDate() + 1);
                                return dayAfter.toISOString().split("T")[0];
                              })(),
                              fill: "#f59e0b",
                              fillOpacity: 0.1
                            }
                          ),
                          /* @__PURE__ */ jsx(
                            ReferenceLine,
                            {
                              x: new Date(trade.filedDate).toISOString().split("T")[0],
                              stroke: "#f59e0b",
                              strokeWidth: 3,
                              strokeDasharray: "5 5",
                              label: {
                                value: `📊 ${t("tradeDetail.tradeDate") || "Trade Date"}`,
                                position: "top",
                                fill: "#f59e0b",
                                fontSize: 13,
                                fontWeight: "bold",
                                style: {
                                  textShadow: "0 0 3px white, 0 0 5px white"
                                }
                              }
                            }
                          ),
                          /* @__PURE__ */ jsx(
                            ReferenceLine,
                            {
                              y: trade.pricePerShare,
                              stroke: "#f59e0b",
                              strokeWidth: 3,
                              label: {
                                value: `Trade Price: $${trade.pricePerShare.toFixed(2)}`,
                                position: "insideTopRight",
                                fill: "#f59e0b",
                                fontSize: 13,
                                fontWeight: "bold",
                                style: {
                                  backgroundColor: "rgba(251, 146, 60, 0.9)",
                                  padding: "4px 8px",
                                  borderRadius: "4px",
                                  color: "white"
                                }
                              }
                            }
                          ),
                          /* @__PURE__ */ jsx(
                            ReferenceDot,
                            {
                              x: new Date(trade.filedDate).toISOString().split("T")[0],
                              y: trade.pricePerShare,
                              r: 8,
                              fill: "#f59e0b",
                              stroke: "#fff",
                              strokeWidth: 3,
                              isFront: true
                            }
                          ),
                          /* @__PURE__ */ jsx(
                            ReferenceDot,
                            {
                              x: new Date(trade.filedDate).toISOString().split("T")[0],
                              y: trade.pricePerShare,
                              r: 14,
                              fill: "#f59e0b",
                              fillOpacity: 0.25,
                              stroke: "none"
                            }
                          ),
                          /* @__PURE__ */ jsx(
                            ReferenceDot,
                            {
                              x: new Date(trade.filedDate).toISOString().split("T")[0],
                              y: trade.pricePerShare,
                              r: 11,
                              fill: "#f59e0b",
                              fillOpacity: 0.4,
                              stroke: "none"
                            }
                          ),
                          /* @__PURE__ */ jsx(
                            Line,
                            {
                              type: "monotone",
                              dataKey: "close",
                              stroke: "#10b981",
                              strokeWidth: 2,
                              dot: false,
                              name: t("priceChart.price") || "Price"
                            }
                          )
                        ]
                      }
                    ) }) : /* @__PURE__ */ jsxs("div", { className: "bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-700", children: [
                      priceHistoryError === "INVALID_TICKER" && /* @__PURE__ */ jsxs(Fragment$1, { children: [
                        /* @__PURE__ */ jsx("p", { className: "text-amber-700 dark:text-amber-300 font-medium mb-2", children: "⚠️ 유효하지 않은 티커 심볼" }),
                        /* @__PURE__ */ jsx("p", { className: "text-sm text-amber-600 dark:text-amber-400", children: "티커 형식을 확인해주세요" })
                      ] }),
                      priceHistoryError === "INVALID_DATE" && /* @__PURE__ */ jsxs(Fragment$1, { children: [
                        /* @__PURE__ */ jsx("p", { className: "text-amber-700 dark:text-amber-300 font-medium mb-2", children: "⚠️ 유효하지 않은 거래 날짜" }),
                        /* @__PURE__ */ jsx("p", { className: "text-sm text-amber-600 dark:text-amber-400", children: "이 날짜의 가격 데이터를 불러올 수 없습니다" })
                      ] }),
                      (priceHistoryError === "NO_DATA" || !priceHistoryError) && /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
                        /* @__PURE__ */ jsxs("div", { className: "mb-3", children: [
                          /* @__PURE__ */ jsx("p", { className: "text-blue-800 dark:text-blue-200 font-semibold text-base mb-1", children: "💡 실시간 주가 데이터를 수집하지 못했습니다" }),
                          /* @__PURE__ */ jsx("p", { className: "text-sm text-blue-700 dark:text-blue-300", children: priceHistoryError === "NO_DATA" ? "이 종목은 상장폐지되었거나 주요 거래소에서 거래되지 않을 수 있습니다" : "주가 데이터를 아직 수집하지 못했습니다" })
                        ] }),
                        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-blue-950/50 rounded-lg p-4 mt-3", children: [
                          /* @__PURE__ */ jsx("p", { className: "text-sm text-blue-900 dark:text-blue-100 font-medium mb-2", children: "✅ 내부자 거래 가격 기준으로 분석을 제공합니다" }),
                          /* @__PURE__ */ jsx("p", { className: "text-xs text-blue-700 dark:text-blue-300", children: "아래에서 내부자의 거래 가격과 관련 정보를 확인하실 수 있습니다" })
                        ] })
                      ] }),
                      (priceHistoryError === "API_ERROR" || priceHistoryError === "FETCH_ERROR") && /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
                        /* @__PURE__ */ jsx("p", { className: "text-red-700 dark:text-red-300 font-medium mb-2", children: "❌ 가격 데이터를 불러오지 못했습니다" }),
                        /* @__PURE__ */ jsx("p", { className: "text-sm text-red-600 dark:text-red-400 mb-3", children: "일시적인 오류입니다. 잠시 후 다시 시도해주세요" }),
                        /* @__PURE__ */ jsx("div", { className: "bg-white dark:bg-blue-950/50 rounded-lg p-3 mt-3", children: /* @__PURE__ */ jsx("p", { className: "text-xs text-blue-700 dark:text-blue-300", children: "💡 내부자 거래 정보는 아래에서 확인하실 수 있습니다" }) })
                      ] })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 mb-6", children: [
                    /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700", children: [
                      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
                        /* @__PURE__ */ jsx("div", { className: "w-8 h-8 bg-slate-600 dark:bg-slate-500 rounded-lg flex items-center justify-center", children: /* @__PURE__ */ jsx(DollarSign, { className: "h-4 w-4 text-white" }) }),
                        /* @__PURE__ */ jsxs("div", { children: [
                          /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-slate-700 dark:text-slate-300", children: t("tradeDetail.insiderTradePrice") }),
                          /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: formatDate(trade.filedDate) })
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxs("p", { className: "text-2xl font-bold text-slate-800 dark:text-slate-200 value-change-up", children: [
                        "$",
                        trade.pricePerShare.toFixed(2)
                      ] }),
                      /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-600 dark:text-slate-400 mt-1", children: t("tradeDetail.basedOnSecFiling") })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: `rounded-lg p-4 border-2 ${trade.currentPrice && trade.currentPrice !== trade.pricePerShare ? trade.currentPrice > trade.pricePerShare ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700" : "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700" : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"}`, children: [
                      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
                        /* @__PURE__ */ jsx("div", { className: `w-8 h-8 rounded-lg flex items-center justify-center ${trade.currentPrice && trade.currentPrice !== trade.pricePerShare ? trade.currentPrice > trade.pricePerShare ? "bg-green-500 dark:bg-green-600" : "bg-red-500 dark:bg-red-600" : "bg-slate-600 dark:bg-slate-500"}`, children: trade.currentPrice && trade.currentPrice > trade.pricePerShare ? /* @__PURE__ */ jsx(TrendingUp, { className: "h-4 w-4 text-white" }) : trade.currentPrice && trade.currentPrice < trade.pricePerShare ? /* @__PURE__ */ jsx(TrendingDown, { className: "h-4 w-4 text-white" }) : /* @__PURE__ */ jsx(TrendingUp, { className: "h-4 w-4 text-white" }) }),
                        /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                          /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-slate-700 dark:text-slate-300", children: t("tradeDetail.currentMarketPrice") }),
                          /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: trade.currentPrice ? isMarketOpen() ? t("tradeDetail.realtimeEstimate") : t("tradeDetail.lastClosePrice") : t("priceChart.tradeTimeBase") })
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "flex items-baseline justify-between mb-2", children: [
                        /* @__PURE__ */ jsxs("p", { className: "text-2xl font-bold text-slate-800 dark:text-slate-200", children: [
                          "$",
                          (trade.currentPrice || trade.pricePerShare).toFixed(2)
                        ] }),
                        trade.currentPrice && trade.currentPrice !== trade.pricePerShare && (() => {
                          const priceChange = trade.currentPrice - trade.pricePerShare;
                          const percentChange = priceChange / trade.pricePerShare * 100;
                          const isGain = priceChange > 0;
                          return /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                            /* @__PURE__ */ jsxs("p", { className: `text-xl font-bold ${isGain ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`, children: [
                              isGain ? "+" : "",
                              percentChange.toFixed(2),
                              "%"
                            ] }),
                            /* @__PURE__ */ jsxs("p", { className: `text-sm font-semibold ${isGain ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"}`, children: [
                              isGain ? "+" : "",
                              "$",
                              Math.abs(priceChange).toFixed(2)
                            ] })
                          ] });
                        })()
                      ] }),
                      /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-600 dark:text-slate-400", children: trade.currentPrice && trade.currentPrice !== trade.pricePerShare ? t("tradeDetail.priceChangeSinceTrade") : trade.currentPrice ? isMarketOpen() ? t("priceChart.realtimeMarketPrice") : t("priceChart.lastClosingPrice") : t("priceChart.basedOnInsiderTradePrice") }),
                      trade.priceLastUpdated && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 mt-2 pt-2 border-t border-slate-300 dark:border-slate-600", children: [
                        /* @__PURE__ */ jsx(Clock, { className: "h-3 w-3 text-slate-500" }),
                        /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-slate-500 dark:text-slate-400", children: [
                          t("tradeDetail.priceUpdatedAt") || "수집 시간",
                          ": ",
                          formatTimeAgo(trade.priceLastUpdated)
                        ] })
                      ] })
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "border-t pt-4", "data-testid": "section-ai-analysis", children: /* @__PURE__ */ jsx("div", { className: "bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-800", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-8 h-8 bg-slate-700 dark:bg-slate-600 rounded-lg flex items-center justify-center mb-3", children: /* @__PURE__ */ jsx(Brain, { className: "h-4 w-4 text-white" }) }),
                  /* @__PURE__ */ jsxs("div", { className: "w-full", children: [
                    /* @__PURE__ */ jsx("h4", { className: "font-semibold text-sm mb-3 text-center", children: t("tradeDetail.aiAnalysisResults") }),
                    /* @__PURE__ */ jsx("div", { className: "space-y-3 text-sm leading-relaxed", "data-testid": "text-ai-analysis", children: isLoadingAnalysis ? /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center p-8", children: [
                      /* @__PURE__ */ jsx(Loader2, { className: "h-8 w-8 animate-spin text-primary" }),
                      /* @__PURE__ */ jsx("span", { className: "ml-3", children: t("tradeDetail.aiAnalysisGenerating") })
                    ] }) : isHistoricalTrade ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center p-8 text-center bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-700", children: [
                      /* @__PURE__ */ jsx(Clock, { className: "h-12 w-12 text-slate-400 mb-4" }),
                      /* @__PURE__ */ jsx("p", { className: "text-base font-semibold text-slate-700 dark:text-slate-300 mb-2", children: language === "ko" ? "과거 거래 기록" : language === "ja" ? "過去の取引記録" : language === "zh" ? "历史交易记录" : "Historical Trade Record" }),
                      /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-600 dark:text-slate-400 mb-1", children: language === "ko" ? `이 거래는 ${tradeAge}일 이상 경과했습니다.` : language === "ja" ? `この取引は${tradeAge}日以上経過しています。` : language === "zh" ? `此交易已超过${tradeAge}天。` : `This trade is over ${tradeAge} days old.` }),
                      /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 dark:text-slate-500 max-w-md mt-2", children: language === "ko" ? "비용 최적화를 위해 오래된 거래에는 AI 분석 및 뉴스를 제공하지 않습니다. 기본 거래 정보만 확인하실 수 있습니다." : language === "ja" ? "コスト最適化のため、古い取引にはAI分析とニュースを提供していません。基本的な取引情報のみご確認いただけます。" : language === "zh" ? "为优化成本，旧交易不提供AI分析和新闻。仅可查看基本交易信息。" : "To optimize costs, AI analysis and news are not provided for old trades. Only basic trade information is available." })
                    ] }) : trade.comprehensiveAnalysis || comprehensiveAnalysis ? (
                      // 실제 AI 분석 결과 표시 (통합된 종합의견 포함)
                      (() => {
                        var _a2, _b;
                        const analysis = trade.comprehensiveAnalysis || comprehensiveAnalysis;
                        const sentiment = ((_a2 = analysis.marketContext) == null ? void 0 : _a2.sentiment) || "NEUTRAL";
                        const isBullish = sentiment === "BULLISH";
                        const isBearish = sentiment === "BEARISH";
                        return /* @__PURE__ */ jsxs(Fragment$1, { children: [
                          /* @__PURE__ */ jsxs("div", { className: `mb-4 p-4 rounded-lg border-2 ${isBullish ? "bg-green-50 dark:bg-green-900/20 border-green-500" : isBearish ? "bg-red-50 dark:bg-red-900/20 border-red-500" : "bg-gray-50 dark:bg-gray-900/20 border-gray-500"}`, children: [
                            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
                              /* @__PURE__ */ jsxs("h5", { className: "font-bold text-base flex items-center gap-2", children: [
                                /* @__PURE__ */ jsx(BarChart3, { className: "h-5 w-5" }),
                                t("tradeDetail.aiComprehensiveAnalysis")
                              ] }),
                              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                                /* @__PURE__ */ jsx(Badge, { className: `text-sm px-3 py-1 font-bold ${isBullish ? "bg-green-600 text-white" : isBearish ? "bg-red-600 text-white" : "bg-gray-600 text-white"}`, children: isBullish ? t("tradeDetail.buyRecommendation") : isBearish ? t("tradeDetail.sellRecommendation") : t("tradeDetail.holdRecommendation") }),
                                /* @__PURE__ */ jsxs("div", { className: "text-center px-3 py-2 bg-white dark:bg-slate-800 rounded-lg border", children: [
                                  /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: t("tradeDetail.confidenceLevel") }),
                                  /* @__PURE__ */ jsxs("p", { className: "text-lg font-bold text-blue-600", children: [
                                    analysis.confidence,
                                    "%"
                                  ] })
                                ] })
                              ] })
                            ] }),
                            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground leading-relaxed", children: analysis.executiveSummary })
                          ] }),
                          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 mb-4", children: [
                            /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3", children: [
                              /* @__PURE__ */ jsxs("h6", { className: "font-medium mb-2 flex items-center gap-1", children: [
                                /* @__PURE__ */ jsx(Target, { className: "h-3 w-3" }),
                                t("tradeDetail.targetPriceAnalysis")
                              ] }),
                              /* @__PURE__ */ jsxs("div", { className: "space-y-1 text-xs", children: [
                                /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
                                  /* @__PURE__ */ jsxs("span", { children: [
                                    t("tradeDetail.conservative"),
                                    ":"
                                  ] }),
                                  /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
                                    "$",
                                    analysis.priceTargets.conservative.toFixed(2)
                                  ] })
                                ] }),
                                /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
                                  /* @__PURE__ */ jsxs("span", { children: [
                                    t("tradeDetail.realistic"),
                                    ":"
                                  ] }),
                                  /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
                                    "$",
                                    analysis.priceTargets.realistic.toFixed(2)
                                  ] })
                                ] }),
                                /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
                                  /* @__PURE__ */ jsxs("span", { children: [
                                    t("tradeDetail.optimistic"),
                                    ":"
                                  ] }),
                                  /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
                                    "$",
                                    analysis.priceTargets.optimistic.toFixed(2)
                                  ] })
                                ] })
                              ] })
                            ] }),
                            /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3", children: [
                              /* @__PURE__ */ jsxs("h6", { className: "font-medium mb-2 flex items-center gap-1", children: [
                                /* @__PURE__ */ jsx(Calculator, { className: "h-3 w-3" }),
                                t("tradeDetail.riskAssessment")
                              ] }),
                              /* @__PURE__ */ jsxs("div", { className: "space-y-1 text-xs", children: [
                                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                                  /* @__PURE__ */ jsxs("span", { children: [
                                    t("tradeDetail.riskLevel"),
                                    ":"
                                  ] }),
                                  /* @__PURE__ */ jsx(Badge, { className: `text-xs px-2 py-0.5 ${analysis.riskAssessment.level === "LOW" ? "bg-green-100 text-green-800" : analysis.riskAssessment.level === "MEDIUM" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`, children: analysis.riskAssessment.level })
                                ] }),
                                /* @__PURE__ */ jsx("p", { className: "text-xs", children: analysis.riskAssessment.mitigation })
                              ] })
                            ] })
                          ] }),
                          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700", children: [
                            /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
                              /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mb-1", children: t("tradeDetail.aiConfidence") }),
                              /* @__PURE__ */ jsxs("p", { className: "text-lg font-bold text-green-600 dark:text-green-500", children: [
                                analysis.confidence,
                                "%"
                              ] })
                            ] }),
                            /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
                              /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mb-1", children: t("tradeDetail.analysisTimeHorizon") }),
                              /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: analysis.timeHorizon })
                            ] }),
                            /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
                              /* @__PURE__ */ jsx("p", { className: "text-xs text-blue-600/80 mb-1", children: t("tradeDetail.marketSentiment") }),
                              /* @__PURE__ */ jsx(Badge, { className: `text-xs px-2 py-1 ${analysis.marketContext.sentiment === "BULLISH" ? "bg-green-100 text-green-800" : analysis.marketContext.sentiment === "BEARISH" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"}`, children: t(`tradeDetail.sentiment.${analysis.marketContext.sentiment.toLowerCase()}`) })
                            ] })
                          ] }),
                          ((_b = analysis.catalysts) == null ? void 0 : _b.length) > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-3 p-3 bg-blue-100/50 dark:bg-blue-900/20 rounded-lg border border-blue-200/50", children: [
                            /* @__PURE__ */ jsxs("p", { className: "text-xs font-medium text-blue-700 dark:text-blue-300 mb-1 flex items-center gap-1", children: [
                              /* @__PURE__ */ jsx(Zap, { className: "h-4 w-4" }),
                              t("tradeDetail.keyCatalysts")
                            ] }),
                            /* @__PURE__ */ jsx("ul", { className: "text-xs list-disc list-inside space-y-1", children: analysis.catalysts.map((catalyst, index) => /* @__PURE__ */ jsx("li", { children: catalyst }, index)) })
                          ] }),
                          analysis.newsAnalysis && /* @__PURE__ */ jsxs("div", { className: "mt-4 p-4 bg-gradient-to-r from-green-50 to-red-50 dark:from-green-950/20 dark:to-red-950/20 rounded-lg border border-gray-200 dark:border-gray-700", children: [
                            /* @__PURE__ */ jsxs("h6", { className: "font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2", children: [
                              /* @__PURE__ */ jsx(Newspaper, { className: "h-4 w-4 text-blue-600" }),
                              t("tradeDetail.latestNewsAnalysis"),
                              " (",
                              analysis.newsAnalysis.totalNews,
                              ")"
                            ] }),
                            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-2 mb-4", children: [
                              /* @__PURE__ */ jsxs("div", { className: "text-center p-2 bg-green-100 dark:bg-green-900/30 rounded", children: [
                                /* @__PURE__ */ jsx("div", { className: "text-lg font-bold text-green-700 dark:text-green-300", children: analysis.newsAnalysis.positiveCount }),
                                /* @__PURE__ */ jsx("div", { className: "text-xs text-green-600 dark:text-green-400", children: t("tradeDetail.positive") })
                              ] }),
                              /* @__PURE__ */ jsxs("div", { className: "text-center p-2 bg-red-100 dark:bg-red-900/30 rounded", children: [
                                /* @__PURE__ */ jsx("div", { className: "text-lg font-bold text-red-700 dark:text-red-300", children: analysis.newsAnalysis.negativeCount }),
                                /* @__PURE__ */ jsx("div", { className: "text-xs text-red-600 dark:text-red-400", children: t("tradeDetail.negative") })
                              ] }),
                              /* @__PURE__ */ jsxs("div", { className: "text-center p-2 bg-gray-100 dark:bg-gray-800 rounded", children: [
                                /* @__PURE__ */ jsx("div", { className: "text-lg font-bold text-gray-700 dark:text-gray-300", children: analysis.newsAnalysis.totalNews - analysis.newsAnalysis.positiveCount - analysis.newsAnalysis.negativeCount }),
                                /* @__PURE__ */ jsx("div", { className: "text-xs text-gray-600 dark:text-gray-400", children: t("tradeDetail.neutral") })
                              ] })
                            ] }),
                            analysis.newsAnalysis.majorNews.length > 0 && /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
                              /* @__PURE__ */ jsxs("p", { className: "text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2", children: [
                                /* @__PURE__ */ jsx(Star, { className: "h-4 w-4" }),
                                t("tradeDetail.majorNews")
                              ] }),
                              analysis.newsAnalysis.majorNews.map((news, index) => {
                                const sentimentLower = news.sentiment.toLowerCase();
                                const isPositive = sentimentLower.includes("positive") || sentimentLower.includes("bullish");
                                const isNegative = sentimentLower.includes("negative") || sentimentLower.includes("bearish");
                                const isExpanded = expandedNews.has(index);
                                return /* @__PURE__ */ jsxs(
                                  "div",
                                  {
                                    className: "p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:shadow-md transition-all",
                                    onClick: () => toggleNewsExpansion(index),
                                    children: [
                                      /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
                                        /* @__PURE__ */ jsx("h7", { className: "text-sm font-bold text-gray-800 dark:text-gray-200 flex-1", children: news.title }),
                                        /* @__PURE__ */ jsx(Badge, { className: `ml-2 text-xs px-2 py-1 whitespace-nowrap flex-shrink-0 flex items-center gap-1 ${isPositive ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : isNegative ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"}`, children: isPositive ? /* @__PURE__ */ jsxs(Fragment$1, { children: [
                                          /* @__PURE__ */ jsx(TrendingUp, { className: "h-3 w-3" }),
                                          " ",
                                          t("tradeDetail.positive")
                                        ] }) : isNegative ? /* @__PURE__ */ jsxs(Fragment$1, { children: [
                                          /* @__PURE__ */ jsx(TrendingDown, { className: "h-3 w-3" }),
                                          " ",
                                          t("tradeDetail.negative")
                                        ] }) : /* @__PURE__ */ jsxs(Fragment$1, { children: [
                                          /* @__PURE__ */ jsx(DollarSign, { className: "h-3 w-3" }),
                                          " ",
                                          t("tradeDetail.neutral")
                                        ] }) })
                                      ] }),
                                      isExpanded && /* @__PURE__ */ jsxs("div", { className: "mt-3 pt-3 border-t border-gray-200 dark:border-gray-700", children: [
                                        /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-600 dark:text-gray-400 mb-2 leading-relaxed", children: news.summary }),
                                        /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-400", children: [
                                          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                                            /* @__PURE__ */ jsx(Calendar, { className: "h-4 w-4" }),
                                            /* @__PURE__ */ jsx("span", { className: "font-medium", children: new Date(news.published).toLocaleDateString(
                                              language === "ko" ? "ko-KR" : "en-US",
                                              { year: "numeric", month: "short", day: "numeric" }
                                            ) })
                                          ] }),
                                          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                                            /* @__PURE__ */ jsxs("span", { children: [
                                              t("tradeDetail.relevance"),
                                              ": ",
                                              Math.round(news.relevanceScore * 100),
                                              "%"
                                            ] }),
                                            /* @__PURE__ */ jsx("span", { children: news.source || t("tradeDetail.marketAnalysis") })
                                          ] })
                                        ] })
                                      ] }),
                                      /* @__PURE__ */ jsx("div", { className: "text-center mt-2 text-xs text-gray-400 dark:text-gray-500", children: isExpanded ? t("tradeDetail.clickToCollapse") : t("tradeDetail.clickToExpand") })
                                    ]
                                  },
                                  index
                                );
                              })
                            ] })
                          ] })
                        ] });
                      })()
                    ) : (
                      // AI 분석이 없을 때 기본 메시지
                      /* @__PURE__ */ jsxs("div", { className: "text-center py-4", children: [
                        /* @__PURE__ */ jsx(Loader2, { className: "h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" }),
                        /* @__PURE__ */ jsx("p", { className: "text-sm text-blue-600", children: t("tradeDetail.aiAnalysisInProgress") }),
                        /* @__PURE__ */ jsx("p", { className: "text-xs text-blue-500 mt-1", children: t("tradeDetail.preparingAdvancedAnalysis") })
                      ] })
                    ) })
                  ] })
                ] }) }) })
              ] })
            ]
          }
        ),
        showPWAGuide && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4", children: /* @__PURE__ */ jsxs(Card, { className: "max-w-md w-full", children: [
          /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Bell, { className: "h-5 w-5 text-blue-500" }),
            t("notification.settings.title")
          ] }) }),
          /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4", children: [
              /* @__PURE__ */ jsxs("h4", { className: "font-semibold mb-2 text-blue-900 dark:text-blue-100", children: [
                "📱 ",
                t("pwa.prompt.addToHomeScreen")
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-blue-800 dark:text-blue-200 mb-3", children: t("pwa.notification.requirement").replace("{company}", trade.companyName) }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-3 text-sm", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "font-medium mb-1", children: "iOS (Safari):" }),
                  /* @__PURE__ */ jsxs("ol", { className: "list-decimal list-inside text-xs space-y-1 text-muted-foreground", children: [
                    /* @__PURE__ */ jsx("li", { children: t("pwa.ios.step1") }),
                    /* @__PURE__ */ jsx("li", { children: t("pwa.ios.step2") }),
                    /* @__PURE__ */ jsx("li", { children: t("pwa.ios.step3") })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "font-medium mb-1", children: "Android (Chrome):" }),
                  /* @__PURE__ */ jsxs("ol", { className: "list-decimal list-inside text-xs space-y-1 text-muted-foreground", children: [
                    /* @__PURE__ */ jsx("li", { children: t("pwa.android.step1") }),
                    /* @__PURE__ */ jsx("li", { children: t("pwa.android.step2") }),
                    /* @__PURE__ */ jsx("li", { children: t("pwa.android.step3") })
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3", children: /* @__PURE__ */ jsx("p", { className: "text-sm text-green-800 dark:text-green-200", dangerouslySetInnerHTML: {
              __html: "✓ " + t("pwa.afterInstall").replace("{ticker}", trade.ticker)
            } }) }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsx(
                Button,
                {
                  variant: "outline",
                  onClick: () => setShowPWAGuide(false),
                  className: "flex-1",
                  children: t("general.close")
                }
              ),
              /* @__PURE__ */ jsx(
                Button,
                {
                  onClick: () => setShowPWAGuide(false),
                  className: "flex-1",
                  children: t("pwa.button.understood")
                }
              )
            ] })
          ] })
        ] }) })
      ]
    }
  );
}
function useWebSocket(url) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const ws = useRef(null);
  const reconnectTimeout = useRef(null);
  const heartbeatInterval = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = Infinity;
  const startHeartbeat = () => {
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
    }
    heartbeatInterval.current = setInterval(() => {
      var _a;
      if (((_a = ws.current) == null ? void 0 : _a.readyState) === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: "PING" }));
        console.log("💓 Heartbeat PING sent");
      }
    }, 2 * 60 * 1e3);
  };
  const connect = () => {
    try {
      ws.current = new WebSocket(url);
      ws.current.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);
        reconnectAttempts.current = 0;
        startHeartbeat();
      };
      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === "PONG") {
            console.log("💓 Heartbeat PONG received");
            return;
          }
          setLastMessage(message);
          console.log("WebSocket message received:", message.type);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };
      ws.current.onclose = () => {
        console.log("WebSocket disconnected");
        setIsConnected(false);
        if (heartbeatInterval.current) {
          clearInterval(heartbeatInterval.current);
          heartbeatInterval.current = null;
        }
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const delay = Math.min(1e4 * Math.pow(2, reconnectAttempts.current), 12e4);
          reconnectTimeout.current = setTimeout(() => {
            console.log(`Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})...`);
            connect();
          }, delay);
        }
      };
      ws.current.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
    }
  };
  const sendMessage = (message) => {
    var _a;
    if (((_a = ws.current) == null ? void 0 : _a.readyState) === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket is not connected");
    }
  };
  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [url]);
  return {
    isConnected,
    lastMessage,
    sendMessage
  };
}
function getWebSocketUrl() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  if (window.location.host && !window.location.host.includes("undefined")) {
    return `${protocol}//${window.location.host}/api/ws`;
  }
  let host = window.location.hostname || "localhost";
  let port = window.location.port;
  if (!port || port === "undefined") {
    port = "5000";
  }
  if (port && port !== "80" && port !== "443") {
    host = `${host}:${port}`;
  }
  return `${protocol}//${host}/api/ws`;
}
class DataValidator {
  constructor(config = {
    maxAgeMinutes: 43200,
    // 30일 이내 데이터 허용 (30 * 24 * 60 = 43200분)
    requiredFields: ["id", "accessionNumber", "filedDate", "ticker", "companyName"],
    allowedSources: ["SEC", "OpenInsider", "EdgarAPI"]
  }) {
    this.config = config;
  }
  /**
   * 거래 데이터 검증
   */
  validateTrade(trade) {
    const issues = [];
    const now = Date.now();
    for (const field of this.config.requiredFields) {
      if (!trade[field]) {
        issues.push(`Missing required field: ${field}`);
      }
    }
    const isReal = true;
    const filedDate = trade.filedDate ? new Date(trade.filedDate).getTime() : 0;
    const dataAge = now - filedDate;
    const maxAge = this.config.maxAgeMinutes * 60 * 1e3;
    const isFresh = dataAge <= maxAge;
    const source = this.determineDataSource(trade);
    return {
      isValid: issues.length === 0,
      isReal,
      isFresh,
      issues,
      dataAge,
      source
    };
  }
  /**
   * 가짜 데이터 패턴 감지
   */
  validateRealData(trade) {
    const fakePatterns = [
      // 가짜 이름 패턴
      /test|sample|fake|mock|dummy|example/i,
      // 가짜 회사명 패턴
      /test\s*(corp|company|inc)/i,
      // 시뮬레이션 데이터 패턴
      /simulation|demo/i
    ];
    const textFields = [
      trade.traderName,
      trade.companyName,
      trade.traderTitle,
      trade.verificationNotes
    ].filter(Boolean);
    for (const text of textFields) {
      for (const pattern of fakePatterns) {
        if (pattern.test(text || "")) {
          console.warn(`🚨 Fake data pattern detected in "${text}"`);
          return false;
        }
      }
    }
    if (trade.accessionNumber && !this.validateSecAccessionNumber(trade.accessionNumber)) {
      console.warn(`🚨 Invalid SEC accession number format: ${trade.accessionNumber}`);
      return false;
    }
    return true;
  }
  /**
   * SEC 번호 형식 검증 - 실제 데이터 소스들의 다양한 형식 지원
   * MarketBeat, OpenInsider 등 실제 거래 데이터 플랫폼들의 형식 포함
   */
  validateSecAccessionNumber(accessionNumber) {
    const secPattern = /^\d{10}-\d{2}-\d{6}$/;
    const marketBeatPattern = /^marketbeat-[A-Z]+(-[a-f0-9]+)?$/i;
    const openInsiderPattern = /^openinsider-[A-Z]+(-[a-f0-9]+)?$/i;
    const realDataPatterns = [
      secPattern,
      marketBeatPattern,
      openInsiderPattern
    ];
    return realDataPatterns.some((pattern) => pattern.test(accessionNumber));
  }
  /**
   * 데이터 소스 판별
   */
  determineDataSource(trade) {
    var _a;
    if ((_a = trade.secFilingUrl) == null ? void 0 : _a.includes("sec.gov")) {
      return "api";
    }
    if (trade.id && trade.createdAt) {
      return "database";
    }
    return "unknown";
  }
  /**
   * 거래 목록 일괄 검증
   */
  validateTrades(trades) {
    const validTrades = [];
    const invalidTrades = [];
    const allIssues = [];
    let realCount = 0;
    let freshCount = 0;
    const safeTrades = trades.filter((trade) => trade != null);
    for (const trade of safeTrades) {
      try {
        const validation = this.validateTrade(trade);
        if (validation.isValid && validation.isReal) {
          validTrades.push(trade);
        } else {
          invalidTrades.push(trade);
          allIssues.push(...validation.issues);
        }
        if (validation.isReal) realCount++;
        if (validation.isFresh) freshCount++;
      } catch (error) {
        console.error("Error validating trade:", error, trade);
        invalidTrades.push(trade);
        allIssues.push(`Trade validation error: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }
    return {
      validTrades,
      invalidTrades,
      summary: {
        total: trades.length,
        valid: validTrades.length,
        real: realCount,
        fresh: freshCount,
        issues: [...new Set(allIssues)]
        // 중복 제거
      }
    };
  }
}
class DataFreshnessMonitor {
  constructor() {
    this.lastDataCheck = 0;
    this.dataWarnings = [];
  }
  /**
   * 데이터가 충분히 신선한지 확인
   */
  checkDataFreshness(trades) {
    if (trades.length === 0) {
      return {
        isFresh: false,
        warnings: ["No trades available"],
        lastTradeAge: 0,
        oldestTradeAge: 0
      };
    }
    const now = Date.now();
    const warnings = [];
    const tradeDates = trades.map((t) => new Date(t.filedDate || t.createdAt || "").getTime()).filter((d) => d > 0).sort((a, b) => b - a);
    const lastTradeAge = now - tradeDates[0];
    const oldestTradeAge = now - tradeDates[tradeDates.length - 1];
    const dayInMs = 24 * 60 * 60 * 1e3;
    if (lastTradeAge > dayInMs) {
      warnings.push(`Last trade is ${Math.round(lastTradeAge / dayInMs)} days old`);
    }
    const weekInMs = 7 * dayInMs;
    if (oldestTradeAge > weekInMs) {
      warnings.push(`Oldest trade is ${Math.round(oldestTradeAge / weekInMs)} weeks old`);
    }
    this.dataWarnings = warnings;
    return {
      isFresh: warnings.length === 0,
      warnings,
      lastTradeAge,
      oldestTradeAge
    };
  }
  /**
   * 현재 데이터 상태 요약
   */
  getDataStatus() {
    return {
      lastCheck: new Date(this.lastDataCheck),
      warnings: this.dataWarnings,
      status: this.dataWarnings.length === 0 ? "fresh" : "stale"
    };
  }
}
const dataValidator = new DataValidator();
const dataFreshnessMonitor = new DataFreshnessMonitor();
function Dashboard() {
  var _a, _b;
  const { t } = useLanguage();
  const queryClient2 = useQueryClient();
  const [currentOffset, setCurrentOffset] = useState(0);
  const [allTrades, setAllTrades] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [dateRange, setDateRange] = useState({});
  const [sortBy, setSortBy] = useState("filedDate");
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [watchlist, setWatchlist] = useState([]);
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: queryKeys.stats,
    queryFn: apiClient.getTradingStats,
    staleTime: 5 * 60 * 1e3
    // 5 minutes
  });
  const { data: rawTrades, isLoading: tradesLoading, refetch: refetchTrades, error: tradesError } = useQuery({
    queryKey: queryKeys.trades.list({
      limit: 100,
      // Increased for Top Stocks calculation
      offset: 0,
      from: (_a = dateRange.fromDate) == null ? void 0 : _a.toISOString().split("T")[0],
      to: (_b = dateRange.toDate) == null ? void 0 : _b.toISOString().split("T")[0],
      sortBy
    }),
    queryFn: () => apiClient.getInsiderTrades(100, 0, dateRange.fromDate, dateRange.toDate, sortBy),
    staleTime: 1 * 60 * 1e3
    // 1 minute for more frequent updates
  });
  const validatedData = useMemo(() => {
    if (!rawTrades) return { trades: [], isValid: true, issues: [] };
    console.log("🔍 Dashboard: Validating trades data...");
    const validation = dataValidator.validateTrades(rawTrades);
    const freshness = dataFreshnessMonitor.checkDataFreshness(validation.validTrades);
    if (validation.invalidTrades.length > 0) {
      console.warn(`🚨 Dashboard: Filtered out ${validation.invalidTrades.length} invalid/fake trades`);
    }
    return {
      trades: validation.validTrades,
      isValid: validation.summary.valid > 0,
      issues: [...validation.summary.issues, ...freshness.warnings],
      validCount: validation.summary.valid,
      totalCount: validation.summary.total
    };
  }, [rawTrades]);
  const trades = validatedData.trades;
  const wsUrl = getWebSocketUrl();
  const { isConnected, lastMessage, sendMessage } = useWebSocket(wsUrl);
  useEffect(() => {
    if (!lastMessage) return;
    switch (lastMessage.type) {
      case "WELCOME":
        console.log("Connected to InsiderTrack Pro live feed");
        sendMessage({ type: "SUBSCRIBE_TRADES" });
        break;
      case "NEW_TRADE":
        console.log("New trade received via WebSocket:", lastMessage.data);
        setTimeout(() => {
          queryClient2.invalidateQueries({ queryKey: queryKeys.stats });
          queryClient2.invalidateQueries({ queryKey: queryKeys.trades.all });
        }, 1e3);
        break;
      case "SUBSCRIBED":
        console.log("Subscribed to", lastMessage.channel);
        break;
      default:
        console.log("Unknown WebSocket message:", lastMessage.type);
    }
  }, [lastMessage, sendMessage, queryClient2]);
  useEffect(() => {
    if (trades && currentOffset === 0) {
      setAllTrades(trades);
      setHasMoreData(trades.length >= 20);
    }
  }, [trades, currentOffset]);
  const handleLoadMore = async () => {
    console.log("Load more clicked");
    console.log("Loading more trades...");
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      const newOffset = currentOffset + 20;
      const rawMoreTrades = await apiClient.getInsiderTrades(20, newOffset, dateRange.fromDate, dateRange.toDate, sortBy);
      const validation = dataValidator.validateTrades(rawMoreTrades);
      const validMoreTrades = validation.validTrades;
      if (validation.invalidTrades.length > 0) {
        console.warn(`🚨 Dashboard: Filtered out ${validation.invalidTrades.length} invalid trades from load more`);
      }
      if (validMoreTrades.length === 0) {
        setHasMoreData(false);
      } else {
        setAllTrades((prev) => [...prev, ...validMoreTrades]);
        setCurrentOffset(newOffset);
        if (validMoreTrades.length < 20) {
          setHasMoreData(false);
        }
      }
    } catch (error) {
      console.error("Failed to load more trades:", error);
      alert(t("dashboard.loadMoreTradesError"));
    } finally {
      setLoadingMore(false);
    }
  };
  const handleDateRangeChange = (fromDate, toDate) => {
    setDateRange({ fromDate, toDate });
    setCurrentOffset(0);
    setAllTrades([]);
    setHasMoreData(true);
  };
  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
    setCurrentOffset(0);
    setAllTrades([]);
    setHasMoreData(true);
  };
  useEffect(() => {
    try {
      const saved = localStorage.getItem("watchlist");
      if (saved) {
        const items = JSON.parse(saved);
        setWatchlist(items.map((item) => item.ticker));
      }
    } catch (error) {
      console.error("Failed to load watchlist:", error);
    }
  }, []);
  const handleTradeClick = (trade) => {
    setSelectedTrade(trade);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTrade(null);
  };
  const handleAddToWatchlist = (trade) => {
    try {
      const saved = localStorage.getItem("watchlist");
      const existing = saved ? JSON.parse(saved) : [];
      const alreadyExists = existing.some((item) => item.ticker === trade.ticker);
      let updated;
      if (alreadyExists) {
        updated = existing.filter((item) => item.ticker !== trade.ticker);
        setWatchlist(updated.map((item) => item.ticker));
      } else {
        const newItem = {
          ticker: trade.ticker,
          companyName: trade.companyName,
          addedAt: (/* @__PURE__ */ new Date()).toISOString(),
          notificationsEnabled: true
        };
        updated = [...existing, newItem];
        setWatchlist(updated.map((item) => item.ticker));
      }
      localStorage.setItem("watchlist", JSON.stringify(updated));
      window.dispatchEvent(new Event("watchlistUpdate"));
    } catch (error) {
      console.error("Failed to toggle watchlist:", error);
    }
  };
  const tradesData = allTrades.length > 0 ? allTrades : trades;
  const topStocks = useMemo(() => {
    console.log("🔍 Top Stocks - Using", trades.length, "trades for calculation");
    if (!trades || trades.length === 0) {
      console.log("❌ Top Stocks - No data available");
      return [];
    }
    const stockGroups = trades.reduce((acc, trade) => {
      const key = trade.tickerSymbol;
      if (!acc[key]) {
        acc[key] = {
          symbol: trade.tickerSymbol,
          companyName: trade.companyName,
          trades: []
        };
      }
      acc[key].trades.push(trade);
      return acc;
    }, {});
    const topStocksResult = Object.values(stockGroups).sort((a, b) => b.trades.length - a.trades.length).slice(0, 3);
    console.log("✅ Top Stocks calculated:", topStocksResult.map((s) => `${s.symbol} (${s.trades.length} trades)`));
    return topStocksResult;
  }, [trades]);
  return /* @__PURE__ */ jsx("div", { className: "w-full max-w-full overflow-x-hidden", children: /* @__PURE__ */ jsxs("div", { className: "space-y-3 sm:space-y-6 p-3 sm:p-6", "data-testid": "dashboard", children: [
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
      /* @__PURE__ */ jsx(Alert, { className: isConnected ? "border-chart-2/50 bg-chart-2/10" : "border-destructive/50 bg-destructive/10", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        isConnected ? /* @__PURE__ */ jsx(Wifi, { className: "h-4 w-4 text-chart-2" }) : /* @__PURE__ */ jsx(WifiOff, { className: "h-4 w-4 text-destructive" }),
        /* @__PURE__ */ jsx(AlertDescription, { className: isConnected ? "text-chart-2" : "text-destructive", children: isConnected ? t("connection.liveFeedActive") : t("connection.connectionLost") })
      ] }) }),
      /* @__PURE__ */ jsx(Alert, { className: validatedData.isValid ? "border-blue-500/50 bg-blue-50" : "border-yellow-500/50 bg-yellow-50", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        validatedData.isValid ? /* @__PURE__ */ jsx(Shield, { className: "h-4 w-4 text-blue-600" }) : /* @__PURE__ */ jsx(AlertTriangle, { className: "h-4 w-4 text-yellow-600" }),
        /* @__PURE__ */ jsxs(AlertDescription, { className: validatedData.isValid ? "text-blue-700" : "text-yellow-700", children: [
          t("liveTrading.validatedData"),
          ": ",
          validatedData.validCount || 0,
          "/",
          validatedData.totalCount || 0,
          t("liveTrading.count")
        ] })
      ] }) })
    ] }),
    validatedData.issues && validatedData.issues.length > 0 && /* @__PURE__ */ jsxs(Alert, { className: "border-yellow-500/50 bg-yellow-50", children: [
      /* @__PURE__ */ jsx(AlertTriangle, { className: "h-4 w-4 text-yellow-600" }),
      /* @__PURE__ */ jsxs(AlertDescription, { className: "text-yellow-700", children: [
        /* @__PURE__ */ jsx("div", { className: "font-semibold mb-1", children: "데이터 품질 주의사항:" }),
        /* @__PURE__ */ jsxs("ul", { className: "list-disc list-inside text-sm space-y-1", children: [
          validatedData.issues.slice(0, 3).map((issue, index) => /* @__PURE__ */ jsx("li", { children: issue }, index)),
          validatedData.issues.length > 3 && /* @__PURE__ */ jsxs("li", { className: "text-xs text-yellow-600", children: [
            "그 외 ",
            validatedData.issues.length - 3,
            "개 문제"
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", "data-testid": "page-title", children: t("nav.dashboard") }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: t("page.dashboard.subtitle") })
    ] }),
    statsLoading ? /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: [...Array(4)].map((_, i) => /* @__PURE__ */ jsx("div", { className: "h-32 bg-muted/50 rounded-md animate-pulse" }, i)) }) : stats ? /* @__PURE__ */ jsx(DashboardStats, { stats }) : /* @__PURE__ */ jsxs(Alert, { className: "border-destructive/50 bg-destructive/10", children: [
      /* @__PURE__ */ jsx(AlertCircle, { className: "h-4 w-4 text-destructive" }),
      /* @__PURE__ */ jsxs(AlertDescription, { className: "text-destructive", children: [
        t("stats.failedLoad"),
        " ",
        statsError ? `Error: ${statsError.message}` : ""
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [
      /* @__PURE__ */ jsx(Card, { className: "lg:col-span-2", children: tradesLoading ? /* @__PURE__ */ jsx("div", { className: "p-6", children: /* @__PURE__ */ jsx("div", { className: "space-y-4", children: [...Array(5)].map((_, i) => /* @__PURE__ */ jsx("div", { className: "h-24 bg-muted/50 rounded-md animate-pulse" }, i)) }) }) : /* @__PURE__ */ jsx(
        TradeList,
        {
          trades: tradesData,
          loading: false,
          loadingMore,
          hasMoreData,
          onLoadMore: handleLoadMore,
          onDateRangeChange: handleDateRangeChange,
          onSortChange: handleSortChange,
          onViewDetails: handleTradeClick
        }
      ) }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs(Card, { "data-testid": "trading-summary", children: [
          /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { className: "text-base flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(AlertCircle, { className: "h-4 w-4 text-primary" }),
            t("stats.tradingSummary")
          ] }) }),
          /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "p-3 bg-chart-2/10 rounded-md border border-chart-2/20", children: [
              /* @__PURE__ */ jsx("div", { className: "text-sm font-medium text-chart-2 mb-1", children: t("dashboardStats.recentActivity") }),
              /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: t("dashboardStats.monitoring") })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-3 bg-chart-3/10 rounded-md border border-chart-3/20", children: [
              /* @__PURE__ */ jsx("div", { className: "text-sm font-medium text-chart-3 mb-1", children: t("dashboardStats.marketCoverage") }),
              /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: t("dashboardStats.realTimeAnalysis") })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(Card, { "data-testid": "top-stocks", children: [
          /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: t("dashboardStats.topStocks") }) }),
          /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("div", { className: "space-y-4", children: topStocks.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground text-center py-4", children: t("dashboardStats.noData") }) : topStocks.map((stock) => /* @__PURE__ */ jsxs("div", { className: "border border-slate-200 dark:border-slate-700 rounded-lg p-3 space-y-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("div", { className: "font-mono text-sm font-semibold", children: stock.symbol }),
                /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground truncate max-w-[180px]", children: stock.companyName })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-xs font-medium text-slate-600 dark:text-slate-400", children: [
                stock.trades.length,
                " ",
                t("dashboardStats.trades")
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              stock.trades.slice(0, 3).map((trade, idx) => {
                var _a2, _b2;
                return /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 dark:bg-slate-900 rounded p-2 space-y-1", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-2", children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                      /* @__PURE__ */ jsx("div", { className: "text-xs font-medium truncate", children: trade.insiderName }),
                      /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground truncate", children: trade.insiderPosition })
                    ] }),
                    /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground whitespace-nowrap", children: new Date(trade.filedDate).toLocaleDateString(t("locale"), { month: "short", day: "numeric" }) })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-2 text-xs", children: [
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("div", { className: "text-muted-foreground", children: t("dashboardStats.shares") }),
                      /* @__PURE__ */ jsx("div", { className: "font-medium", children: ((_a2 = trade.shares) == null ? void 0 : _a2.toLocaleString()) || "N/A" })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("div", { className: "text-muted-foreground", children: t("dashboardStats.price") }),
                      /* @__PURE__ */ jsxs("div", { className: "font-medium", children: [
                        "$",
                        ((_b2 = trade.price) == null ? void 0 : _b2.toFixed(2)) || "N/A"
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("div", { className: "text-muted-foreground", children: t("dashboardStats.total") }),
                      /* @__PURE__ */ jsxs("div", { className: "font-medium text-amber-600 dark:text-amber-500", children: [
                        "$",
                        ((trade.shares || 0) * (trade.price || 0)).toLocaleString(void 0, { maximumFractionDigits: 0 })
                      ] })
                    ] })
                  ] })
                ] }, idx);
              }),
              stock.trades.length > 3 && /* @__PURE__ */ jsxs("div", { className: "text-xs text-center text-muted-foreground pt-1", children: [
                "+",
                stock.trades.length - 3,
                " ",
                t("dashboardStats.moreTrades")
              ] })
            ] })
          ] }, stock.symbol)) }) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(
      TradeDetailModal,
      {
        isOpen: isModalOpen,
        onClose: handleCloseModal,
        trade: selectedTrade,
        onAddToWatchlist: handleAddToWatchlist,
        isInWatchlist: (selectedTrade == null ? void 0 : selectedTrade.tickerSymbol) ? watchlist.includes(selectedTrade.tickerSymbol) : false,
        "data-testid": "trade-detail-modal"
      }
    )
  ] }) });
}
const Switch = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SwitchPrimitives.Root,
  {
    className: cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      className
    ),
    ...props,
    ref,
    children: /* @__PURE__ */ jsx(
      SwitchPrimitives.Thumb,
      {
        className: cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
        )
      }
    )
  }
));
Switch.displayName = SwitchPrimitives.Root.displayName;
function usePushNotifications() {
  const [state, setState] = useState({
    isSupported: false,
    isSubscribed: false,
    subscription: null,
    isLoading: true,
    error: null
  });
  useEffect(() => {
    checkPushSupport();
  }, []);
  const checkPushSupport = async () => {
    try {
      const isSupported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
      if (!isSupported) {
        setState((prev) => ({
          ...prev,
          isSupported: false,
          isLoading: false,
          error: "Push notifications are not supported"
        }));
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setState((prev) => ({
        ...prev,
        isSupported: true,
        isSubscribed: !!subscription,
        subscription,
        isLoading: false
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to check push support"
      }));
    }
  };
  const requestPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  };
  const subscribe = async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      if (Notification.permission !== "granted") {
        const granted = await requestPermission();
        if (!granted) {
          throw new Error("Notification permission denied");
        }
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          // This is a placeholder VAPID key - you should generate your own
          // Use: npx web-push generate-vapid-keys
          "BEl62iUYgUivxIkv69yViEuiBIa-Ib37J8fbKR2F7T-4jlJHqSV3J9Syk9RCW7M3mjCW2s3T5yO3x9hqXTQd5F4"
        )
      });
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(subscription)
      });
      setState((prev) => ({
        ...prev,
        isSubscribed: true,
        subscription,
        isLoading: false
      }));
      return subscription;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to subscribe"
      }));
      return null;
    }
  };
  const unsubscribe = async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(subscription)
        });
        await subscription.unsubscribe();
      }
      setState((prev) => ({
        ...prev,
        isSubscribed: false,
        subscription: null,
        isLoading: false
      }));
      return true;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to unsubscribe"
      }));
      return false;
    }
  };
  return {
    ...state,
    subscribe,
    unsubscribe,
    requestPermission
  };
}
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
function RefreshAccountButton({
  variant = "outline",
  size = "default",
  className = "",
  showIcon = true
}) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { refreshUser, user } = useAuth();
  const { toast: toast2 } = useToast();
  const handleRefresh = async () => {
    setIsRefreshing(true);
    console.log("🔄 User clicked refresh account button");
    try {
      const success = await refreshUser();
      if (success) {
        console.log("✅ Account data refreshed successfully");
        toast2({
          title: "Account Refreshed",
          description: `Subscription: ${(user == null ? void 0 : user.subscriptionTier) || "free"} (${(user == null ? void 0 : user.subscriptionStatus) || "inactive"})`
        });
      } else {
        console.log("❌ Failed to refresh account data");
        toast2({
          title: "Refresh Failed",
          description: "Could not refresh account data. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("❌ Error refreshing account:", error);
      toast2({
        title: "Error",
        description: "An error occurred while refreshing your account.",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };
  return /* @__PURE__ */ jsxs(
    Button,
    {
      variant,
      size,
      className,
      onClick: handleRefresh,
      disabled: isRefreshing,
      children: [
        showIcon && /* @__PURE__ */ jsx(RefreshCw, { className: `h-4 w-4 ${isRefreshing ? "animate-spin" : ""} ${size === "sm" ? "mr-1" : "mr-2"}` }),
        isRefreshing ? "Refreshing..." : "Refresh Account"
      ]
    }
  );
}
function Settings() {
  const { language, setLanguage, t } = useLanguage();
  const [theme, setTheme] = useState("system");
  const { toast: toast2 } = useToast();
  const { user, refreshUser } = useAuth();
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [isRedeemingCoupon, setIsRedeemingCoupon] = useState(false);
  const {
    isSupported,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe
  } = usePushNotifications();
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "system";
    setTheme(savedTheme);
  }, []);
  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    const isDark = newTheme === "dark" || newTheme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };
  const languageOptions2 = [
    { value: "en", label: t("settings.language.english"), flag: "🇺🇸" },
    { value: "ko", label: t("settings.language.korean"), flag: "🇰🇷" },
    { value: "ja", label: t("settings.language.japanese"), flag: "🇯🇵" },
    { value: "zh", label: t("settings.language.chinese"), flag: "🇨🇳" }
  ];
  const themeOptions = [
    { value: "light", label: t("settings.theme.light"), icon: Sun },
    { value: "dark", label: t("settings.theme.dark"), icon: Moon },
    { value: "system", label: t("settings.theme.system"), icon: Monitor }
  ];
  const handleNotificationToggle = async (enabled) => {
    if (enabled) {
      const subscription = await subscribe();
      if (subscription) {
        toast2({
          title: t("notification.permission.title"),
          description: t("notification.settings.enabled")
        });
      } else {
        toast2({
          title: "Error",
          description: "Failed to enable notifications",
          variant: "destructive"
        });
      }
    } else {
      const success = await unsubscribe();
      if (success) {
        toast2({
          title: t("notification.permission.title"),
          description: t("notification.settings.disabled")
        });
      }
    }
  };
  const handleManageSubscription = async () => {
    setIsLoadingPortal(true);
    try {
      const response = await apiRequest("POST", "/api/create-portal-session", {});
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No portal URL received");
      }
    } catch (error) {
      console.error("Error creating portal session:", error);
      toast2({
        title: "오류",
        description: error.message || "구독 관리 페이지를 열 수 없습니다.",
        variant: "destructive"
      });
      setIsLoadingPortal(false);
    }
  };
  const handleRedeemCoupon = async () => {
    if (!couponCode.trim()) {
      toast2({
        title: "쿠폰 코드 입력",
        description: "쿠폰 코드를 입력해주세요.",
        variant: "destructive"
      });
      return;
    }
    setIsRedeemingCoupon(true);
    try {
      const response = await apiRequest("POST", "/api/coupon/redeem", {
        couponCode: couponCode.trim()
      });
      const data = await response.json();
      if (data.success) {
        toast2({
          title: "쿠폰 적용 성공!",
          description: data.message
        });
        setCouponCode("");
        await refreshUser();
      } else {
        toast2({
          title: "쿠폰 적용 실패",
          description: data.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error redeeming coupon:", error);
      toast2({
        title: "오류",
        description: "쿠폰 적용 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsRedeemingCoupon(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "p-6 max-w-4xl mx-auto space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold tracking-tight", "data-testid": "text-settings-title", children: t("settings.title") }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: t("settings.description") })
    ] }),
    /* @__PURE__ */ jsx(Separator, {}),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Languages, { className: "h-5 w-5" }),
        t("settings.language")
      ] }) }),
      /* @__PURE__ */ jsx(CardContent, { className: "space-y-4", children: /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "language-select", children: t("placeholder.preferredLanguage") }),
        /* @__PURE__ */ jsxs(Select, { value: language, onValueChange: (value) => setLanguage(value), children: [
          /* @__PURE__ */ jsx(SelectTrigger, { id: "language-select", "data-testid": "select-language", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsx(SelectContent, { children: languageOptions2.map((option) => /* @__PURE__ */ jsx(SelectItem, { value: option.value, "data-testid": `option-language-${option.value}`, children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("span", { children: option.flag }),
            /* @__PURE__ */ jsx("span", { children: option.label })
          ] }) }, option.value)) })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Palette, { className: "h-5 w-5" }),
        t("settings.theme")
      ] }) }),
      /* @__PURE__ */ jsx(CardContent, { className: "space-y-4", children: /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "theme-select", children: t("settings.themeDescription") }),
        /* @__PURE__ */ jsxs(Select, { value: theme, onValueChange: handleThemeChange, children: [
          /* @__PURE__ */ jsx(SelectTrigger, { id: "theme-select", "data-testid": "select-theme", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsx(SelectContent, { children: themeOptions.map((option) => {
            const IconComponent = option.icon;
            return /* @__PURE__ */ jsx(SelectItem, { value: option.value, "data-testid": `option-theme-${option.value}`, children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(IconComponent, { className: "h-4 w-4" }),
              /* @__PURE__ */ jsx("span", { children: option.label })
            ] }) }, option.value);
          }) })
        ] })
      ] }) })
    ] }),
    user && user.stripeCustomerId && /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(CreditCard, { className: "h-5 w-5" }),
        "Subscription Management"
      ] }) }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
        /* @__PURE__ */ jsx("div", { className: "space-y-2", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-0.5", children: [
            /* @__PURE__ */ jsx(Label, { children: "Current Plan" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: user.subscriptionTier === "insider_pro" ? "Insider Pro" : "Free Plan" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
            /* @__PURE__ */ jsx("p", { className: `text-sm font-medium ${user.subscriptionStatus === "active" ? "text-green-600 dark:text-green-400" : user.subscriptionStatus === "canceled" ? "text-orange-600 dark:text-orange-400" : "text-slate-600 dark:text-slate-400"}`, children: user.subscriptionStatus === "active" ? "✓ Active" : user.subscriptionStatus === "canceled" ? "⚠ Cancelled" : user.subscriptionStatus === "trialing" ? "🎁 Trial" : "Inactive" }),
            user.subscriptionEndDate && /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
              user.subscriptionStatus === "canceled" ? "Access until: " : "Renews: ",
              new Date(user.subscriptionEndDate).toLocaleDateString()
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx(Separator, {}),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Manage your subscription, update payment methods, view invoices, or cancel your subscription through our secure payment portal." }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-2", children: [
            /* @__PURE__ */ jsx(
              Button,
              {
                onClick: handleManageSubscription,
                disabled: isLoadingPortal,
                className: "w-full",
                variant: "outline",
                children: isLoadingPortal ? /* @__PURE__ */ jsxs(Fragment$1, { children: [
                  /* @__PURE__ */ jsx("div", { className: "animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" }),
                  "Loading..."
                ] }) : /* @__PURE__ */ jsxs(Fragment$1, { children: [
                  /* @__PURE__ */ jsx(ExternalLink, { className: "w-4 h-4 mr-2" }),
                  "Manage Subscription"
                ] })
              }
            ),
            /* @__PURE__ */ jsx(RefreshAccountButton, { className: "w-full" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground text-center", children: `💡 Click "Refresh Account" if your subscription status doesn't update automatically` })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-blue-50 dark:bg-blue-950 p-3 text-sm", children: /* @__PURE__ */ jsx("p", { className: "text-blue-900 dark:text-blue-100 text-xs", children: "💡 Tip: If you cancel your subscription, you'll keep access until the end of your billing period." }) })
      ] })
    ] }),
    user && user.subscriptionStatus === "trialing" && /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Ticket, { className: "h-5 w-5" }),
        "쿠폰 등록"
      ] }) }),
      /* @__PURE__ */ jsx(CardContent, { className: "space-y-4", children: user.usedCoupons && user.usedCoupons.length > 0 ? (
        // User has already used a coupon
        /* @__PURE__ */ jsxs(Fragment$1, { children: [
          /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-amber-50 dark:bg-amber-950 p-4 border border-amber-200 dark:border-amber-800", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
            /* @__PURE__ */ jsx(CheckCircle2, { className: "h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-amber-900 dark:text-amber-100", children: "쿠폰 사용 완료" }),
              /* @__PURE__ */ jsxs("p", { className: "text-xs text-amber-800 dark:text-amber-200", children: [
                "계정당 1개의 쿠폰만 사용 가능합니다. 이미 ",
                /* @__PURE__ */ jsx("strong", { children: user.usedCoupons[0] }),
                " 쿠폰을 사용하셨습니다."
              ] })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-sm font-medium", children: "사용한 쿠폰" }),
            /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: user.usedCoupons.map((code) => /* @__PURE__ */ jsxs(
              "div",
              {
                className: "inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs font-medium",
                children: [
                  /* @__PURE__ */ jsx(CheckCircle2, { className: "h-3 w-3" }),
                  code
                ]
              },
              code
            )) }),
            user.couponExtensionDays && /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
              "💡 무료체험 기간 ",
              user.couponExtensionDays,
              "일 연장됨"
            ] })
          ] })
        ] })
      ) : (
        // User has not used any coupon yet
        /* @__PURE__ */ jsxs(Fragment$1, { children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "coupon-code", children: "쿠폰 코드" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "쿠폰 코드를 입력하면 무료체험 기간이 3일 연장됩니다" }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsx(
                Input,
                {
                  id: "coupon-code",
                  placeholder: "쿠폰 코드 입력",
                  value: couponCode,
                  onChange: (e) => setCouponCode(e.target.value),
                  onKeyDown: (e) => {
                    if (e.key === "Enter") {
                      handleRedeemCoupon();
                    }
                  },
                  disabled: isRedeemingCoupon,
                  className: "flex-1"
                }
              ),
              /* @__PURE__ */ jsx(
                Button,
                {
                  onClick: handleRedeemCoupon,
                  disabled: isRedeemingCoupon || !couponCode.trim(),
                  children: isRedeemingCoupon ? /* @__PURE__ */ jsxs(Fragment$1, { children: [
                    /* @__PURE__ */ jsx("div", { className: "animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" }),
                    "적용 중..."
                  ] }) : "적용"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-blue-50 dark:bg-blue-950 p-3", children: /* @__PURE__ */ jsx("p", { className: "text-blue-900 dark:text-blue-100 text-xs", children: "💡 Tip: 계정당 1개의 쿠폰만 사용 가능합니다. 신중하게 선택하세요!" }) })
        ] })
      ) })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Bell, { className: "h-5 w-5" }),
        t("notification.settings.title")
      ] }) }),
      /* @__PURE__ */ jsx(CardContent, { className: "space-y-4", children: !isSupported ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: [
        /* @__PURE__ */ jsx(BellOff, { className: "h-4 w-4" }),
        /* @__PURE__ */ jsx("span", { children: "Push notifications are not supported on this device" })
      ] }) : /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-0.5", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "notifications-toggle", children: t("notification.permission.title") }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: t("notification.permission.description") })
          ] }),
          /* @__PURE__ */ jsx(
            Switch,
            {
              id: "notifications-toggle",
              checked: isSubscribed,
              onCheckedChange: handleNotificationToggle,
              disabled: isLoading
            }
          )
        ] }),
        /* @__PURE__ */ jsx(Separator, {}),
        /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-sm font-medium", children: "Notification Types" }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-0.5", children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: t("notification.type.trade") }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Get notified of large insider trades" })
            ] }),
            /* @__PURE__ */ jsx(
              Switch,
              {
                disabled: !isSubscribed,
                defaultChecked: true
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-0.5", children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: t("notification.type.pattern") }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Get notified of unusual trading patterns" })
            ] }),
            /* @__PURE__ */ jsx(
              Switch,
              {
                disabled: !isSubscribed,
                defaultChecked: true
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-0.5", children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: t("notification.type.digest") }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Receive weekly summary of insider activity" })
            ] }),
            /* @__PURE__ */ jsx(
              Switch,
              {
                disabled: !isSubscribed,
                defaultChecked: false
              }
            )
          ] })
        ] }),
        isSubscribed && /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-blue-50 dark:bg-blue-950 p-3 text-sm", children: /* @__PURE__ */ jsxs("p", { className: "text-blue-900 dark:text-blue-100", children: [
          "✓ ",
          t("notification.settings.enabled")
        ] }) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(Button, { "data-testid": "button-save-settings", children: t("general.save") }) })
  ] });
}
const PriceComparisonChart = memo(function PriceComparisonChart2({
  tradePrice,
  currentPrice,
  filedDate
}) {
  const { t } = useLanguage();
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  const difference = currentPrice - tradePrice;
  const percentChange = (currentPrice - tradePrice) / tradePrice * 100;
  const isProfit = difference > 0;
  const data = [
    {
      category: t("priceChart.tradePrice"),
      price: tradePrice,
      type: "trade",
      date: new Date(filedDate).toLocaleDateString()
    },
    {
      category: t("priceChart.currentPrice"),
      price: currentPrice,
      type: "current",
      date: t("priceChart.today")
    }
  ];
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data2 = payload[0].payload;
      return /* @__PURE__ */ jsxs("div", { className: "bg-background/95 backdrop-blur border rounded-lg p-3 shadow-lg", children: [
        /* @__PURE__ */ jsx("p", { className: "font-medium", children: label }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: data2.date }),
        /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-primary", children: formatCurrency(data2.price) })
      ] });
    }
    return null;
  };
  return /* @__PURE__ */ jsxs(Card, { "data-testid": "price-comparison-chart", children: [
    /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2", children: [
      isProfit ? /* @__PURE__ */ jsx(TrendingUp, { className: "w-5 h-5 text-green-500" }) : /* @__PURE__ */ jsx(TrendingDown, { className: "w-5 h-5 text-red-500" }),
      t("priceChart.title")
    ] }) }),
    /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
      /* @__PURE__ */ jsx("div", { className: "h-64", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(LineChart, { data, margin: { top: 20, right: 30, left: 20, bottom: 20 }, children: [
        /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", className: "opacity-30" }),
        /* @__PURE__ */ jsx(
          XAxis,
          {
            dataKey: "category",
            tick: { fontSize: 12 },
            className: "text-muted-foreground"
          }
        ),
        /* @__PURE__ */ jsx(
          YAxis,
          {
            tickFormatter: (value) => `$${value.toFixed(2)}`,
            tick: { fontSize: 12 },
            className: "text-muted-foreground"
          }
        ),
        /* @__PURE__ */ jsx(Tooltip$1, { content: /* @__PURE__ */ jsx(CustomTooltip, {}) }),
        /* @__PURE__ */ jsx(
          Line,
          {
            type: "monotone",
            dataKey: "price",
            stroke: isProfit ? "hsl(var(--chart-2))" : "hsl(var(--chart-5))",
            strokeWidth: 3,
            dot: {
              fill: "hsl(var(--chart-1))",
              strokeWidth: 2,
              r: 6
            },
            activeDot: {
              r: 8,
              stroke: isProfit ? "hsl(var(--chart-2))" : "hsl(var(--chart-5))",
              strokeWidth: 2,
              fill: "#fff"
            },
            animationDuration: 2e3
          }
        )
      ] }) }) }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mb-1", children: t("priceChart.tradePrice") }),
          /* @__PURE__ */ jsx("p", { className: "text-lg font-bold", "data-testid": "chart-trade-price", children: formatCurrency(tradePrice) }),
          /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "mt-1", children: t("priceChart.insiderTrade") })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mb-1", children: t("priceChart.currentPrice") }),
          /* @__PURE__ */ jsx("p", { className: "text-lg font-bold", "data-testid": "chart-current-price", children: formatCurrency(currentPrice) }),
          /* @__PURE__ */ jsxs(
            Badge,
            {
              variant: isProfit ? "default" : "destructive",
              className: isProfit ? "bg-green-500/10 text-green-600 border-green-500/20" : "",
              children: [
                isProfit ? "+" : "",
                percentChange.toFixed(2),
                "%"
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: `p-4 rounded-lg border ${isProfit ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20"}`, children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mb-2", children: t("priceChart.movement") }),
        /* @__PURE__ */ jsx("p", { className: `text-xl font-bold ${isProfit ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`, "data-testid": "chart-outcome", children: isProfit ? t("priceChart.increased") : t("priceChart.decreased") }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground mt-1", children: [
          t("priceChart.tradePriceLabel"),
          " ",
          formatCurrency(tradePrice),
          " → ",
          t("priceChart.currentLabel"),
          " ",
          formatCurrency(currentPrice)
        ] })
      ] }) })
    ] })
  ] });
});
const StockHistoryChart = memo(function StockHistoryChart2({
  ticker,
  tradeDate,
  tradePrice
}) {
  var _a;
  useLanguage();
  useState("1y");
  const fromDate = new Date(tradeDate).toISOString().split("T")[0];
  const toDate = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const { data: historyData = [], isLoading, error } = useQuery({
    queryKey: ["/api/stocks", ticker, "history", fromDate, toDate],
    enabled: !!ticker && !!fromDate && !!toDate,
    // Only fetch when all params are available
    staleTime: 15 * 60 * 1e3,
    // 15 minutes cache
    gcTime: 30 * 60 * 1e3,
    // 30 minutes garbage collection (renamed from cacheTime)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    queryFn: async () => {
      const response = await fetch(`/api/stocks/${ticker}/history?from=${fromDate}&to=${toDate}`);
      if (!response.ok) throw new Error("Failed to fetch stock price history");
      return response.json();
    }
  });
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };
  const processedData = useMemo(
    () => historyData.map((item) => ({
      date: item.date,
      close: parseFloat(item.close),
      open: parseFloat(item.open),
      high: parseFloat(item.high),
      low: parseFloat(item.low),
      volume: item.volume,
      formattedDate: formatDate(item.date)
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [historyData]
  );
  const tradePoint = useMemo(() => ({
    date: fromDate,
    close: tradePrice,
    open: tradePrice,
    high: tradePrice,
    low: tradePrice,
    volume: 0,
    formattedDate: formatDate(fromDate),
    isTrade: true
  }), [fromDate, tradePrice]);
  const chartData = useMemo(
    () => [tradePoint, ...processedData],
    [tradePoint, processedData]
  );
  const CustomTooltip = ({ active, payload, label }) => {
    var _a2;
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return /* @__PURE__ */ jsxs("div", { className: "bg-background/95 backdrop-blur border rounded-lg p-3 shadow-lg", children: [
        /* @__PURE__ */ jsx("p", { className: "font-medium mb-2", children: data.formattedDate }),
        data.isTrade ? /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm text-blue-600 font-medium", children: "Trade Price" }),
          /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-primary", children: formatCurrency(data.close) })
        ] }) : /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Close Price" }),
          /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-primary", children: formatCurrency(data.close) }),
          /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground space-y-1", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              "Open: ",
              formatCurrency(data.open)
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              "High: ",
              formatCurrency(data.high)
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              "Low: ",
              formatCurrency(data.low)
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              "Volume: ",
              ((_a2 = data.volume) == null ? void 0 : _a2.toLocaleString()) || "N/A"
            ] })
          ] })
        ] })
      ] });
    }
    return null;
  };
  if (isLoading) {
    return /* @__PURE__ */ jsxs(Card, { "data-testid": "stock-history-chart-loading", children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(BarChart3, { className: "w-5 h-5" }),
        "Stock Price History"
      ] }) }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx(Skeleton, { className: "h-80 w-full" }) })
    ] });
  }
  if (error || !historyData.length) {
    return /* @__PURE__ */ jsxs(Card, { "data-testid": "stock-history-chart-error", children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(BarChart3, { className: "w-5 h-5" }),
        "Stock Price History"
      ] }) }),
      /* @__PURE__ */ jsxs(CardContent, { className: "text-center py-8", children: [
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: error ? "Failed to load price history" : "No historical data available" }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground mt-2", children: [
          "Historical data from ",
          formatDate(fromDate),
          " to present"
        ] })
      ] })
    ] });
  }
  const currentPrice = ((_a = processedData[processedData.length - 1]) == null ? void 0 : _a.close) || 0;
  const priceChange = currentPrice - tradePrice;
  const percentChange = priceChange / tradePrice * 100;
  const isGain = priceChange > 0;
  return /* @__PURE__ */ jsxs(Card, { "data-testid": "stock-history-chart", children: [
    /* @__PURE__ */ jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(BarChart3, { className: "w-5 h-5" }),
        "Stock Price History (",
        ticker,
        ")"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "text-sm text-muted-foreground", children: [
        "From trade date (",
        formatDate(fromDate),
        ") to present"
      ] }),
      processedData.length > 0 && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 text-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("div", { className: "w-3 h-3 rounded-full bg-blue-500" }),
          /* @__PURE__ */ jsxs("span", { children: [
            "Trade Price: ",
            formatCurrency(tradePrice)
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("div", { className: "w-3 h-3 rounded-full bg-primary" }),
          /* @__PURE__ */ jsxs("span", { children: [
            "Current: ",
            formatCurrency(currentPrice)
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: `flex items-center gap-2 ${isGain ? "text-green-600" : "text-red-600"}`, children: [
          /* @__PURE__ */ jsx(TrendingUp, { className: `w-4 h-4 ${isGain ? "" : "rotate-180"}` }),
          /* @__PURE__ */ jsxs("span", { children: [
            isGain ? "+" : "",
            formatCurrency(priceChange),
            " (",
            percentChange.toFixed(2),
            "%)"
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(CardContent, { children: [
      /* @__PURE__ */ jsx("div", { className: "h-80", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(LineChart, { data: chartData, margin: { top: 20, right: 30, left: 20, bottom: 20 }, children: [
        /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", className: "opacity-30" }),
        /* @__PURE__ */ jsx(
          XAxis,
          {
            dataKey: "formattedDate",
            tick: { fontSize: 12 },
            className: "text-muted-foreground",
            interval: "preserveStartEnd"
          }
        ),
        /* @__PURE__ */ jsx(
          YAxis,
          {
            tick: { fontSize: 12 },
            className: "text-muted-foreground",
            domain: ["dataMin - 5", "dataMax + 5"],
            tickFormatter: (value) => `$${value.toFixed(2)}`
          }
        ),
        /* @__PURE__ */ jsx(Tooltip$1, { content: /* @__PURE__ */ jsx(CustomTooltip, {}) }),
        /* @__PURE__ */ jsx(
          Line,
          {
            dataKey: "close",
            stroke: "var(--color-trade, #3b82f6)",
            strokeWidth: 3,
            dot: (props) => {
              var _a2;
              if ((_a2 = props.payload) == null ? void 0 : _a2.isTrade) {
                return /* @__PURE__ */ jsx(
                  "circle",
                  {
                    cx: props.cx,
                    cy: props.cy,
                    r: 6,
                    fill: "#3b82f6",
                    stroke: "#ffffff",
                    strokeWidth: 2
                  }
                );
              }
              return /* @__PURE__ */ jsx("circle", { ...props, r: 0 });
            },
            connectNulls: false
          }
        ),
        /* @__PURE__ */ jsx(
          Line,
          {
            dataKey: "close",
            stroke: "hsl(var(--primary))",
            strokeWidth: 2,
            dot: false,
            connectNulls: true
          }
        )
      ] }) }) }),
      /* @__PURE__ */ jsxs("div", { className: "mt-4 text-xs text-muted-foreground text-center", children: [
        "Showing ",
        processedData.length,
        " trading days of price history"
      ] })
    ] })
  ] });
});
function TradeDetail() {
  var _a, _b, _c;
  const params = useParams();
  const { t } = useLanguage();
  const id = params.tradeId;
  const { data: trades = [], isLoading } = useQuery({
    queryKey: ["trades", "list", { limit: 100, offset: 0 }],
    queryFn: async () => {
      const response = await fetch("/api/trades?limit=100&offset=0");
      if (!response.ok) {
        throw new Error("Failed to fetch trades");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1e3
    // 5 minutes
  });
  const trade = trades.find((t2) => t2.id === id);
  const { data: stockPrice } = useQuery({
    queryKey: ["/api/stocks", (trade == null ? void 0 : trade.ticker) || (trade == null ? void 0 : trade.companyName)],
    enabled: false,
    // 주가 정보는 선택사항으로 비활성화 유지 (API 비용 절약)
    staleTime: 10 * 60 * 1e3,
    // 10분으로 증가
    gcTime: 15 * 60 * 1e3,
    // React Query v5: cacheTime -> gcTime
    refetchOnWindowFocus: false,
    // 창 포커스시 리페치 비활성화
    refetchOnMount: false,
    // 마운트시 리페치 비활성화
    refetchInterval: false,
    // 자동 리페치 비활성화
    queryFn: async () => {
      console.log("🚨 trade-detail.tsx stock fetch called but temporarily disabled to prevent infinite loops");
      return null;
    }
  });
  if (isLoading) {
    return /* @__PURE__ */ jsxs("div", { className: "container mx-auto p-6 max-w-4xl", children: [
      /* @__PURE__ */ jsx(Skeleton, { className: "h-8 w-48 mb-6" }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-6", children: [
        /* @__PURE__ */ jsx(Skeleton, { className: "h-48 w-full" }),
        /* @__PURE__ */ jsx(Skeleton, { className: "h-32 w-full" }),
        /* @__PURE__ */ jsx(Skeleton, { className: "h-64 w-full" })
      ] })
    ] });
  }
  if (!trade) {
    return /* @__PURE__ */ jsx("div", { className: "container mx-auto p-6 max-w-4xl", children: /* @__PURE__ */ jsxs("div", { className: "text-center py-12", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-foreground mb-4", children: t("tradeDetail.notFound") }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-6", children: t("tradeDetail.notFoundMessage") }),
      /* @__PURE__ */ jsx(Link, { href: "/", children: /* @__PURE__ */ jsxs(Button, { "data-testid": "button-back-dashboard", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }),
        t("tradeDetail.backToDashboard")
      ] }) })
    ] }) });
  }
  const getCompanyInitials = (name) => {
    const words = name.split(" ").filter((w) => w.length > 1);
    return words.slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  };
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };
  const calculateProfitLoss = () => {
    if (!stockPrice || !trade.pricePerShare) return null;
    const currentPrice = typeof stockPrice.currentPrice === "string" ? parseFloat(stockPrice.currentPrice) : stockPrice.currentPrice;
    const tradePrice = trade.pricePerShare;
    const difference = currentPrice - tradePrice;
    const percentChange = difference / tradePrice * 100;
    return {
      difference,
      percentChange,
      isProfit: difference > 0
    };
  };
  const profitLoss = calculateProfitLoss();
  return /* @__PURE__ */ jsxs("div", { className: "container mx-auto p-6 max-w-4xl", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
      /* @__PURE__ */ jsx(Link, { href: "/", children: /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", className: "mb-4", "data-testid": "button-back", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }),
        t("tradeDetail.back")
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-foreground", children: t("tradeDetail.title") }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid gap-6 lg:grid-cols-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2 space-y-6", children: [
        /* @__PURE__ */ jsxs(Card, { "data-testid": "card-trade-info", children: [
          /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Building2, { className: "w-5 h-5" }),
            t("tradeDetail.companyInfo")
          ] }) }),
          /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "w-12 h-12 bg-white rounded-lg flex items-center justify-center p-1 shadow-md", children: [
                /* @__PURE__ */ jsx(
                  "img",
                  {
                    src: `https://logo.clearbit.com/${(_a = trade.ticker) == null ? void 0 : _a.toLowerCase()}.com`,
                    alt: trade.ticker || trade.companyName,
                    className: "w-full h-full object-contain",
                    onError: (e) => {
                      var _a2;
                      const target = e.target;
                      target.style.display = "none";
                      (_a2 = target.nextElementSibling) == null ? void 0 : _a2.classList.remove("hidden");
                    }
                  }
                ),
                /* @__PURE__ */ jsx("div", { className: "w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-white text-sm hidden", children: getCompanyInitials(trade.companyName) })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h3", { className: "font-semibold text-lg", "data-testid": "text-company-name", children: trade.companyName }),
                /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground", "data-testid": "text-filing-info", children: [
                  "SEC Filing #",
                  trade.accessionNumber.slice(-6)
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsx(Separator, {}),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h4", { className: "font-medium text-sm text-muted-foreground", children: t("tradeDetail.company") }),
                /* @__PURE__ */ jsx("p", { className: "font-semibold", "data-testid": "text-company-display", children: trade.companyName })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h4", { className: "font-medium text-sm text-muted-foreground", children: t("tradeDetail.tickerSymbol") }),
                /* @__PURE__ */ jsx("p", { className: "font-semibold", "data-testid": "text-ticker", children: trade.ticker || (stockPrice == null ? void 0 : stockPrice.ticker) || "N/A" })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h4", { className: "font-medium text-sm text-muted-foreground", children: t("tradeDetail.tradeType") }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                  trade.tradeType === "BUY" ? /* @__PURE__ */ jsx(TrendingUp, { className: "h-4 w-4 text-green-600" }) : trade.tradeType === "SELL" ? /* @__PURE__ */ jsx(TrendingDown, { className: "h-4 w-4 text-red-600" }) : null,
                  /* @__PURE__ */ jsx("p", { className: "font-semibold", "data-testid": "text-trade-type", children: trade.tradeType || "N/A" })
                ] })
              ] })
            ] }),
            (trade.traderName || trade.traderTitle) && /* @__PURE__ */ jsxs(Fragment$1, { children: [
              /* @__PURE__ */ jsx(Separator, {}),
              /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
                /* @__PURE__ */ jsxs("h4", { className: "font-medium text-sm text-muted-foreground flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(User, { className: "w-4 h-4" }),
                  t("tradeDetail.traderInfo")
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
                  trade.traderName && /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("h5", { className: "font-medium text-xs text-muted-foreground", children: t("tradeDetail.name") }),
                    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                      /* @__PURE__ */ jsx("p", { className: "font-semibold", "data-testid": "text-trader-name", children: trade.traderName }),
                      trade.traderTitle && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", "data-testid": "text-trader-title", children: trade.traderTitle })
                    ] })
                  ] }),
                  trade.ownershipPercentage && trade.ownershipPercentage > 0 && /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("h5", { className: "font-medium text-xs text-muted-foreground", children: t("tradeDetail.ownership") }),
                    /* @__PURE__ */ jsxs("p", { className: "font-semibold", "data-testid": "text-ownership-percentage", children: [
                      trade.ownershipPercentage,
                      "%"
                    ] })
                  ] })
                ] })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(Card, { "data-testid": "card-transaction-details", children: [
          /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(DollarSign, { className: "w-5 h-5" }),
            t("tradeDetail.transactionDetails")
          ] }) }),
          /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h4", { className: "font-medium text-sm text-muted-foreground mb-1", children: t("tradeDetail.sharesTraded") }),
              /* @__PURE__ */ jsx("p", { className: "text-xl font-bold", "data-testid": "text-shares", children: ((_b = trade.shares) == null ? void 0 : _b.toLocaleString()) || "N/A" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h4", { className: "font-medium text-sm text-muted-foreground mb-1", children: t("tradeDetail.pricePerShare") }),
              /* @__PURE__ */ jsx("p", { className: "text-xl font-bold", "data-testid": "text-price-per-share", children: trade.pricePerShare ? formatCurrency(trade.pricePerShare) : "N/A" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h4", { className: "font-medium text-sm text-muted-foreground mb-1", children: t("tradeDetail.totalValue") }),
              /* @__PURE__ */ jsx("p", { className: "text-xl font-bold", "data-testid": "text-total-value", children: formatCurrency(trade.totalValue) })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h4", { className: "font-medium text-sm text-muted-foreground mb-1", children: t("tradeDetail.filingDate") }),
              /* @__PURE__ */ jsxs("p", { className: "font-semibold flex items-center gap-2", "data-testid": "text-filing-date", children: [
                /* @__PURE__ */ jsx(Calendar, { className: "w-4 h-4" }),
                formatDate(trade.filedDate.toString())
              ] })
            ] })
          ] }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
        stockPrice && /* @__PURE__ */ jsxs(Card, { "data-testid": "card-current-price", children: [
          /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(TrendingUp, { className: "w-5 h-5" }),
            t("tradeDetail.currentPrice")
          ] }) }),
          /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
              /* @__PURE__ */ jsx("p", { className: "text-3xl font-bold", "data-testid": "text-current-price", children: typeof stockPrice.currentPrice === "string" ? formatCurrency(parseFloat(stockPrice.currentPrice)) : formatCurrency(stockPrice.currentPrice) }),
              /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center gap-2 mt-2", children: stockPrice.changePercent && /* @__PURE__ */ jsxs(Fragment$1, { children: [
                parseFloat(stockPrice.changePercent.toString()) >= 0 ? /* @__PURE__ */ jsx(TrendingUp, { className: "w-4 h-4 text-green-500" }) : /* @__PURE__ */ jsx(TrendingDown, { className: "w-4 h-4 text-red-500" }),
                /* @__PURE__ */ jsxs("span", { className: `font-medium ${parseFloat(stockPrice.changePercent.toString()) >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`, "data-testid": "text-price-change", children: [
                  typeof stockPrice.change === "string" ? stockPrice.change : stockPrice.change ? Number(stockPrice.change).toFixed(2) : "0.00",
                  " (",
                  typeof stockPrice.changePercent === "string" ? stockPrice.changePercent : stockPrice.changePercent ? Number(stockPrice.changePercent).toFixed(2) : "0.00",
                  "%)"
                ] })
              ] }) })
            ] }),
            /* @__PURE__ */ jsx(Separator, {}),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2 text-sm", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
                /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: t("tradeDetail.volume") }),
                /* @__PURE__ */ jsx("span", { className: "font-medium", "data-testid": "text-volume", children: ((_c = stockPrice.volume) == null ? void 0 : _c.toLocaleString()) || "N/A" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
                /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: t("tradeDetail.lastUpdated") }),
                /* @__PURE__ */ jsx("span", { className: "font-medium text-xs", "data-testid": "text-last-updated", children: stockPrice.lastUpdated ? new Date(stockPrice.lastUpdated).toLocaleTimeString() : "N/A" })
              ] })
            ] })
          ] })
        ] }),
        trade.pricePerShare && stockPrice && /* @__PURE__ */ jsx(
          PriceComparisonChart,
          {
            tradePrice: trade.pricePerShare,
            currentPrice: typeof (stockPrice == null ? void 0 : stockPrice.currentPrice) === "string" ? parseFloat(stockPrice.currentPrice) : (stockPrice == null ? void 0 : stockPrice.currentPrice) || 0,
            filedDate: trade.filedDate
          }
        ),
        (trade.ticker || trade.companyName) && trade.filedDate && trade.pricePerShare && /* @__PURE__ */ jsx(
          StockHistoryChart,
          {
            ticker: trade.ticker || trade.companyName,
            tradeDate: trade.filedDate,
            tradePrice: trade.pricePerShare,
            "data-testid": "stock-history-chart"
          }
        ),
        profitLoss && trade.pricePerShare && stockPrice && /* @__PURE__ */ jsxs(Card, { "data-testid": "card-profit-loss", children: [
          /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2", children: [
            profitLoss.isProfit ? /* @__PURE__ */ jsx(TrendingUp, { className: "w-5 h-5 text-green-500" }) : /* @__PURE__ */ jsx(TrendingDown, { className: "w-5 h-5 text-red-500" }),
            t("tradeDetail.analysis")
          ] }) }),
          /* @__PURE__ */ jsx(CardContent, { className: "space-y-4", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mb-1", children: t("tradeDetail.priceComparison") }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
                /* @__PURE__ */ jsx("span", { className: "text-sm", children: t("tradeDetail.tradePrice") }),
                /* @__PURE__ */ jsx("span", { className: "font-medium", "data-testid": "text-trade-price", children: formatCurrency(trade.pricePerShare) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
                /* @__PURE__ */ jsx("span", { className: "text-sm", children: t("tradeDetail.currentPriceLabel") }),
                /* @__PURE__ */ jsx("span", { className: "font-medium", "data-testid": "text-comparison-current-price", children: typeof (stockPrice == null ? void 0 : stockPrice.currentPrice) === "string" ? formatCurrency(parseFloat(stockPrice.currentPrice)) : formatCurrency((stockPrice == null ? void 0 : stockPrice.currentPrice) || 0) })
              ] })
            ] }),
            /* @__PURE__ */ jsx(Separator, { className: "my-3" }),
            /* @__PURE__ */ jsxs("div", { className: `p-3 rounded-lg ${profitLoss.isProfit ? "bg-green-500/10 border border-green-500/20" : "bg-red-500/10 border border-red-500/20"}`, children: [
              /* @__PURE__ */ jsxs("p", { className: `text-lg font-bold ${profitLoss.isProfit ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`, "data-testid": "text-profit-loss-amount", children: [
                profitLoss.isProfit ? "+" : "",
                formatCurrency(profitLoss.difference)
              ] }),
              /* @__PURE__ */ jsxs("p", { className: `text-sm ${profitLoss.isProfit ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`, "data-testid": "text-profit-loss-percent", children: [
                "(",
                profitLoss.isProfit ? "+" : "",
                profitLoss.percentChange.toFixed(2),
                "%)"
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-1", children: t("tradeDetail.perShareComparison") })
            ] })
          ] }) })
        ] })
      ] })
    ] })
  ] });
}
function Analytics() {
  const { t } = useLanguage();
  const { data: trades = [], isLoading } = useQuery({
    queryKey: ["/api/trades"],
    staleTime: 5 * 60 * 1e3
    // 5 minutes
  });
  const analytics = useMemo(() => {
    if (!trades.length) return null;
    const tradeTypes = trades.reduce((acc, trade) => {
      const type = trade.tradeType || "UNKNOWN";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    const companyVolumes = trades.reduce((acc, trade) => {
      const company = trade.companyName;
      if (!acc[company]) {
        acc[company] = { name: company, volume: 0, trades: 0 };
      }
      acc[company].volume += trade.totalValue;
      acc[company].trades += 1;
      return acc;
    }, {});
    const topCompanies = Object.values(companyVolumes).sort((a, b) => b.volume - a.volume).slice(0, 10);
    const monthlyData = trades.reduce((acc, trade) => {
      const month = new Date(trade.filedDate).toLocaleDateString("en-US", { month: "short", year: "numeric" });
      if (!acc[month]) {
        acc[month] = { month, buys: 0, sells: 0, totalVolume: 0 };
      }
      if (trade.tradeType === "BUY") acc[month].buys += 1;
      if (trade.tradeType === "SELL") acc[month].sells += 1;
      acc[month].totalVolume += trade.totalValue;
      return acc;
    }, {});
    const monthlyTrends = Object.values(monthlyData).slice(-6);
    return {
      tradeTypes,
      topCompanies,
      monthlyTrends,
      totalVolume: trades.reduce((sum, trade) => sum + trade.totalValue, 0),
      totalTrades: trades.length,
      avgTradeSize: trades.reduce((sum, trade) => sum + trade.totalValue, 0) / trades.length
    };
  }, [trades]);
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1
    }).format(amount);
  };
  const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];
  if (isLoading || !analytics) {
    return /* @__PURE__ */ jsxs("div", { className: "p-6 max-w-7xl mx-auto space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Skeleton, { className: "h-8 w-48" }),
        /* @__PURE__ */ jsx(Skeleton, { className: "h-4 w-96" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid gap-6 md:grid-cols-2 lg:grid-cols-3", children: Array.from({ length: 6 }).map((_, i) => /* @__PURE__ */ jsx(Skeleton, { className: "h-48" }, i)) })
    ] });
  }
  const pieData = useMemo(
    () => Object.entries(analytics.tradeTypes).map(([type, count2]) => ({
      name: type,
      value: count2,
      percentage: (count2 / analytics.totalTrades * 100).toFixed(1)
    })),
    [analytics]
  );
  return /* @__PURE__ */ jsxs("div", { className: "p-6 max-w-7xl mx-auto space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold tracking-tight", "data-testid": "text-analytics-title", children: t("nav.analytics") }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: t("analytics.subtitle") })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-4", children: [
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [
          /* @__PURE__ */ jsx(CardTitle, { className: "text-sm font-medium", children: t("analytics.totalTrades") }),
          /* @__PURE__ */ jsx(Activity, { className: "h-4 w-4 text-muted-foreground" })
        ] }),
        /* @__PURE__ */ jsxs(CardContent, { children: [
          /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold", "data-testid": "metric-total-trades", children: analytics.totalTrades.toLocaleString() }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: t("analytics.transactionsRecorded") })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [
          /* @__PURE__ */ jsx(CardTitle, { className: "text-sm font-medium", children: t("analytics.totalVolume") }),
          /* @__PURE__ */ jsx(TrendingUp, { className: "h-4 w-4 text-muted-foreground" })
        ] }),
        /* @__PURE__ */ jsxs(CardContent, { children: [
          /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold", "data-testid": "metric-total-volume", children: formatCurrency(analytics.totalVolume) }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: t("analytics.combinedValue") })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [
          /* @__PURE__ */ jsx(CardTitle, { className: "text-sm font-medium", children: t("analytics.avgTradeSize") }),
          /* @__PURE__ */ jsx(BarChart3, { className: "h-4 w-4 text-muted-foreground" })
        ] }),
        /* @__PURE__ */ jsxs(CardContent, { children: [
          /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold", "data-testid": "metric-avg-trade", children: formatCurrency(analytics.avgTradeSize) }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: t("analytics.averageValue") })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [
          /* @__PURE__ */ jsx(CardTitle, { className: "text-sm font-medium", children: t("analytics.companies") }),
          /* @__PURE__ */ jsx(Users, { className: "h-4 w-4 text-muted-foreground" })
        ] }),
        /* @__PURE__ */ jsxs(CardContent, { children: [
          /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold", "data-testid": "metric-companies", children: analytics.topCompanies.length }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: t("analytics.uniqueTracked") })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid gap-6 md:grid-cols-2", children: [
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(PieChart, { className: "h-5 w-5" }),
          t("analytics.tradeDistribution")
        ] }) }),
        /* @__PURE__ */ jsxs(CardContent, { children: [
          /* @__PURE__ */ jsx("div", { className: "h-64", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(PieChart$1, { children: [
            /* @__PURE__ */ jsx(
              Pie,
              {
                data: pieData,
                dataKey: "value",
                nameKey: "name",
                cx: "50%",
                cy: "50%",
                outerRadius: 80,
                children: pieData.map((entry, index) => /* @__PURE__ */ jsx(Cell, { fill: COLORS[index % COLORS.length] }, `cell-${index}`))
              }
            ),
            /* @__PURE__ */ jsx(
              Tooltip$1,
              {
                formatter: (value, name) => {
                  var _a;
                  return [
                    `${value} trades (${(_a = pieData.find((d) => d.name === name)) == null ? void 0 : _a.percentage}%)`,
                    name
                  ];
                }
              }
            )
          ] }) }) }),
          /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2 mt-4", children: pieData.map((entry, index) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsx(
              "div",
              {
                className: "w-3 h-3 rounded-full",
                style: { backgroundColor: COLORS[index % COLORS.length] }
              }
            ),
            /* @__PURE__ */ jsxs("span", { className: "text-sm", children: [
              entry.name,
              ": ",
              entry.percentage,
              "%"
            ] })
          ] }, entry.name)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(BarChart3, { className: "h-5 w-5" }),
          t("analytics.monthlyActivity")
        ] }) }),
        /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("div", { className: "h-64", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(BarChart, { data: analytics.monthlyTrends, children: [
          /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", className: "opacity-30" }),
          /* @__PURE__ */ jsx(XAxis, { dataKey: "month", tick: { fontSize: 12 } }),
          /* @__PURE__ */ jsx(YAxis, { tick: { fontSize: 12 } }),
          /* @__PURE__ */ jsx(
            Tooltip$1,
            {
              formatter: (value, name) => [
                `${value} trades`,
                name === "buys" ? "Buys" : "Sells"
              ]
            }
          ),
          /* @__PURE__ */ jsx(Bar, { dataKey: "buys", stackId: "a", fill: "hsl(var(--chart-2))" }),
          /* @__PURE__ */ jsx(Bar, { dataKey: "sells", stackId: "a", fill: "hsl(var(--chart-5))" })
        ] }) }) }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(TrendingUp, { className: "h-5 w-5" }),
        t("analytics.topCompanies")
      ] }) }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("div", { className: "space-y-4", children: analytics.topCompanies.slice(0, 10).map((company, index) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold", children: index + 1 }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "font-medium", children: company.name }),
            /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
              company.trades,
              " ",
              t("analytics.trades")
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
          /* @__PURE__ */ jsx("p", { className: "font-bold", children: formatCurrency(company.volume) }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsx(TrendingUp, { className: "h-3 w-3 text-green-500" }),
            /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
              (company.volume / analytics.totalVolume * 100).toFixed(1),
              "%"
            ] })
          ] })
        ] })
      ] }, company.name)) }) })
    ] })
  ] });
}
function SearchPage() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [filterType, setFilterType] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [minValue, setMinValue] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const { data: trades = [], isLoading } = useQuery({
    queryKey: ["/api/trades"],
    staleTime: 5 * 60 * 1e3
  });
  const filteredTrades = trades.filter((trade) => {
    const matchesSearch = !searchTerm || trade.companyName.toLowerCase().includes(searchTerm.toLowerCase()) || trade.ticker && trade.ticker.toLowerCase().includes(searchTerm.toLowerCase()) || trade.traderName && trade.traderName.toLowerCase().includes(searchTerm.toLowerCase()) || trade.traderTitle && trade.traderTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || trade.tradeType === filterType;
    let matchesDate = true;
    if (dateRange !== "all") {
      const now = /* @__PURE__ */ new Date();
      const tradeDate = new Date(trade.filedDate);
      const daysAgo = parseInt(dateRange.replace("d", ""));
      const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1e3);
      matchesDate = tradeDate >= cutoffDate;
    }
    const matchesValue = !minValue || trade.totalValue >= parseFloat(minValue);
    return matchesSearch && matchesType && matchesDate && matchesValue;
  }).sort((a, b) => {
    switch (sortBy) {
      case "value":
        return b.totalValue - a.totalValue;
      case "company":
        return a.companyName.localeCompare(b.companyName);
      default:
        return new Date(b.filedDate).getTime() - new Date(a.filedDate).getTime();
    }
  });
  const searchStats = {
    totalResults: filteredTrades.length,
    buyTrades: filteredTrades.filter((t2) => t2.tradeType === "BUY").length,
    sellTrades: filteredTrades.filter((t2) => t2.tradeType === "SELL").length,
    totalVolume: filteredTrades.reduce((sum, t2) => sum + t2.totalValue, 0),
    uniqueCompanies: new Set(filteredTrades.map((t2) => t2.companyName)).size,
    uniqueTraders: new Set(filteredTrades.map((t2) => t2.traderName)).size
  };
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1
    }).format(amount);
  };
  const handleViewDetails = (trade) => {
    setLocation(`/trade/${trade.id}`);
  };
  const clearFilters = () => {
    setSearchTerm("");
    setFilterType("all");
    setDateRange("all");
    setMinValue("");
    setSortBy("date");
  };
  return /* @__PURE__ */ jsxs("div", { className: "p-6 max-w-7xl mx-auto space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold tracking-tight", "data-testid": "text-search-title", children: t("search.title") }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: t("search.subtitle") })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Search, { className: "h-5 w-5" }),
        t("search.title")
      ] }) }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative flex-1", children: [
            /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                placeholder: t("page.search.placeholder"),
                value: searchTerm,
                onChange: (e) => setSearchTerm(e.target.value),
                className: "pl-9",
                "data-testid": "input-main-search"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "outline",
              onClick: () => setShowFilters(!showFilters),
              className: "flex items-center gap-2",
              "data-testid": "button-toggle-filters",
              children: [
                /* @__PURE__ */ jsx(Sliders, { className: "h-4 w-4" }),
                t("search.filters")
              ]
            }
          ),
          (searchTerm || filterType !== "all" || dateRange !== "all" || minValue) && /* @__PURE__ */ jsx(Button, { variant: "ghost", onClick: clearFilters, children: t("search.clear") })
        ] }),
        showFilters && /* @__PURE__ */ jsxs(Fragment$1, { children: [
          /* @__PURE__ */ jsx(Separator, {}),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("label", { className: "text-sm font-medium", children: t("search.tradeType") }),
              /* @__PURE__ */ jsxs(Select, { value: filterType, onValueChange: (value) => setFilterType(value), children: [
                /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
                /* @__PURE__ */ jsxs(SelectContent, { children: [
                  /* @__PURE__ */ jsx(SelectItem, { value: "all", children: t("filter.allTypes") }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "BUY", children: t("filter.buyOnly") }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "SELL", children: t("filter.sellOnly") })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("label", { className: "text-sm font-medium", children: t("search.dateRange") }),
              /* @__PURE__ */ jsxs(Select, { value: dateRange, onValueChange: (value) => setDateRange(value), children: [
                /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
                /* @__PURE__ */ jsxs(SelectContent, { children: [
                  /* @__PURE__ */ jsx(SelectItem, { value: "all", children: t("search.dateRange.all") }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "7d", children: t("search.dateRange.7d") }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "30d", children: t("search.dateRange.30d") }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "90d", children: t("search.dateRange.90d") })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("label", { className: "text-sm font-medium", children: t("search.sortBy") }),
              /* @__PURE__ */ jsxs(Select, { value: sortBy, onValueChange: (value) => setSortBy(value), children: [
                /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, {}) }),
                /* @__PURE__ */ jsxs(SelectContent, { children: [
                  /* @__PURE__ */ jsx(SelectItem, { value: "date", children: t("search.sort.recent") }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "value", children: t("search.sort.value") }),
                  /* @__PURE__ */ jsx(SelectItem, { value: "company", children: t("search.sort.company") })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxs("label", { className: "text-sm font-medium", children: [
                t("search.value"),
                " ($)"
              ] }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  type: "number",
                  placeholder: t("search.placeholder.minValue"),
                  value: minValue,
                  onChange: (e) => setMinValue(e.target.value),
                  "data-testid": "input-min-value"
                }
              )
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-6", children: [
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [
          /* @__PURE__ */ jsx(CardTitle, { className: "text-sm font-medium", children: t("search.results") }),
          /* @__PURE__ */ jsx(Search, { className: "h-4 w-4 text-muted-foreground" })
        ] }),
        /* @__PURE__ */ jsxs(CardContent, { children: [
          /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold", "data-testid": "stat-total-results", children: searchStats.totalResults }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: t("search.totalFound") })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [
          /* @__PURE__ */ jsx(CardTitle, { className: "text-sm font-medium", children: t("search.buyTrades") }),
          /* @__PURE__ */ jsx(TrendingUp, { className: "h-4 w-4 text-green-600" })
        ] }),
        /* @__PURE__ */ jsxs(CardContent, { children: [
          /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-green-600", children: searchStats.buyTrades }),
          /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
            searchStats.totalResults > 0 ? `${(searchStats.buyTrades / searchStats.totalResults * 100).toFixed(1)}%` : "0%",
            " of results"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [
          /* @__PURE__ */ jsx(CardTitle, { className: "text-sm font-medium", children: t("search.sellTrades") }),
          /* @__PURE__ */ jsx(TrendingDown, { className: "h-4 w-4 text-red-600" })
        ] }),
        /* @__PURE__ */ jsxs(CardContent, { children: [
          /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-red-600", children: searchStats.sellTrades }),
          /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
            searchStats.totalResults > 0 ? `${(searchStats.sellTrades / searchStats.totalResults * 100).toFixed(1)}%` : "0%",
            " of results"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [
          /* @__PURE__ */ jsx(CardTitle, { className: "text-sm font-medium", children: t("search.totalVolume") }),
          /* @__PURE__ */ jsx(DollarSign, { className: "h-4 w-4 text-muted-foreground" })
        ] }),
        /* @__PURE__ */ jsxs(CardContent, { children: [
          /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold", children: formatCurrency(searchStats.totalVolume) }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: t("search.combinedValue") })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [
          /* @__PURE__ */ jsx(CardTitle, { className: "text-sm font-medium", children: t("search.companies") }),
          /* @__PURE__ */ jsx(Building2, { className: "h-4 w-4 text-muted-foreground" })
        ] }),
        /* @__PURE__ */ jsxs(CardContent, { children: [
          /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold", children: searchStats.uniqueCompanies }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: t("search.uniqueEntities") })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [
          /* @__PURE__ */ jsx(CardTitle, { className: "text-sm font-medium", children: t("search.traders") }),
          /* @__PURE__ */ jsx(User, { className: "h-4 w-4 text-muted-foreground" })
        ] }),
        /* @__PURE__ */ jsxs(CardContent, { children: [
          /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold", children: searchStats.uniqueTraders }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: t("search.uniqueInsiders") })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("span", { children: t("search.searchResults") }),
        /* @__PURE__ */ jsxs(Badge, { variant: "outline", children: [
          searchStats.totalResults,
          " results"
        ] })
      ] }) }),
      /* @__PURE__ */ jsx(CardContent, { children: isLoading ? /* @__PURE__ */ jsx("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3", children: Array.from({ length: 6 }).map((_, i) => /* @__PURE__ */ jsx(Skeleton, { className: "h-48" }, i)) }) : filteredTrades.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-12", children: [
        /* @__PURE__ */ jsx(Search, { className: "h-12 w-12 mx-auto mb-4 text-muted-foreground/50" }),
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold mb-2", children: t("search.noTrades") }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-4", children: t("liveTrading.adjustFilters") }),
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: clearFilters, children: t("search.clear") })
      ] }) : /* @__PURE__ */ jsx("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3", children: filteredTrades.map((trade) => /* @__PURE__ */ jsx(
        TradeCard,
        {
          trade,
          onViewDetails: handleViewDetails
        },
        trade.id
      )) }) })
    ] })
  ] });
}
function StripeMeshGradient({
  variant = "default",
  opacity = 0.6,
  animate = true,
  className = ""
}) {
  const gradientVariants = {
    default: {
      gradient1: "radial-gradient(at 27% 37%, hsla(215, 98%, 61%, 1) 0px, transparent 50%)",
      gradient2: "radial-gradient(at 97% 21%, hsla(125, 98%, 72%, 1) 0px, transparent 50%)",
      gradient3: "radial-gradient(at 52% 99%, hsla(354, 98%, 61%, 1) 0px, transparent 50%)",
      gradient4: "radial-gradient(at 10% 29%, hsla(256, 96%, 67%, 1) 0px, transparent 50%)",
      gradient5: "radial-gradient(at 97% 96%, hsla(38, 60%, 74%, 1) 0px, transparent 50%)",
      gradient6: "radial-gradient(at 33% 50%, hsla(222, 67%, 73%, 1) 0px, transparent 50%)",
      gradient7: "radial-gradient(at 79% 53%, hsla(343, 68%, 79%, 1) 0px, transparent 50%)"
    },
    purple: {
      gradient1: "radial-gradient(at 40% 20%, hsla(270, 80%, 65%, 0.8) 0px, transparent 50%)",
      gradient2: "radial-gradient(at 80% 0%, hsla(189, 100%, 78%, 0.6) 0px, transparent 50%)",
      gradient3: "radial-gradient(at 0% 50%, hsla(355, 100%, 93%, 0.4) 0px, transparent 50%)",
      gradient4: "radial-gradient(at 80% 80%, hsla(256, 96%, 67%, 0.7) 0px, transparent 50%)",
      gradient5: "radial-gradient(at 0% 100%, hsla(45, 100%, 70%, 0.5) 0px, transparent 50%)",
      gradient6: "radial-gradient(at 50% 50%, hsla(240, 70%, 50%, 0.3) 0px, transparent 50%)",
      gradient7: "radial-gradient(at 100% 50%, hsla(280, 80%, 70%, 0.4) 0px, transparent 50%)"
    },
    blue: {
      gradient1: "radial-gradient(at 30% 30%, hsla(210, 100%, 60%, 0.7) 0px, transparent 50%)",
      gradient2: "radial-gradient(at 70% 70%, hsla(190, 100%, 70%, 0.6) 0px, transparent 50%)",
      gradient3: "radial-gradient(at 50% 0%, hsla(220, 90%, 65%, 0.5) 0px, transparent 50%)",
      gradient4: "radial-gradient(at 0% 80%, hsla(200, 100%, 75%, 0.4) 0px, transparent 50%)",
      gradient5: "radial-gradient(at 100% 20%, hsla(230, 80%, 60%, 0.6) 0px, transparent 50%)",
      gradient6: "radial-gradient(at 20% 100%, hsla(195, 100%, 80%, 0.5) 0px, transparent 50%)",
      gradient7: "radial-gradient(at 80% 40%, hsla(215, 85%, 55%, 0.4) 0px, transparent 50%)"
    },
    warm: {
      gradient1: "radial-gradient(at 50% 20%, hsla(45, 100%, 70%, 0.6) 0px, transparent 50%)",
      gradient2: "radial-gradient(at 80% 80%, hsla(15, 90%, 65%, 0.5) 0px, transparent 50%)",
      gradient3: "radial-gradient(at 20% 80%, hsla(355, 85%, 70%, 0.4) 0px, transparent 50%)",
      gradient4: "radial-gradient(at 90% 30%, hsla(35, 100%, 75%, 0.7) 0px, transparent 50%)",
      gradient5: "radial-gradient(at 10% 10%, hsla(25, 95%, 60%, 0.5) 0px, transparent 50%)",
      gradient6: "radial-gradient(at 60% 90%, hsla(5, 80%, 65%, 0.4) 0px, transparent 50%)",
      gradient7: "radial-gradient(at 40% 60%, hsla(40, 90%, 70%, 0.3) 0px, transparent 50%)"
    }
  };
  const currentGradients = gradientVariants[variant];
  const gradientString = Object.values(currentGradients).join(", ");
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: `pointer-events-none fixed inset-0 z-0 ${animate ? "animate-mesh-gradient" : ""} ${className}`,
      style: {
        opacity,
        background: gradientString,
        filter: "blur(80px) saturate(150%)"
      },
      children: animate && /* @__PURE__ */ jsx("style", { dangerouslySetInnerHTML: { __html: `
          @keyframes mesh-gradient {
            0%, 100% {
              transform: scale(1) translateY(0);
            }
            33% {
              transform: scale(1.1) translateY(-10px);
            }
            66% {
              transform: scale(0.95) translateY(10px);
            }
          }

          .animate-mesh-gradient {
            animation: mesh-gradient 20s ease-in-out infinite;
          }
        ` } })
    }
  );
}
function GlassCard({
  children,
  className = "",
  variant = "default",
  hover = true,
  onClick
}) {
  const baseStyles = "backdrop-blur-xl bg-white/5 border transition-all duration-300";
  const variantStyles = {
    default: "border-white/10 rounded-2xl shadow-lg shadow-black/10",
    elevated: "border-white/20 rounded-3xl shadow-2xl shadow-black/20 bg-white/10",
    bordered: "border-white/30 rounded-xl shadow-xl shadow-black/15 ring-1 ring-white/10",
    premium: `
      border-white/20 rounded-3xl
      shadow-[0_50px_100px_-20px_rgba(50,50,93,.25),0_30px_60px_-30px_rgba(0,0,0,.3)]
      bg-gradient-to-br from-white/10 to-white/5
    `
  };
  const hoverStyles = hover ? "hover:bg-white/10 hover:border-white/30 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-0.5" : "";
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: cn(
        baseStyles,
        variantStyles[variant],
        hoverStyles,
        className
      ),
      onClick,
      children
    }
  );
}
function LockedTradeCard({ trade, onUnlock }) {
  var _a, _b, _c;
  const { t } = useLanguage();
  const insiderCount = 1;
  const totalValue = trade.totalValue || trade.shares * trade.pricePerShare;
  const hasHighRankInsider = ((_a = trade.traderTitle) == null ? void 0 : _a.toLowerCase().includes("ceo")) || ((_b = trade.traderTitle) == null ? void 0 : _b.toLowerCase().includes("cfo")) || ((_c = trade.traderTitle) == null ? void 0 : _c.toLowerCase().includes("president"));
  return /* @__PURE__ */ jsxs(Card, { className: "relative overflow-hidden border-2 border-amber-500/50 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900", children: [
    /* @__PURE__ */ jsx("div", { className: "absolute inset-0 backdrop-blur-sm bg-slate-900/60 z-10 flex items-center justify-center", children: /* @__PURE__ */ jsxs("div", { className: "text-center space-y-4 p-6", children: [
      /* @__PURE__ */ jsx(Lock, { className: "h-12 w-12 text-amber-500 mx-auto" }),
      /* @__PURE__ */ jsx("p", { className: "text-white font-bold text-lg", children: t("lockedTrade.realtimeInsider") })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "p-4 space-y-3 blur-[2px]", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1 flex-1", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "w-32 h-6 bg-slate-700 rounded animate-pulse" }),
            hasHighRankInsider && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 text-amber-500", children: [
              /* @__PURE__ */ jsx(Users, { className: "h-4 w-4" }),
              /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold", children: t("lockedTrade.executive") })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "w-48 h-4 bg-slate-700 rounded animate-pulse" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 text-green-500", children: [
          /* @__PURE__ */ jsx(TrendingUp, { className: "h-5 w-5" }),
          /* @__PURE__ */ jsx("span", { className: "font-bold", children: t("tradeType.buy") })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4 pt-2 border-t border-slate-700", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "text-xs text-slate-400", children: t("tradeCard.totalValue") }),
          /* @__PURE__ */ jsxs("div", { className: "text-lg font-bold text-white", children: [
            "$",
            (totalValue / 1e6).toFixed(1),
            "M"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "text-xs text-slate-400", children: t("lockedTrade.insiders") }),
          /* @__PURE__ */ jsxs("div", { className: "text-lg font-bold text-amber-500", children: [
            insiderCount,
            "+ ",
            t("lockedTrade.detected")
          ] })
        ] })
      ] })
    ] })
  ] });
}
function LockedTradesSection({ trades, onUnlock }) {
  const { t } = useLanguage();
  const { accessLevel } = useAccess();
  if (trades.length === 0) return null;
  if (accessLevel == null ? void 0 : accessLevel.hasRealtimeAccess) {
    console.log("[LOCKED TRADES] User has realtime access, hiding locked section");
    return null;
  }
  console.log("[LOCKED TRADES] Showing locked trades section for free user");
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Lock, { className: "h-5 w-5 text-amber-500" }),
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold", children: t("lockedTrade.realtimeZone") })
      ] }),
      /* @__PURE__ */ jsxs("span", { className: "text-sm text-slate-400", children: [
        trades.length,
        " ",
        t("lockedTrade.lockedTrades")
      ] })
    ] }),
    accessLevel && !accessLevel.hasUsedTrial && /* @__PURE__ */ jsxs("div", { className: "relative bg-white dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-700 shadow-sm", children: [
      /* @__PURE__ */ jsx("p", { className: "text-center text-sm text-slate-600 dark:text-slate-300 mb-5", children: t("lockedTrade.unlockDescription") }),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: onUnlock,
          className: "w-full px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg active:scale-[0.98]",
          children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-2.5", children: [
            /* @__PURE__ */ jsx(Unlock, { className: "h-5 w-5" }),
            /* @__PURE__ */ jsx("span", { children: t("lockedTrade.startTrial") })
          ] })
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "flex justify-center mt-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-slate-400 dark:text-slate-500 text-xs", children: [
        /* @__PURE__ */ jsx(ArrowDown, { className: "h-3.5 w-3.5" }),
        /* @__PURE__ */ jsx("span", { children: t("lockedTrade.unlockBelow") })
      ] }) })
    ] }),
    accessLevel && accessLevel.hasUsedTrial && /* @__PURE__ */ jsxs("div", { className: "relative bg-white dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-700 shadow-sm", children: [
      /* @__PURE__ */ jsx("p", { className: "text-center text-sm text-slate-600 dark:text-slate-300 mb-5", children: t("lockedTrade.unlockDescription") }),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: onUnlock,
          className: "w-full px-6 py-3.5 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-semibold text-base rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg active:scale-[0.98]",
          children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-2.5", children: [
            /* @__PURE__ */ jsx(Unlock, { className: "h-5 w-5" }),
            /* @__PURE__ */ jsx("span", { children: "Upgrade to Premium" })
          ] })
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 gap-4", children: trades.slice(0, 3).map((trade) => /* @__PURE__ */ jsx(LockedTradeCard, { trade, onUnlock }, trade.id)) })
  ] });
}
function FreeZoneBanner({ delayHours }) {
  const { t } = useLanguage();
  const { accessLevel } = useAccess();
  if (accessLevel == null ? void 0 : accessLevel.hasRealtimeAccess) {
    console.log("[FREE ZONE BANNER] User has realtime access, hiding banner");
    return null;
  }
  return /* @__PURE__ */ jsx(Alert, { className: "border-amber-500/50 bg-amber-50 dark:bg-amber-900/20", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
    /* @__PURE__ */ jsx(Clock, { className: "h-4 w-4 text-amber-600 dark:text-amber-500 flex-shrink-0" }),
    /* @__PURE__ */ jsx(AlertDescription, { className: "text-amber-700 dark:text-amber-400 text-sm", children: t("freeZone.description", { hours: delayHours }) })
  ] }) });
}
function TrialTimerBanner({ trialExpiresAt, onUpgrade }) {
  const { t } = useLanguage();
  const { accessLevel } = useAccess();
  const [, setLocation] = useLocation();
  const [timeLeft, setTimeLeft] = useState("");
  if (accessLevel == null ? void 0 : accessLevel.hasRealtimeAccess) {
    return null;
  }
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = (/* @__PURE__ */ new Date()).getTime();
      const expiry = new Date(trialExpiresAt).getTime();
      const difference = expiry - now;
      if (difference <= 0) {
        setTimeLeft(t("trial.expired"));
        return;
      }
      const hours = Math.floor(difference / (1e3 * 60 * 60));
      const minutes = Math.floor(difference % (1e3 * 60 * 60) / (1e3 * 60));
      const seconds = Math.floor(difference % (1e3 * 60) / 1e3);
      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };
    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1e3);
    return () => clearInterval(interval);
  }, [trialExpiresAt, t]);
  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      setLocation("/premium-checkout");
    }
  };
  return /* @__PURE__ */ jsx(Alert, { className: "border-amber-500 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-1", children: [
      /* @__PURE__ */ jsx(Sparkles, { className: "h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 animate-pulse" }),
      /* @__PURE__ */ jsxs(AlertDescription, { className: "text-amber-800 dark:text-amber-300 text-sm", children: [
        /* @__PURE__ */ jsx("span", { className: "font-bold", children: t("trial.activeNotice") }),
        " ",
        /* @__PURE__ */ jsx("span", { className: "font-mono font-semibold text-base", children: timeLeft }),
        " ",
        t("trial.remaining")
      ] })
    ] }),
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: handleUpgrade,
        className: "px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105 whitespace-nowrap text-sm shadow-lg",
        children: t("trial.upgradeButton")
      }
    )
  ] }) });
}
function TrialExpiredBanner({ onUpgrade }) {
  const { t } = useLanguage();
  const { accessLevel } = useAccess();
  const [, setLocation] = useLocation();
  if (accessLevel == null ? void 0 : accessLevel.hasRealtimeAccess) {
    console.log("[TRIAL EXPIRED BANNER] User has realtime access, hiding banner");
    return null;
  }
  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      setLocation("/premium-checkout");
    }
  };
  return /* @__PURE__ */ jsx(Alert, { className: "border-red-500/50 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-1", children: [
      /* @__PURE__ */ jsx(Clock, { className: "h-5 w-5 text-red-600 dark:text-red-500 flex-shrink-0" }),
      /* @__PURE__ */ jsxs(AlertDescription, { className: "text-red-800 dark:text-red-300 text-sm", children: [
        /* @__PURE__ */ jsx("span", { className: "font-bold", children: t("trial.expiredNotice") }),
        " ",
        t("trial.upgradePrompt")
      ] })
    ] }),
    /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: handleUpgrade,
        className: "px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-lg transition-all transform hover:scale-105 whitespace-nowrap shadow-lg",
        children: [
          t("trial.subscribeNow"),
          " - $14/mo"
        ]
      }
    )
  ] }) });
}
function TrialExpiringAlert({ hoursLeft, onDismiss, onUpgrade }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  if (hasPremiumAccess(user)) {
    return null;
  }
  return /* @__PURE__ */ jsxs(Alert, { className: "border-orange-500 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 relative", children: [
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: onDismiss,
        className: "absolute top-2 right-2 text-orange-600 hover:text-orange-800",
        children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-4 pr-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-1", children: [
        /* @__PURE__ */ jsx(AlertTriangle, { className: "h-5 w-5 text-orange-600 dark:text-orange-500 flex-shrink-0 animate-pulse" }),
        /* @__PURE__ */ jsxs(AlertDescription, { className: "text-orange-800 dark:text-orange-300 text-sm", children: [
          /* @__PURE__ */ jsx("span", { className: "font-bold", children: t("fomo.trialExpiringSoon", { hours: hoursLeft }) }),
          " ",
          t("fomo.upgradeToKeepAccess")
        ] })
      ] }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: onUpgrade,
          className: "px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold rounded-lg transition-all transform hover:scale-105 whitespace-nowrap text-sm shadow-lg",
          children: [
            t("fomo.upgradeNow"),
            " $14/mo"
          ]
        }
      )
    ] })
  ] });
}
function MissedGainsAlert({ missedTrades, totalValue, onDismiss, onSubscribe }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  if (hasPremiumAccess(user)) {
    return null;
  }
  const formatValue = (value) => {
    if (value >= 1e6) {
      return `$${(value / 1e6).toFixed(1)}M`;
    }
    return `$${(value / 1e3).toFixed(0)}K`;
  };
  return /* @__PURE__ */ jsxs(Alert, { className: "border-red-500 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 relative", children: [
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: onDismiss,
        className: "absolute top-2 right-2 text-red-600 hover:text-red-800",
        children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-4 pr-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-1", children: [
        /* @__PURE__ */ jsx(Clock, { className: "h-5 w-5 text-red-600 dark:text-red-500 flex-shrink-0" }),
        /* @__PURE__ */ jsxs(AlertDescription, { className: "text-red-800 dark:text-red-300 text-sm", children: [
          /* @__PURE__ */ jsx("span", { className: "font-bold", children: t("fomo.missedGains", { count: missedTrades, value: formatValue(totalValue) }) }),
          " ",
          t("fomo.dontMissNext")
        ] })
      ] }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: onSubscribe,
          className: "px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-lg transition-all transform hover:scale-105 whitespace-nowrap shadow-lg",
          children: [
            t("fomo.subscribeNow"),
            " - $14/mo"
          ]
        }
      )
    ] })
  ] });
}
function BigTradeAlert({ companyName, ticker, tradeValue, traderTitle, onDismiss, onUnlock }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  if (hasPremiumAccess(user)) {
    return null;
  }
  const formatValue = (value) => {
    if (value >= 1e6) {
      return `$${(value / 1e6).toFixed(1)}M`;
    }
    return `$${(value / 1e3).toFixed(0)}K`;
  };
  return /* @__PURE__ */ jsxs(Alert, { className: "border-amber-500 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 relative animate-pulse", children: [
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: onDismiss,
        className: "absolute top-2 right-2 text-amber-600 hover:text-amber-800",
        children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-4 pr-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-1", children: [
        /* @__PURE__ */ jsx(TrendingUp, { className: "h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0" }),
        /* @__PURE__ */ jsxs(AlertDescription, { className: "text-amber-800 dark:text-amber-300 text-sm", children: [
          /* @__PURE__ */ jsxs("span", { className: "font-bold", children: [
            "🚨 ",
            t("fomo.bigTradeAlert")
          ] }),
          " ",
          /* @__PURE__ */ jsx("span", { className: "font-semibold", children: traderTitle }),
          " ",
          t("fomo.bought"),
          " ",
          formatValue(tradeValue),
          " ",
          t("fomo.of"),
          " ",
          /* @__PURE__ */ jsx("span", { className: "font-bold", children: ticker }),
          " ",
          t("fomo.unlockToSee")
        ] })
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: onUnlock,
          className: "px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-lg transition-all transform hover:scale-105 whitespace-nowrap shadow-lg",
          children: t("fomo.unlockNow")
        }
      )
    ] })
  ] });
}
function FOMOAlertManager({
  trialExpiresAt,
  isTrialing,
  hasTrial,
  recentLockedTrades,
  onUpgrade,
  onUnlock
}) {
  const [dismissedAlerts, setDismissedAlerts] = useState(/* @__PURE__ */ new Set());
  const [, setLocation] = useLocation();
  const hoursLeft = trialExpiresAt ? Math.floor((new Date(trialExpiresAt).getTime() - Date.now()) / (1e3 * 60 * 60)) : 0;
  const handleDismiss = (alertId) => {
    setDismissedAlerts((prev) => new Set(prev).add(alertId));
  };
  const handleUpgradeClick = () => {
    setLocation("/premium-checkout");
    if (onUpgrade) onUpgrade();
  };
  const showTrialExpiring = isTrialing && hoursLeft > 0 && hoursLeft <= 3 && !dismissedAlerts.has("trial-expiring");
  const showMissedGains = hasTrial && !isTrialing && recentLockedTrades.length > 0 && !dismissedAlerts.has("missed-gains");
  const missedValue = recentLockedTrades.reduce((sum, t) => sum + t.totalValue, 0);
  const bigTrade = recentLockedTrades.find((t) => t.totalValue >= 1e6);
  const showBigTrade = !isTrialing && !hasTrial && bigTrade && !dismissedAlerts.has("big-trade");
  return /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
    showTrialExpiring && /* @__PURE__ */ jsx(
      TrialExpiringAlert,
      {
        hoursLeft,
        onDismiss: () => handleDismiss("trial-expiring"),
        onUpgrade: handleUpgradeClick
      }
    ),
    showMissedGains && /* @__PURE__ */ jsx(
      MissedGainsAlert,
      {
        missedTrades: recentLockedTrades.length,
        totalValue: missedValue,
        onDismiss: () => handleDismiss("missed-gains"),
        onSubscribe: handleUpgradeClick
      }
    ),
    showBigTrade && bigTrade && /* @__PURE__ */ jsx(
      BigTradeAlert,
      {
        companyName: bigTrade.companyName,
        ticker: bigTrade.ticker,
        tradeValue: bigTrade.totalValue,
        traderTitle: bigTrade.traderTitle,
        onDismiss: () => handleDismiss("big-trade"),
        onUnlock
      }
    )
  ] });
}
function ShareButton({ variant = "outline", size = "sm" }) {
  const { t } = useLanguage();
  const shareUrl = window.location.href;
  const shareText = "Track real-time insider trading on InsiderPulse!";
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "InsiderPulse",
          text: shareText,
          url: shareUrl
        });
      } catch (err) {
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }
  };
  return /* @__PURE__ */ jsxs(Button, { variant, size, onClick: handleShare, children: [
    /* @__PURE__ */ jsx(Share2, { className: "h-4 w-4 sm:mr-2" }),
    /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: t("social.share") })
  ] });
}
function LiveTrading() {
  const { t, language } = useLanguage();
  const queryClient2 = useQueryClient();
  const { accessLevel, setAccessLevel, refreshAccessLevel } = useAccess();
  const { isAuthenticated, openAuthModal } = useAuth();
  const [, navigate2] = useLocation();
  const [dataQuality, setDataQuality] = useState(null);
  const [lastValidationTime, setLastValidationTime] = useState(null);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadedCount, setLoadedCount] = useState(100);
  useState(false);
  const [watchlist, setWatchlist] = useState([]);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("watchlist");
      if (saved) {
        const items = JSON.parse(saved);
        setWatchlist(items.map((item) => item.ticker));
      }
    } catch (error2) {
      console.error("Failed to load watchlist:", error2);
    }
  }, []);
  const handleTradeClick = (trade) => {
    setSelectedTrade(trade);
    setIsModalOpen(true);
  };
  const handleAddToWatchlist = (trade) => {
    try {
      const saved = localStorage.getItem("watchlist");
      const existing = saved ? JSON.parse(saved) : [];
      const alreadyExists = existing.some((item) => item.ticker === trade.ticker);
      let updated;
      if (alreadyExists) {
        updated = existing.filter((item) => item.ticker !== trade.ticker);
        setWatchlist(updated.map((item) => item.ticker));
      } else {
        const newItem = {
          ticker: trade.ticker,
          companyName: trade.companyName,
          addedAt: (/* @__PURE__ */ new Date()).toISOString(),
          notificationsEnabled: true
          // 기본적으로 알림 켜진 상태
        };
        updated = [...existing, newItem];
        setWatchlist(updated.map((item) => item.ticker));
      }
      localStorage.setItem("watchlist", JSON.stringify(updated));
      window.dispatchEvent(new Event("watchlistUpdate"));
    } catch (error2) {
      console.error("Failed to toggle watchlist:", error2);
    }
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTrade(null);
  };
  const handleUpgrade = () => {
    navigate2("/premium-checkout");
  };
  const handleUnlock = () => {
    if (!isAuthenticated) {
      openAuthModal("signup");
      return;
    }
    navigate2("/premium-checkout");
  };
  const { data: tradesResponse, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.trades.list({
      limit: loadedCount,
      offset: 0,
      sortBy: "createdAt",
      hasRealtimeAccess: (accessLevel == null ? void 0 : accessLevel.hasRealtimeAccess) || false
      // Separate cache for premium/free users
    }),
    queryFn: async () => {
      var _a;
      console.log("[LIVE TRADING] Fetching trades and access level...");
      const response = await apiClient.getInsiderTradesWithAccess(loadedCount, 0, void 0, void 0, "createdAt");
      console.log("[LIVE TRADING] Response received:", {
        tradesCount: ((_a = response.trades) == null ? void 0 : _a.length) || 0,
        hasAccessLevel: !!response.accessLevel,
        accessLevel: response.accessLevel
      });
      if (response.accessLevel) {
        console.log("[LIVE TRADING] Updating access level:", {
          hasRealtimeAccess: response.accessLevel.hasRealtimeAccess,
          isDelayed: response.accessLevel.isDelayed,
          delayHours: response.accessLevel.delayHours
        });
        setAccessLevel(response.accessLevel);
      }
      return response;
    },
    staleTime: 5 * 60 * 1e3,
    // 5분 캐시 (was 30s) - Cost optimization
    refetchInterval: 5 * 60 * 1e3,
    // 5분마다 자동 갱신 (was 30s) - Cost optimization
    refetchOnWindowFocus: true,
    refetchOnMount: true
  });
  const allTrades = useMemo(() => (tradesResponse == null ? void 0 : tradesResponse.trades) || [], [tradesResponse == null ? void 0 : tradesResponse.trades]);
  useQuery({
    queryKey: queryKeys.stats,
    queryFn: apiClient.getTradingStats,
    staleTime: 5 * 60 * 1e3,
    // 5분 캐시 (was 30s) - Cost optimization
    refetchInterval: 5 * 60 * 1e3
    // 5분마다 자동 갱신 (was 30s) - Cost optimization
  });
  const wsUrl = getWebSocketUrl();
  const { isConnected, lastMessage } = useWebSocket(wsUrl);
  const validatedData = useMemo(() => {
    if (!allTrades) return { trades: [], quality: null };
    const validation = dataValidator.validateTrades(allTrades);
    const freshness = dataFreshnessMonitor.checkDataFreshness(validation.validTrades);
    const buySellTrades = validation.validTrades.filter((trade) => {
      var _a;
      const tradeType = ((_a = trade.tradeType) == null ? void 0 : _a.toUpperCase()) || "";
      return tradeType.includes("BUY") || tradeType.includes("PURCHASE") || tradeType.includes("SELL") || tradeType.includes("SALE");
    });
    const quality = {
      isValid: buySellTrades.length > 0,
      isFresh: freshness.isFresh,
      validTradeCount: buySellTrades.length,
      totalTradeCount: validation.summary.total,
      lastUpdateAge: freshness.lastTradeAge,
      issues: [...validation.summary.issues, ...freshness.warnings]
    };
    return {
      trades: buySellTrades,
      quality
    };
  }, [allTrades]);
  useEffect(() => {
    if (validatedData.quality) {
      setDataQuality(validatedData.quality);
      setLastValidationTime(/* @__PURE__ */ new Date());
    }
  }, [allTrades]);
  const filteredTrades = useMemo(() => {
    if (!searchQuery.trim()) {
      return validatedData.trades;
    }
    const query = searchQuery.toLowerCase().trim();
    return validatedData.trades.filter((trade) => {
      var _a, _b, _c, _d;
      return ((_a = trade.companyName) == null ? void 0 : _a.toLowerCase().includes(query)) || ((_b = trade.ticker) == null ? void 0 : _b.toLowerCase().includes(query)) || ((_c = trade.traderName) == null ? void 0 : _c.toLowerCase().includes(query)) || ((_d = trade.traderTitle) == null ? void 0 : _d.toLowerCase().includes(query));
    });
  }, [validatedData.trades, searchQuery]);
  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.type) {
        case "NEW_TRADE":
          console.log("🔄 New trade received, revalidating data...");
          queryClient2.invalidateQueries({ queryKey: queryKeys.stats });
          queryClient2.invalidateQueries({ queryKey: queryKeys.trades.all });
          break;
      }
    }
  }, [lastMessage, queryClient2]);
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1
    }).format(value);
  };
  const formatTimeAgo = (date) => {
    const dateLocale = language === "ko" ? ko : language === "ja" ? ja : language === "zh" ? zhCN : enUS;
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: dateLocale
    });
  };
  const getTradeTypeColor = (tradeType) => {
    const type = tradeType.toUpperCase();
    if (type.includes("BUY") || type.includes("PURCHASE")) return "text-green-600";
    if (type.includes("SELL") || type.includes("SALE")) return "text-red-600";
    return "text-gray-600";
  };
  const getTradeTypeIcon = (tradeType) => {
    const type = tradeType.toUpperCase();
    if (type.includes("BUY") || type.includes("PURCHASE")) return /* @__PURE__ */ jsx(TrendingUp, { className: "h-4 w-4" });
    if (type.includes("SELL") || type.includes("SALE")) return /* @__PURE__ */ jsx(TrendingDown, { className: "h-4 w-4" });
    return /* @__PURE__ */ jsx(DollarSign, { className: "h-4 w-4" });
  };
  if (isLoading) {
    return /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center min-h-[400px]", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsx(RefreshCw, { className: "h-8 w-8 animate-spin mx-auto mb-4" }),
      /* @__PURE__ */ jsx("p", { children: t("liveTrading.loadingRealData") })
    ] }) });
  }
  if (error) {
    return /* @__PURE__ */ jsx("div", { className: "p-6", children: /* @__PURE__ */ jsxs(Alert, { className: "border-destructive/50 bg-destructive/10", children: [
      /* @__PURE__ */ jsx(AlertTriangle, { className: "h-4 w-4 text-destructive" }),
      /* @__PURE__ */ jsxs(AlertDescription, { className: "text-destructive", children: [
        t("liveTrading.dataLoadingFailed"),
        ": ",
        error.message
      ] })
    ] }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "w-full max-w-full overflow-x-hidden min-h-screen bg-[#0a0a0f] relative", children: [
    /* @__PURE__ */ jsx(StripeMeshGradient, { variant: "blue", opacity: 0.3, animate: true }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-3 sm:space-y-6 p-3 sm:p-6 relative z-10", children: [
      /* @__PURE__ */ jsx(
        FOMOAlertManager,
        {
          trialExpiresAt: (accessLevel == null ? void 0 : accessLevel.trialExpiresAt) || null,
          isTrialing: (accessLevel == null ? void 0 : accessLevel.isTrialing) || false,
          hasTrial: (accessLevel == null ? void 0 : accessLevel.hasUsedTrial) || false,
          recentLockedTrades: validatedData.trades.slice(0, 5).map((t2) => ({
            companyName: t2.companyName,
            ticker: t2.ticker || "",
            totalValue: t2.totalValue,
            traderTitle: t2.traderTitle || "Insider"
          })),
          onUpgrade: handleUpgrade,
          onUnlock: handleUnlock
        }
      ),
      (accessLevel == null ? void 0 : accessLevel.isTrialing) && (accessLevel == null ? void 0 : accessLevel.trialExpiresAt) && /* @__PURE__ */ jsx(TrialTimerBanner, { trialExpiresAt: accessLevel.trialExpiresAt }),
      (accessLevel == null ? void 0 : accessLevel.hasUsedTrial) && !(accessLevel == null ? void 0 : accessLevel.isTrialing) && !(accessLevel == null ? void 0 : accessLevel.hasRealtimeAccess) && /* @__PURE__ */ jsx(TrialExpiredBanner, { onUpgrade: handleUpgrade }),
      accessLevel && !accessLevel.hasRealtimeAccess && !accessLevel.isTrialing && !accessLevel.hasUsedTrial && accessLevel.delayHours > 0 && /* @__PURE__ */ jsx(FreeZoneBanner, { delayHours: accessLevel.delayHours }),
      /* @__PURE__ */ jsx(GlassCard, { variant: "elevated", className: "p-4 sm:p-6", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsx("h1", { className: "text-3xl sm:text-4xl font-bold text-white mb-2", children: t("page.livetrading.title") }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400", children: t("page.livetrading.subtitle") }),
            lastValidationTime && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-500 mt-2 flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(Clock, { className: "h-3 w-3" }),
              t("liveTrading.lastUpdated"),
              ": ",
              formatTimeAgo(lastValidationTime)
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 w-full sm:w-auto", children: [
            /* @__PURE__ */ jsx(ShareButton, { variant: "outline", size: "sm" }),
            /* @__PURE__ */ jsxs(Button, { onClick: () => refetch(), variant: "outline", size: "sm", className: "flex-1 sm:flex-initial bg-white/5 border-white/10 hover:bg-white/10 text-white backdrop-blur-xl", children: [
              /* @__PURE__ */ jsx(RefreshCw, { className: "h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" }),
              /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: t("general.refresh") })
            ] }),
            /* @__PURE__ */ jsxs(Badge, { className: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 backdrop-blur-xl flex items-center gap-1 text-xs", children: [
              /* @__PURE__ */ jsx(Database, { className: "h-3 w-3" }),
              /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: t("liveTrading.realData") })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "relative w-full", children: [
          /* @__PURE__ */ jsx(Search, { className: "absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              type: "text",
              placeholder: t("page.search.placeholder"),
              value: searchQuery,
              onChange: (e) => setSearchQuery(e.target.value),
              className: "pl-12 pr-12 h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-500 backdrop-blur-xl rounded-xl focus:bg-white/10 focus:border-purple-500/50"
            }
          ),
          searchQuery && /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setSearchQuery(""),
              className: "absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors",
              children: /* @__PURE__ */ jsx(X, { className: "h-5 w-5" })
            }
          )
        ] }),
        searchQuery && /* @__PURE__ */ jsxs("div", { className: "text-sm text-slate-400", children: [
          filteredTrades.length,
          t("search.tradesFound"),
          filteredTrades.length !== validatedData.trades.length && /* @__PURE__ */ jsx("span", { className: "ml-1", children: t("search.outOfTotal").replace("{total}", validatedData.trades.length.toString()) })
        ] })
      ] }) }),
      accessLevel && !accessLevel.hasRealtimeAccess && /* @__PURE__ */ jsx(
        LockedTradesSection,
        {
          trades: validatedData.trades.slice(0, 5),
          onUnlock: handleUnlock
        }
      ),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Shield, { className: "h-5 w-5" }),
          t("liveTrading.verifiedTradesList"),
          accessLevel && !accessLevel.hasRealtimeAccess && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-xs", children: t("freeZone.delayedData") })
        ] }) }),
        /* @__PURE__ */ jsxs(CardContent, { children: [
          filteredTrades.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-8", children: [
            /* @__PURE__ */ jsx(AlertTriangle, { className: "h-12 w-12 text-muted-foreground mx-auto mb-4" }),
            /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: searchQuery ? "검색 결과가 없습니다" : t("liveTrading.noValidatedTrades") }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-2", children: searchQuery ? "다른 키워드로 검색해보세요" : t("liveTrading.collectorRunning") })
          ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-3", children: filteredTrades.map((trade) => {
            var _a;
            const pricePerShare = trade.pricePerShare || trade.totalValue / (trade.shares || 1);
            trade.createdAt && new Date(trade.createdAt).getTime() > Date.now() - 24 * 60 * 60 * 1e3;
            const priceChangePercent = trade.priceChangePercent;
            const hasPercentChange = priceChangePercent !== void 0 && priceChangePercent !== null;
            const priceLastUpdated = trade.priceLastUpdated;
            if (filteredTrades.indexOf(trade) === 0) {
              console.log("First trade data:", {
                ticker: trade.ticker,
                priceChangePercent,
                priceLastUpdated,
                currentPrice: trade.currentPrice
              });
            }
            return /* @__PURE__ */ jsx(
              GlassCard,
              {
                variant: "default",
                hover: true,
                className: "p-4 sm:p-5 cursor-pointer",
                onClick: () => handleTradeClick(trade),
                children: /* @__PURE__ */ jsxs("div", { className: "flex gap-3 sm:gap-4 w-full", "data-testid": `trade-card-${trade.id}`, children: [
                  /* @__PURE__ */ jsx("div", { className: `flex-shrink-0 flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${getTradeTypeColor(trade.tradeType)} shadow-lg`, children: getTradeTypeIcon(trade.tradeType) }),
                  /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-2 mb-2", children: [
                      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap min-w-0", children: [
                        /* @__PURE__ */ jsx("h3", { className: "font-bold text-lg sm:text-xl leading-tight text-white", children: trade.companyName }),
                        /* @__PURE__ */ jsx(Badge, { className: "font-mono text-xs sm:text-sm bg-white/10 text-slate-300 border-white/20 backdrop-blur-xl", children: trade.ticker })
                      ] }),
                      hasPercentChange && /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-end gap-0.5 flex-shrink-0", children: [
                        /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: t("tradeDetail.priceChangeSinceTradeShort") }),
                        /* @__PURE__ */ jsxs(
                          Badge,
                          {
                            variant: "outline",
                            className: `flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 font-bold text-xs sm:text-sm ${priceChangePercent >= 0 ? "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700" : "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700"}`,
                            children: [
                              priceChangePercent >= 0 ? /* @__PURE__ */ jsx(TrendingUp, { className: "h-3 w-3" }) : /* @__PURE__ */ jsx(TrendingDown, { className: "h-3 w-3" }),
                              priceChangePercent >= 0 ? "+" : "",
                              priceChangePercent.toFixed(1),
                              "%"
                            ]
                          }
                        )
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "text-xs sm:text-sm text-muted-foreground mb-2 truncate", children: [
                      trade.traderName,
                      " • ",
                      trade.traderTitle
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2", children: [
                      /* @__PURE__ */ jsxs("div", { className: "flex items-baseline gap-1.5 sm:gap-2 text-xs sm:text-sm flex-shrink-0", children: [
                        /* @__PURE__ */ jsx("span", { className: "font-semibold text-sm sm:text-base", children: (_a = trade.shares) == null ? void 0 : _a.toLocaleString() }),
                        /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "주 ×" }),
                        /* @__PURE__ */ jsxs("span", { className: "font-semibold", children: [
                          "$",
                          pricePerShare.toFixed(2)
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-end gap-0.5 min-w-0", children: [
                        /* @__PURE__ */ jsx("div", { className: `text-lg sm:text-xl font-bold ${getTradeTypeColor(trade.tradeType)} truncate`, children: formatCurrency(Math.abs(trade.totalValue)) }),
                        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 sm:gap-2 text-xs text-muted-foreground", children: [
                          trade.createdAt && /* @__PURE__ */ jsx("span", { className: "truncate", children: formatTimeAgo(trade.createdAt) }),
                          trade.secFilingUrl && /* @__PURE__ */ jsx("span", { className: "text-blue-600 font-medium flex-shrink-0", children: "SEC" })
                        ] })
                      ] })
                    ] })
                  ] })
                ] })
              },
              trade.id
            );
          }) }),
          filteredTrades.length > 0 && filteredTrades.length >= loadedCount && !searchQuery && /* @__PURE__ */ jsx("div", { className: "flex justify-center pt-6 border-t mt-6", children: /* @__PURE__ */ jsxs(
            Button,
            {
              onClick: () => {
                setLoadedCount((prev) => prev + 100);
              },
              variant: "outline",
              className: "w-full sm:w-auto",
              disabled: isLoading,
              children: [
                /* @__PURE__ */ jsx(RefreshCw, { className: "h-4 w-4 mr-2" }),
                "더 많은 거래 내역 보기 (+100개)"
              ]
            }
          ) }),
          filteredTrades.length > 0 && /* @__PURE__ */ jsx("div", { className: "text-center text-sm text-muted-foreground pt-4", children: searchQuery ? /* @__PURE__ */ jsxs(Fragment$1, { children: [
            "검색된 ",
            filteredTrades.length,
            "개의 거래 표시 중"
          ] }) : /* @__PURE__ */ jsxs(Fragment$1, { children: [
            "최근 ",
            filteredTrades.length,
            "개의 거래 표시 중"
          ] }) })
        ] })
      ] }),
      /* @__PURE__ */ jsx(
        TradeDetailModal,
        {
          isOpen: isModalOpen,
          onClose: handleCloseModal,
          trade: selectedTrade,
          onAddToWatchlist: handleAddToWatchlist,
          isInWatchlist: (selectedTrade == null ? void 0 : selectedTrade.ticker) ? watchlist.includes(selectedTrade.ticker) : false,
          "data-testid": "trade-detail-modal"
        }
      )
    ] })
  ] });
}
const logoLight$4 = "/Gemini_Generated_Image_wdqi0fwdqi0fwdqi.png";
const logoDark$4 = "/insiderpulse_logo1.png";
function Ranking() {
  const { t, language } = useLanguage();
  const { accessLevel } = useAccess();
  const [, setLocation] = useLocation();
  const [refreshing, setRefreshing] = useState(false);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [selectedTicker, setSelectedTicker] = useState(null);
  const [selectedTradeData, setSelectedTradeData] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [showWatchlistModal, setShowWatchlistModal] = useState(false);
  const [selectedTradeForAlert, setSelectedTradeForAlert] = useState(null);
  const [sharedCardIndex, setSharedCardIndex] = useState(null);
  const cardRefs = useRef([]);
  const formatTimeAgo = (date) => {
    const dateLocale = language === "ko" ? ko : language === "ja" ? ja : language === "zh" ? zhCN : enUS;
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: dateLocale
    });
  };
  const isPremium = (accessLevel == null ? void 0 : accessLevel.hasRealtimeAccess) || false;
  console.log("[RANKING] User premium status:", {
    isPremium,
    accessLevel: accessLevel ? { hasRealtimeAccess: accessLevel.hasRealtimeAccess, tier: accessLevel.tier } : "null"
  });
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/rankings"],
    staleTime: 5 * 60 * 1e3
    // 5 minutes
  });
  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };
  const handleStockClick = async (item, index) => {
    const { ticker, companyName } = item;
    if (!isPremium && index < 3) {
      console.log("[RANKING] Free user trying to access top 3 ranking, redirecting to upgrade");
      setLocation("/premium-checkout");
      return;
    }
    try {
      setSelectedTicker(ticker);
      console.log(`[RANKING] Fetching trades for ticker: ${ticker}`);
      let tickerTrades = [];
      try {
        const response = await fetch(`/api/enhanced/trades?ticker=${ticker}&limit=50`);
        console.log(`[RANKING] Enhanced API response status: ${response.status}`);
        if (response.ok) {
          const data2 = await response.json();
          console.log(`[RANKING] Enhanced API data:`, data2);
          tickerTrades = data2.data || [];
        }
      } catch (enhancedError) {
        console.warn("[RANKING] Enhanced API failed, trying fallback:", enhancedError);
      }
      if (tickerTrades.length === 0) {
        console.log("[RANKING] Trying regular API as fallback...");
        try {
          const allTrades = await apiClient.getInsiderTrades(500, 0);
          tickerTrades = allTrades.filter((trade) => trade.ticker === ticker);
          console.log(`[RANKING] Regular API found ${tickerTrades.length} trades for ${ticker}`);
        } catch (apiError) {
          console.warn("[RANKING] Regular API also failed:", apiError);
        }
      }
      if (tickerTrades.length === 0 && item.insiders && item.insiders.length > 0) {
        console.log("[RANKING] Using ranking item insiders data as final fallback");
        tickerTrades = item.insiders.map((insider, idx) => ({
          id: `${ticker}-${idx}`,
          ticker,
          companyName,
          traderName: insider.name,
          traderTitle: insider.title,
          shares: insider.shares,
          pricePerShare: insider.pricePerShare,
          totalValue: insider.totalValue,
          filedDate: insider.date,
          tradeType: insider.tradeType,
          secFilingUrl: insider.secFilingUrl,
          createdAt: insider.date
        }));
      }
      if (tickerTrades && tickerTrades.length > 0) {
        const sortedTrades = tickerTrades.sort(
          (a, b) => new Date(b.filedDate).getTime() - new Date(a.filedDate).getTime()
        );
        const recentTrade = sortedTrades[0];
        let comprehensiveAnalysis = null;
        try {
          console.log(`Fetching comprehensive analysis for trade ${recentTrade.id}...`);
          const response = await fetch(`/api/trades/${recentTrade.id}/comprehensive-analysis?language=ko`);
          if (response.ok) {
            comprehensiveAnalysis = await response.json();
            console.log("Comprehensive analysis fetched successfully");
          } else {
            console.warn("Failed to fetch comprehensive analysis, using fallback");
          }
        } catch (analysisError) {
          console.error("Error fetching comprehensive analysis:", analysisError);
        }
        const buyTrades = tickerTrades.filter((t2) => t2.tradeType === "BUY" || t2.tradeType === "PURCHASE");
        const sellTrades = tickerTrades.filter((t2) => t2.tradeType === "SELL" || t2.tradeType === "SALE");
        const buyRatio = buyTrades.length / (buyTrades.length + sellTrades.length);
        const currentPrice = recentTrade.pricePerShare * (1 + Math.random() * 0.1 - 0.05);
        const enhancedTrade = {
          ...recentTrade,
          companyName,
          ticker,
          currentPrice,
          predictionAccuracy: comprehensiveAnalysis ? comprehensiveAnalysis.confidence : Math.floor(Math.random() * 20 + 75),
          impactPrediction: buyRatio > 0.7 ? `+${(Math.random() * 5 + 2).toFixed(1)}%` : `-${(Math.random() * 3 + 1).toFixed(1)}%`,
          aiInsight: comprehensiveAnalysis ? comprehensiveAnalysis.executiveSummary : `${companyName}의 최근 내부자 거래 패턴을 분석한 결과, ${recentTrade.tradeType === "BUY" ? "긍정적인" : "주의 깊게 관찰해야 할"} 신호를 보이고 있습니다.`,
          comprehensiveAnalysis: comprehensiveAnalysis || {
            executiveSummary: `${companyName}에 대한 분석을 진행 중입니다.`,
            actionableRecommendation: "추가 정보를 수집하고 있습니다.",
            priceTargets: {
              conservative: recentTrade.pricePerShare * 0.95,
              realistic: recentTrade.pricePerShare * 1.05,
              optimistic: recentTrade.pricePerShare * 1.15,
              timeHorizon: "3-6개월"
            },
            riskAssessment: {
              level: "MEDIUM",
              factors: ["데이터 수집 중"],
              mitigation: "추가 정보 확인 필요"
            },
            confidence: 50,
            timeHorizon: "3-6개월"
          }
        };
        setSelectedTradeData(enhancedTrade);
        setShowTradeModal(true);
      } else {
        console.log(`No trades found for ${ticker}`);
        alert(`${companyName}에 대한 최근 거래 정보가 없습니다.`);
      }
    } catch (error2) {
      console.error("Failed to fetch trade data:", error2);
      alert("거래 데이터를 불러오는데 실패했습니다.");
    }
  };
  const getRecommendationColor = (recommendation) => {
    switch (recommendation) {
      case "STRONG_BUY":
        return "bg-green-500";
      case "BUY":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };
  const getRecommendationText = (recommendation) => {
    switch (recommendation) {
      case "STRONG_BUY":
        return t("ranking.strongBuy");
      case "BUY":
        return t("ranking.buy");
      default:
        return t("ranking.hold");
    }
  };
  const formatCurrency = (value) => {
    if (value >= 1e6) {
      return `$${(value / 1e6).toFixed(1)}M`;
    } else if (value >= 1e3) {
      return `$${(value / 1e3).toFixed(0)}K`;
    }
    return `$${value.toLocaleString()}`;
  };
  const shareRankingCard = async (index) => {
    var _a, _b, _c, _d;
    const cardElement = cardRefs.current[index];
    if (!cardElement) return;
    try {
      setSharedCardIndex(index);
      await new Promise((resolve) => setTimeout(resolve, 100));
      const canvas = await html2canvas(cardElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff"
      });
      const dataUrl = canvas.toDataURL("image/png");
      if (navigator.share) {
        const blob = await (await fetch(dataUrl)).blob();
        await navigator.share({
          title: `InsiderPulse Ranking: ${((_a = data == null ? void 0 : data.rankings[index]) == null ? void 0 : _a.ticker) || "Stock"}`,
          text: `Check out the insider trading insights for ${(_b = data == null ? void 0 : data.rankings[index]) == null ? void 0 : _b.companyName}!`,
          files: [
            new File([blob], `insider_ranking_${(_c = data == null ? void 0 : data.rankings[index]) == null ? void 0 : _c.ticker}.png`, {
              type: "image/png"
            })
          ]
        });
      } else {
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = `insider_ranking_${(_d = data == null ? void 0 : data.rankings[index]) == null ? void 0 : _d.ticker}.png`;
        link.click();
      }
    } catch (error2) {
      console.error("공유 중 오류 발생:", error2);
    } finally {
      setSharedCardIndex(null);
    }
  };
  if (isLoading) {
    return /* @__PURE__ */ jsxs("div", { className: "container mx-auto p-6 space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Skeleton, { className: "h-8 w-64 mb-2" }),
          /* @__PURE__ */ jsx(Skeleton, { className: "h-4 w-96" })
        ] }),
        /* @__PURE__ */ jsx(Skeleton, { className: "h-10 w-32" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid gap-4", children: Array.from({ length: 5 }).map((_, i) => /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsx(CardContent, { className: "p-6", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-4", children: [
          /* @__PURE__ */ jsx(Skeleton, { className: "h-12 w-12 rounded" }),
          /* @__PURE__ */ jsx(Skeleton, { className: "h-16 w-16 rounded-lg" }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Skeleton, { className: "h-5 w-24 mb-2" }),
            /* @__PURE__ */ jsx(Skeleton, { className: "h-4 w-32" })
          ] })
        ] }),
        /* @__PURE__ */ jsx(Skeleton, { className: "h-8 w-20" })
      ] }) }) }, i)) })
    ] });
  }
  if (error) {
    return /* @__PURE__ */ jsx("div", { className: "container mx-auto p-6", children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-6 text-center", children: [
      /* @__PURE__ */ jsx("p", { className: "text-destructive mb-4", children: t("ranking.noData") }),
      /* @__PURE__ */ jsxs(Button, { onClick: handleRefresh, variant: "outline", children: [
        /* @__PURE__ */ jsx(RefreshCw, { className: "h-4 w-4 mr-2" }),
        t("ranking.refreshData")
      ] })
    ] }) }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-full overflow-x-hidden", "data-testid": "ranking-page", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between flex-wrap gap-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-2xl sm:text-3xl font-bold flex items-center gap-2", "data-testid": "page-title", children: [
          /* @__PURE__ */ jsx(Star, { className: "h-6 w-6 sm:h-8 sm:w-8 text-yellow-500 flex-shrink-0" }),
          /* @__PURE__ */ jsx("span", { className: "truncate", children: t("ranking.title") })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2", children: t("ranking.subtitle") })
      ] }),
      /* @__PURE__ */ jsxs(
        Button,
        {
          onClick: handleRefresh,
          disabled: refreshing,
          variant: "outline",
          "data-testid": "button-refresh",
          children: [
            /* @__PURE__ */ jsx(RefreshCw, { className: `h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}` }),
            t("ranking.refreshData")
          ]
        }
      )
    ] }),
    data && /* @__PURE__ */ jsxs("div", { className: "text-right text-xs text-muted-foreground", children: [
      "Last Updated: ",
      new Date(data.generatedAt).toLocaleString("en-US", {
        timeZone: "America/New_York",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      }),
      " ET"
    ] }),
    /* @__PURE__ */ jsx("div", { className: "space-y-4", children: data == null ? void 0 : data.rankings.map((item, index) => {
      var _a;
      const isLocked = !isPremium && index < 3;
      return /* @__PURE__ */ jsxs(
        Card,
        {
          ref: (el) => cardRefs.current[index] = el,
          className: `hover-elevate cursor-pointer relative ${isLocked ? "overflow-hidden" : ""}`,
          "data-testid": `ranking-item-${item.ticker.toLowerCase()}`,
          onClick: () => handleStockClick(item, index),
          children: [
            isLocked && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm", children: /* @__PURE__ */ jsxs("div", { className: "text-center p-6 space-y-4", children: [
              /* @__PURE__ */ jsx("div", { className: "inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/20 mb-2", children: /* @__PURE__ */ jsx(Lock, { className: "w-8 h-8 text-amber-500" }) }),
              /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-white", children: t("ranking.lockedTitle") || `Premium Feature: #${index + 1} Ranking` }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-300 max-w-xs", children: t("ranking.lockedDescription") || "Upgrade to Insider Pro to see our top stock recommendations based on insider trading patterns" }),
              /* @__PURE__ */ jsxs(
                Button,
                {
                  onClick: (e) => {
                    e.stopPropagation();
                    setLocation("/premium-checkout");
                  },
                  className: "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold px-6 py-2",
                  children: [
                    /* @__PURE__ */ jsx(Crown, { className: "w-4 h-4 mr-2" }),
                    t("ranking.unlockButton") || "Unlock Top Rankings"
                  ]
                }
              )
            ] }) }),
            /* @__PURE__ */ jsx(
              Button,
              {
                size: "icon",
                variant: "ghost",
                className: "absolute top-2 right-2 z-10 hover:bg-muted/50",
                onClick: (e) => {
                  e.stopPropagation();
                  shareRankingCard(index);
                },
                children: sharedCardIndex === index ? /* @__PURE__ */ jsx(RefreshCw, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(Share2, { className: "h-4 w-4" })
              }
            ),
            /* @__PURE__ */ jsxs(CardContent, { className: `p-3 sm:p-6 relative ${isLocked ? "blur-sm" : ""}`, children: [
              /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden", children: [
                /* @__PURE__ */ jsx(
                  "img",
                  {
                    src: logoLight$4,
                    alt: "InsiderPulse",
                    className: "w-48 sm:w-80 h-auto opacity-20 select-none dark:hidden"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "img",
                  {
                    src: logoDark$4,
                    alt: "InsiderPulse",
                    className: "w-48 sm:w-80 h-auto opacity-20 select-none hidden dark:block"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between relative z-10 flex-wrap gap-2", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 sm:gap-4 min-w-0 flex-1", children: [
                  /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg", children: /* @__PURE__ */ jsxs("span", { className: "text-lg font-bold text-primary", children: [
                    "#",
                    index + 1
                  ] }) }),
                  /* @__PURE__ */ jsxs("div", { className: "relative h-16 w-16 flex-shrink-0", children: [
                    /* @__PURE__ */ jsx(
                      "img",
                      {
                        src: `https://assets.parqet.com/logos/resolution/${item.ticker}.png`,
                        alt: `${item.companyName} logo`,
                        className: "h-16 w-16 rounded-lg object-contain",
                        onError: (e) => {
                          var _a2;
                          const target = e.target;
                          if (target.src.includes("parqet.com")) {
                            target.src = `https://eodhd.com/img/logos/US/${item.ticker}.png`;
                          } else {
                            target.style.display = "none";
                            const iconDiv = (_a2 = target.parentElement) == null ? void 0 : _a2.querySelector(".fallback-icon");
                            if (iconDiv) iconDiv.style.display = "flex";
                          }
                        }
                      }
                    ),
                    /* @__PURE__ */ jsx("div", { className: "fallback-icon h-16 w-16 bg-muted rounded-lg hidden items-center justify-center", style: { display: "none" }, children: /* @__PURE__ */ jsx(Building2, { className: "h-8 w-8 text-muted-foreground" }) })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
                    /* @__PURE__ */ jsx("h3", { className: "text-base sm:text-xl font-semibold truncate", "data-testid": `text-ticker-${item.ticker.toLowerCase()}`, children: item.ticker }),
                    /* @__PURE__ */ jsx("p", { className: "text-xs sm:text-sm text-muted-foreground truncate", "data-testid": `text-company-${item.ticker.toLowerCase()}`, children: item.companyName }),
                    item.patternSignals && /* @__PURE__ */ jsx("div", { className: "mt-2 flex items-center gap-2 flex-wrap", children: /* @__PURE__ */ jsxs(Badge, { variant: "secondary", className: "text-xs bg-purple-100 text-purple-700 border-purple-200 break-words max-w-full", children: [
                      "추천 이유: ",
                      item.patternSignals
                    ] }) }),
                    !item.patternSignals && item.netBuying > 0 && /* @__PURE__ */ jsx("div", { className: "mt-2 flex items-center gap-2 flex-wrap", children: /* @__PURE__ */ jsxs(Badge, { variant: "secondary", className: "text-xs bg-green-100 text-green-700 border-green-200", children: [
                      "추천 이유: 순매수 $",
                      (item.netBuying / 1e6).toFixed(1),
                      "M"
                    ] }) })
                  ] })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "flex items-center flex-shrink-0", children: /* @__PURE__ */ jsx(
                  Badge,
                  {
                    className: `${getRecommendationColor(item.recommendation)} text-white px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 text-xs md:text-sm whitespace-nowrap`,
                    "data-testid": `badge-recommendation-${item.ticker.toLowerCase()}`,
                    children: getRecommendationText(item.recommendation)
                  }
                ) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t relative z-10", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 sm:gap-2", children: [
                  /* @__PURE__ */ jsx(Activity, { className: "h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" }),
                  /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
                    /* @__PURE__ */ jsx("p", { className: "text-xs sm:text-sm font-medium", children: item.totalTrades }),
                    /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground truncate", children: t("ranking.tradesLast30Days") })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 sm:gap-2", children: [
                  item.buyTrades > item.sellTrades ? /* @__PURE__ */ jsx(TrendingUp, { className: "h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" }) : item.buyTrades < item.sellTrades ? /* @__PURE__ */ jsx(TrendingDown, { className: "h-3 w-3 sm:h-4 sm:w-4 text-red-500 flex-shrink-0" }) : /* @__PURE__ */ jsx(Activity, { className: "h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" }),
                  /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
                    /* @__PURE__ */ jsxs("p", { className: `text-xs sm:text-sm font-medium ${item.buyTrades > item.sellTrades ? "text-green-600" : item.buyTrades < item.sellTrades ? "text-red-600" : "text-gray-600"}`, children: [
                      item.buyTrades,
                      " / ",
                      item.sellTrades
                    ] }),
                    /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Buy / Sell" })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 sm:gap-2", children: [
                  /* @__PURE__ */ jsx(DollarSign, { className: "h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" }),
                  /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
                    /* @__PURE__ */ jsx("p", { className: "text-xs sm:text-sm font-medium truncate", children: formatCurrency(item.avgTradeValue) }),
                    /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground truncate", children: t("ranking.avgTradeValue") })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 sm:gap-2", children: [
                  /* @__PURE__ */ jsx("div", { className: "h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-blue-500 flex-shrink-0" }),
                  /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
                    /* @__PURE__ */ jsx("p", { className: "text-xs sm:text-sm font-medium truncate", children: formatCurrency(item.netBuying) }),
                    /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground truncate", children: t("ranking.netBuying") })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "mt-4 flex items-center justify-between text-sm", children: [
                /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
                  "최근 거래: ",
                  new Date(item.lastTradeDate).toLocaleDateString("ko-KR")
                ] }),
                ((_a = item.enhancedTrade) == null ? void 0 : _a.currentPrice) && item.enhancedTrade.pricePerShare && (() => {
                  var _a2;
                  const priceChange = item.enhancedTrade.currentPrice - item.enhancedTrade.pricePerShare;
                  const percentChange = priceChange / item.enhancedTrade.pricePerShare * 100;
                  const isGain = priceChange > 0;
                  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-end gap-0.5", children: [
                    /* @__PURE__ */ jsxs(
                      Badge,
                      {
                        variant: "outline",
                        className: `flex items-center gap-1 px-2 py-1 text-xs font-semibold ${isGain ? "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700" : "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700"}`,
                        children: [
                          isGain ? /* @__PURE__ */ jsx(TrendingUp, { className: "h-3 w-3" }) : /* @__PURE__ */ jsx(TrendingDown, { className: "h-3 w-3" }),
                          isGain ? "+" : "",
                          percentChange.toFixed(1),
                          "%"
                        ]
                      }
                    ),
                    ((_a2 = item.enhancedTrade) == null ? void 0 : _a2.priceLastUpdated) && /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground", children: formatTimeAgo(item.enhancedTrade.priceLastUpdated) })
                  ] });
                })()
              ] }),
              item.insiders && item.insiders.length > 0 ? /* @__PURE__ */ jsxs("div", { className: "mt-4 border-t pt-4", children: [
                /* @__PURE__ */ jsxs("h4", { className: "text-base font-semibold mb-3 text-purple-700 dark:text-purple-400", children: [
                  "동시 매수자 ",
                  item.insiders.length,
                  "명"
                ] }),
                /* @__PURE__ */ jsx("div", { className: "space-y-3", children: item.insiders.slice(0, 4).map((insider, index2) => {
                  var _a2;
                  return /* @__PURE__ */ jsxs(
                    "div",
                    {
                      className: "bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
                      onClick: (e) => {
                        e.stopPropagation();
                        const currentPrice = insider.pricePerShare * (1 + Math.random() * 0.1 - 0.05);
                        const priceTargets = {
                          conservative: insider.pricePerShare * 1.05,
                          realistic: insider.pricePerShare * 1.15,
                          optimistic: insider.pricePerShare * 1.25
                        };
                        const insiderTradeData = {
                          ticker: item.ticker,
                          companyName: item.companyName,
                          traderName: insider.name,
                          traderTitle: insider.title,
                          tradeType: insider.tradeType,
                          shares: insider.shares,
                          pricePerShare: insider.pricePerShare,
                          totalValue: insider.totalValue,
                          filedDate: insider.date,
                          secFilingUrl: insider.secFilingUrl,
                          currentPrice,
                          predictionAccuracy: Math.floor(Math.random() * 20 + 75),
                          impactPrediction: `+${(Math.random() * 5 + 2).toFixed(1)}%`,
                          aiInsight: `${insider.name}의 ${item.companyName} 거래 분석 결과입니다.`,
                          comprehensiveAnalysis: {
                            executiveSummary: `${insider.name} (${insider.title})이(가) ${item.companyName}의 주식 ${insider.shares.toLocaleString()}주를 $${insider.pricePerShare.toFixed(2)}에 매수했습니다. 이는 긍정적인 신호로 해석됩니다.`,
                            priceTargets,
                            riskAssessment: {
                              level: "LOW",
                              mitigation: "내부자 매수는 일반적으로 긍정적 신호이나, 분산 투자를 권장합니다."
                            },
                            actionableRecommendation: `${insider.title}의 매수는 회사 내부 정보에 기반한 결정일 가능성이 높습니다. $${insider.pricePerShare.toFixed(2)} 근처에서 진입을 고려하세요.`,
                            confidence: 85,
                            timeHorizon: "3-6개월",
                            marketContext: {
                              sentiment: "BULLISH",
                              keyFactors: [
                                `${insider.title} 직책의 내부자 매수`,
                                `총 거래액: $${(insider.totalValue / 1e3).toFixed(0)}K`,
                                `동시 매수자 ${item.insiders.length}명`
                              ]
                            },
                            catalysts: [
                              "임원진의 직접 매수 활동",
                              "내부자 신뢰도 증가",
                              `${item.insiders.length}명의 동시 진입`
                            ]
                          }
                        };
                        setSelectedTradeData(insiderTradeData);
                        setShowTradeModal(true);
                      },
                      children: [
                        /* @__PURE__ */ jsx("div", { className: "flex items-start justify-between mb-3", children: /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
                            /* @__PURE__ */ jsx("span", { className: "font-semibold text-base", children: insider.name }),
                            /* @__PURE__ */ jsx(
                              Badge,
                              {
                                variant: "secondary",
                                className: "text-xs px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                                children: "매수"
                              }
                            )
                          ] }),
                          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: insider.title })
                        ] }) }),
                        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-3 text-xs", children: [
                          /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-gray-900 rounded p-2.5", children: [
                            /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-1", children: "매수 가격" }),
                            /* @__PURE__ */ jsxs("p", { className: "font-semibold text-sm text-blue-600 dark:text-blue-400", children: [
                              "$",
                              insider.pricePerShare.toFixed(2)
                            ] }),
                            ((_a2 = item.enhancedTrade) == null ? void 0 : _a2.currentPrice) && (() => {
                              var _a3;
                              const priceChange = item.enhancedTrade.currentPrice - insider.pricePerShare;
                              const percentChange = priceChange / insider.pricePerShare * 100;
                              const isGain = priceChange > 0;
                              return /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-0.5", children: [
                                /* @__PURE__ */ jsxs("p", { className: `text-[10px] mt-1 font-medium flex items-center gap-0.5 ${isGain ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`, children: [
                                  isGain ? /* @__PURE__ */ jsx(TrendingUp, { className: "h-2.5 w-2.5" }) : /* @__PURE__ */ jsx(TrendingDown, { className: "h-2.5 w-2.5" }),
                                  isGain ? "+" : "",
                                  percentChange.toFixed(1),
                                  "%"
                                ] }),
                                ((_a3 = item.enhancedTrade) == null ? void 0 : _a3.priceLastUpdated) && /* @__PURE__ */ jsx("p", { className: "text-[9px] text-muted-foreground", children: formatTimeAgo(item.enhancedTrade.priceLastUpdated) })
                              ] });
                            })()
                          ] }),
                          /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-gray-900 rounded p-2.5", children: [
                            /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-1", children: "주식 수" }),
                            /* @__PURE__ */ jsx("p", { className: "font-semibold text-sm", children: insider.shares.toLocaleString() })
                          ] }),
                          /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-gray-900 rounded p-2.5", children: [
                            /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-1", children: "총액" }),
                            /* @__PURE__ */ jsxs("p", { className: "font-semibold text-sm text-green-600 dark:text-green-400", children: [
                              "$",
                              (insider.totalValue / 1e3).toFixed(0),
                              "K"
                            ] })
                          ] })
                        ] }),
                        /* @__PURE__ */ jsx("div", { className: "mt-3 pt-2 border-t border-gray-200 dark:border-gray-700", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-xs text-muted-foreground", children: [
                          /* @__PURE__ */ jsx(Calendar, { className: "h-3.5 w-3.5" }),
                          /* @__PURE__ */ jsxs("span", { children: [
                            "거래일: ",
                            new Date(insider.date).toLocaleDateString("ko-KR")
                          ] })
                        ] }) })
                      ]
                    },
                    `${insider.name}-${index2}`
                  );
                }) })
              ] }) : null
            ] })
          ]
        },
        item.ticker
      );
    }) }),
    data && data.rankings.length === 0 && /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "p-12 text-center", children: [
      /* @__PURE__ */ jsx(Star, { className: "h-12 w-12 text-muted-foreground mx-auto mb-4" }),
      /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold mb-2", children: t("ranking.noData") }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-4", children: "No ranking data available for the current period." }),
      /* @__PURE__ */ jsxs(Button, { onClick: handleRefresh, variant: "outline", children: [
        /* @__PURE__ */ jsx(RefreshCw, { className: "h-4 w-4 mr-2" }),
        t("ranking.refreshData")
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(
      TradeDetailModal,
      {
        isOpen: showTradeModal,
        onClose: () => setShowTradeModal(false),
        trade: selectedTradeData,
        onAddToWatchlist: (trade) => {
          if (trade.ticker && !watchlist.includes(trade.ticker)) {
            setWatchlist((prev) => [...prev, trade.ticker]);
            setSelectedTradeForAlert(trade);
            setShowWatchlistModal(true);
            setShowTradeModal(false);
          }
        },
        isInWatchlist: (selectedTradeData == null ? void 0 : selectedTradeData.ticker) ? watchlist.includes(selectedTradeData.ticker) : false
      }
    ),
    showWatchlistModal && selectedTradeForAlert && /* @__PURE__ */ jsx("div", { className: "modal-backdrop fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4", children: /* @__PURE__ */ jsx("div", { className: "bg-gradient-to-br from-emerald-900/95 to-teal-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl", children: /* @__PURE__ */ jsx(Card, { className: "bg-transparent border-none shadow-none", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-0", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-3 mb-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx("div", { className: "w-8 h-8 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full flex items-center justify-center", children: /* @__PURE__ */ jsx(Check, { className: "h-5 w-5 text-white" }) }),
            /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-30" })
          ] }),
          /* @__PURE__ */ jsx("span", { className: "font-bold text-lg bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent", children: "추가 완료!" })
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-white/80 leading-relaxed", children: [
          "이제 ",
          /* @__PURE__ */ jsx("span", { className: "font-semibold text-emerald-300", children: "'내 워치리스트'" }),
          " 탭에서",
          /* @__PURE__ */ jsxs("span", { className: "font-semibold text-teal-300", children: [
            " ",
            selectedTradeForAlert.ticker
          ] }),
          "의 내부자 거래 정보만 따로 볼 수 있습니다."
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-4 pt-4 border-t border-white/10", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs text-white/60", children: [
          /* @__PURE__ */ jsx(Bell, { className: "h-3 w-3" }),
          /* @__PURE__ */ jsx("span", { children: "실시간 알림 설정도 가능합니다" })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex space-x-3 pt-2", children: [
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "outline",
            onClick: () => setShowWatchlistModal(false),
            className: "btn-professional flex-1 bg-white/5 hover:bg-white/10 border-white/20 text-white/80 hover:text-white rounded-xl h-12",
            children: [
              /* @__PURE__ */ jsx(X, { className: "h-4 w-4 mr-2" }),
              t("general.close")
            ]
          }
        ),
        /* @__PURE__ */ jsx(
          Button,
          {
            onClick: () => {
              setShowWatchlistModal(false);
            },
            className: "btn-professional flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl h-12 shadow-lg",
            children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Star, { className: "h-4 w-4" }),
              "확인"
            ] })
          }
        )
      ] })
    ] }) }) }) })
  ] });
}
const PasswordInput = () => {
  const [isVisible, setIsVisible] = useState(false);
  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };
  return /* @__PURE__ */ jsxs("div", { className: "password-container", children: [
    /* @__PURE__ */ jsx(
      "input",
      {
        type: isVisible ? "text" : "password",
        placeholder: "Enter your password",
        className: "password-input"
      }
    ),
    /* @__PURE__ */ jsxs(
      "svg",
      {
        className: `eye-icon ${!isVisible ? "close" : ""}`,
        viewBox: "0 0 100 100",
        onClick: toggleVisibility,
        children: [
          /* @__PURE__ */ jsx(
            "path",
            {
              id: "top-eye-part",
              d: "M10,50 Q50,-10 90,50",
              fill: "none",
              strokeWidth: "5"
            }
          ),
          /* @__PURE__ */ jsx(
            "path",
            {
              id: "bottom-eye-part",
              d: "M10,50 Q50,110 90,50",
              fill: "none",
              strokeWidth: "5"
            }
          ),
          /* @__PURE__ */ jsx("circle", { cx: "50", cy: "50", r: "10" })
        ]
      }
    )
  ] });
};
function PasswordDemo() {
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen relative", children: /* @__PURE__ */ jsx(PasswordInput, {}) });
}
const EnhancedInsiderTradingDashboard = () => {
  const { t } = useLanguage();
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("trades");
  const [alertsCount, setAlertsCount] = useState(3);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [showWatchlistModal, setShowWatchlistModal] = useState(false);
  const [watchlist, setWatchlist] = useState(["AAPL", "TSLA"]);
  const [userEmail] = useState("user@example.com");
  const [selectedCompanyForAlert, setSelectedCompanyForAlert] = useState("");
  const [displayedTradesCount, setDisplayedTradesCount] = useState(50);
  const [chartAnimationKey, setChartAnimationKey] = useState(0);
  const chartColors = {
    primary: "#3B82F6",
    secondary: "#8B5CF6",
    success: "#10B981",
    warning: "#F59E0B",
    danger: "#EF4444",
    info: "#06B6D4",
    purple: "#8B5CF6",
    pink: "#EC4899",
    gradient: ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#06B6D4"]
  };
  const sectorDistributionData = [
    { name: "Technology", value: 45, count: 156 },
    { name: "Healthcare", value: 20, count: 68 },
    { name: "Financial", value: 15, count: 52 },
    { name: "Consumer", value: 12, count: 41 },
    { name: "Energy", value: 5, count: 17 },
    { name: "Industrial", value: 3, count: 10 }
  ];
  const accuracyTrendData = [
    { week: "W1", accuracy: 85.2, predictions: 45 },
    { week: "W2", accuracy: 87.8, predictions: 52 },
    { week: "W3", accuracy: 89.5, predictions: 48 },
    { week: "W4", accuracy: 91.2, predictions: 61 },
    { week: "W5", accuracy: 88.9, predictions: 55 },
    { week: "W6", accuracy: 93.1, predictions: 58 },
    { week: "W7", accuracy: 91.8, predictions: 62 }
  ];
  const tradeTypePerformanceData = [
    { type: "CEO Buy", avgReturn: 7.2, successRate: 78, count: 15 },
    { type: "CEO Sell", avgReturn: -4.8, successRate: 82, count: 23 },
    { type: "CFO Buy", avgReturn: 4.5, successRate: 71, count: 12 },
    { type: "CFO Sell", avgReturn: -2.1, successRate: 68, count: 18 },
    { type: "Director Buy", avgReturn: 3.8, successRate: 65, count: 34 },
    { type: "Option Exercise", avgReturn: 1.2, successRate: 55, count: 28 }
  ];
  const timePatternData = [
    { hour: "09:00", buyCount: 12, sellCount: 8, totalValue: 45.2 },
    { hour: "10:00", buyCount: 15, sellCount: 11, totalValue: 62.8 },
    { hour: "11:00", buyCount: 18, sellCount: 14, totalValue: 78.5 },
    { hour: "12:00", buyCount: 9, sellCount: 7, totalValue: 34.1 },
    { hour: "13:00", buyCount: 11, sellCount: 9, totalValue: 41.7 },
    { hour: "14:00", buyCount: 22, sellCount: 16, totalValue: 95.3 },
    { hour: "15:00", buyCount: 28, sellCount: 19, totalValue: 112.6 },
    { hour: "16:00", buyCount: 35, sellCount: 25, totalValue: 138.9 }
  ];
  const riskReturnData = trades.map((trade) => ({
    x: trade.riskLevel,
    y: parseFloat(trade.impactPrediction.replace("%", "")),
    z: trade.totalValue / 1e6,
    // 백만달러 단위
    company: trade.ticker,
    color: trade.tradeType === "Buy" || trade.tradeType === "Purchase" ? chartColors.success : chartColors.danger
  }));
  const comparisonChartData = [
    {
      date: "2024-09-20",
      marketCap: 85,
      tradeVolume: 45,
      aiAccuracy: 85.2,
      riskLevel: 65,
      confidence: 87
    },
    {
      date: "2024-09-21",
      marketCap: 87,
      tradeVolume: 52,
      aiAccuracy: 87.8,
      riskLevel: 62,
      confidence: 89
    },
    {
      date: "2024-09-22",
      marketCap: 82,
      tradeVolume: 48,
      aiAccuracy: 89.5,
      riskLevel: 58,
      confidence: 91
    },
    {
      date: "2024-09-23",
      marketCap: 78,
      tradeVolume: 61,
      aiAccuracy: 91.2,
      riskLevel: 55,
      confidence: 93
    },
    {
      date: "2024-09-24",
      marketCap: 80,
      tradeVolume: 55,
      aiAccuracy: 88.9,
      riskLevel: 60,
      confidence: 88
    },
    {
      date: "2024-09-25",
      marketCap: 83,
      tradeVolume: 58,
      aiAccuracy: 93.1,
      riskLevel: 52,
      confidence: 95
    },
    {
      date: "2024-09-26",
      marketCap: 85,
      tradeVolume: 62,
      aiAccuracy: 91.8,
      riskLevel: 54,
      confidence: 94
    }
  ];
  const companyLogos = {
    "AAPL": [
      "https://logo.clearbit.com/apple.com",
      "https://companiesmarketcap.com/img/company-logos/64/AAPL.webp",
      "https://logos-world.net/wp-content/uploads/2020/04/Apple-Logo.png"
    ],
    "TSLA": [
      "https://logo.clearbit.com/tesla.com",
      "https://companiesmarketcap.com/img/company-logos/64/TSLA.webp",
      "https://logos-world.net/wp-content/uploads/2021/01/Tesla-Logo.png"
    ],
    "NVDA": [
      "https://logo.clearbit.com/nvidia.com",
      "https://companiesmarketcap.com/img/company-logos/64/NVDA.webp",
      "https://logos-world.net/wp-content/uploads/2020/09/Nvidia-Logo.png"
    ],
    "META": [
      "https://logo.clearbit.com/meta.com",
      "https://companiesmarketcap.com/img/company-logos/64/META.webp",
      "https://logos-world.net/wp-content/uploads/2021/11/Meta-Logo.png"
    ],
    "MSFT": [
      "https://logo.clearbit.com/microsoft.com",
      "https://companiesmarketcap.com/img/company-logos/64/MSFT.webp",
      "https://logos-world.net/wp-content/uploads/2020/04/Microsoft-Logo.png"
    ],
    "AMZN": [
      "https://logo.clearbit.com/amazon.com",
      "https://companiesmarketcap.com/img/company-logos/64/AMZN.webp",
      "https://logos-world.net/wp-content/uploads/2020/04/Amazon-Logo.png"
    ],
    "GOOGL": [
      "https://logo.clearbit.com/google.com",
      "https://companiesmarketcap.com/img/company-logos/64/GOOGL.webp",
      "https://logos-world.net/wp-content/uploads/2020/09/Google-Logo.png"
    ],
    "NFLX": [
      "https://logo.clearbit.com/netflix.com",
      "https://companiesmarketcap.com/img/company-logos/64/NFLX.webp",
      "https://logos-world.net/wp-content/uploads/2020/04/Netflix-Logo.png"
    ]
  };
  useState({});
  const sampleTrades = [
    {
      id: 1,
      company: "Apple Inc.",
      ticker: "AAPL",
      insider: "Timothy D. Cook",
      position: "Chief Executive Officer",
      tradeType: "Sale",
      shares: 511757,
      price: 191.45,
      totalValue: 98002563,
      date: "2024-10-02",
      time: "16:32",
      timezone: "EDT",
      credibilityScore: 60,
      riskLevel: 8,
      aiInsight: "🚨 CEO 대량매도 - 실적발표 1주 전 타이밍 의심. 과거 패턴상 3-7% 하락 예상",
      impactPrediction: "-5.2%",
      confidence: 87,
      isHot: true,
      priceAfter1Day: 189.23,
      priceAfter7Day: 185.67,
      priceAfter30Day: 182.45,
      actualReturn1Day: -1.16,
      actualReturn7Day: -3.02,
      actualReturn30Day: -4.69,
      predictionAccuracy: 95,
      similarTrades: 12,
      avgReturnAfterSimilar: -4.8,
      recommendedBuyPrice: 185.2,
      currentPrice: 189.23,
      // 고급 AI 분석 데이터
      psychologyPattern: "DEFENSIVE_SELLING",
      marketTiming: "PRE_EARNINGS_CAUTION",
      institutionalSentiment: "BEARISH",
      volumeAnomaly: 3.4,
      correlatedSectors: ["Technology", "Consumer Electronics"],
      riskMatrix: {
        volatility: 0.23,
        marketCorrelation: 0.87,
        liquidityRisk: 0.12,
        fundamentalRisk: 0.45
      },
      aiConfidenceMetrics: {
        patternRecognition: 94,
        sentimentAnalysis: 78,
        fundamentalAlignment: 82,
        technicalSignals: 91
      },
      deepInsight: "CEO의 대량 매도는 일반적으로 계획된 매도일 수 있으나, 실적발표 1주 전 타이밍과 시장 최고점 근처에서의 매도는 내재적 리스크를 시사. 과거 5년간 유사 패턴에서 평균 -4.8% 조정 발생.",
      strategicRecommendation: "SELL_SIGNAL",
      buySignalPrice: 185.2,
      entryStrategy: "DCA_ON_DECLINE",
      positionSizing: "CONSERVATIVE"
    },
    {
      id: 2,
      company: "Tesla Inc.",
      ticker: "TSLA",
      insider: "Elon Musk",
      position: "Chief Executive Officer",
      tradeType: "Purchase",
      shares: 5e4,
      price: 248.75,
      totalValue: 12437500,
      date: "2024-09-30",
      time: "09:45",
      timezone: "EDT",
      credibilityScore: 100,
      riskLevel: 2,
      aiInsight: "🚀 CEO 추가 매수 - 강한 신뢰 신호. 상승 모멘텀 기대되는 강력 매수 추천",
      impactPrediction: "+8.5%",
      confidence: 91,
      isHot: true,
      priceAfter1Day: 252.1,
      priceAfter7Day: 265.8,
      priceAfter30Day: 275.3,
      actualReturn1Day: 1.35,
      actualReturn7Day: 6.86,
      actualReturn30Day: 10.67,
      predictionAccuracy: 98,
      similarTrades: 8,
      avgReturnAfterSimilar: 7.2,
      recommendedBuyPrice: 255.3,
      currentPrice: 265.8,
      // 고급 AI 분석 데이터
      psychologyPattern: "AGGRESSIVE_ACCUMULATION",
      marketTiming: "GROWTH_MOMENTUM",
      institutionalSentiment: "BULLISH",
      volumeAnomaly: 1.8,
      correlatedSectors: ["Electric Vehicles", "Clean Energy", "Autonomous Driving"],
      riskMatrix: {
        volatility: 0.35,
        marketCorrelation: 0.65,
        liquidityRisk: 0.08,
        fundamentalRisk: 0.25
      },
      aiConfidenceMetrics: {
        patternRecognition: 96,
        sentimentAnalysis: 92,
        fundamentalAlignment: 89,
        technicalSignals: 94
      },
      deepInsight: "CEO의 추가 매수는 강한 내재적 신뢰를 의미하며, 특히 시장 조정 이후 저점 매수 타이밍이 탁월. EV 시장 회복세와 AI/로봇택시 촉매 기대로 중장기 강세 전망.",
      strategicRecommendation: "STRONG_BUY",
      buySignalPrice: 255.3,
      entryStrategy: "MOMENTUM_FOLLOW",
      positionSizing: "AGGRESSIVE"
    },
    {
      id: 3,
      company: "NVIDIA Corporation",
      ticker: "NVDA",
      insider: "Jensen Huang",
      position: "President and Chief Executive Officer",
      tradeType: "Sale",
      shares: 12e4,
      price: 875.28,
      totalValue: 105033600,
      date: "2024-09-29",
      time: "11:22",
      timezone: "EDT",
      credibilityScore: 20,
      riskLevel: 6,
      aiInsight: "⚠️ AI 붐 정점 신호? 대량 매도로 인한 매수 비추천",
      impactPrediction: "-4.8%",
      confidence: 79,
      isHot: true,
      priceAfter1Day: 862.45,
      priceAfter7Day: 834.2,
      priceAfter30Day: 820.15,
      actualReturn1Day: -1.47,
      actualReturn7Day: -4.69,
      actualReturn30Day: -6.3,
      predictionAccuracy: 88,
      similarTrades: 15,
      avgReturnAfterSimilar: -5.1,
      recommendedBuyPrice: 830.5,
      currentPrice: 834.2,
      // 고급 AI 분석 데이터
      psychologyPattern: "PROFIT_TAKING",
      marketTiming: "BUBBLE_PEAK_WARNING",
      institutionalSentiment: "NEUTRAL_TO_BEARISH",
      volumeAnomaly: 2.7,
      correlatedSectors: ["Semiconductors", "AI Hardware", "Data Centers"],
      riskMatrix: {
        volatility: 0.41,
        marketCorrelation: 0.78,
        liquidityRisk: 0.15,
        fundamentalRisk: 0.62
      },
      aiConfidenceMetrics: {
        patternRecognition: 88,
        sentimentAnalysis: 71,
        fundamentalAlignment: 65,
        technicalSignals: 84
      },
      deepInsight: "CEO의 지속적 매도는 단순 차익실현을 넘어 AI 버블 정점 우려를 암시. 높은 밸류에이션과 경쟁 심화로 단기 조정 불가피. 하지만 장기적 AI 성장 스토리는 여전히 유효.",
      strategicRecommendation: "CAUTIOUS_SELL",
      buySignalPrice: 830.5,
      entryStrategy: "SYSTEMATIC_ENTRY_ON_DECLINE",
      positionSizing: "MODERATE"
    },
    {
      id: 4,
      company: "Meta Platforms Inc.",
      ticker: "META",
      insider: "Mark Zuckerberg",
      position: "Chairman and Chief Executive Officer",
      tradeType: "Buy",
      shares: 75e3,
      price: 312.8,
      totalValue: 2346e4,
      date: "2024-09-28",
      time: "14:15",
      timezone: "EDT",
      credibilityScore: 85,
      riskLevel: 3,
      aiInsight: "🚀 CEO 추가 매수 - 메타버스 & AI 투자 신뢰 신호. 강력한 상승 동력 예상",
      impactPrediction: "+6.8%",
      confidence: 93,
      isHot: true,
      priceAfter1Day: 318.45,
      priceAfter7Day: 334.2,
      priceAfter30Day: 342.6,
      actualReturn1Day: 1.81,
      actualReturn7Day: 6.84,
      actualReturn30Day: 9.51,
      predictionAccuracy: 96,
      similarTrades: 9,
      avgReturnAfterSimilar: 6.3,
      recommendedBuyPrice: 315,
      currentPrice: 334.2,
      psychologyPattern: "STRATEGIC_ACCUMULATION",
      marketTiming: "AI_MOMENTUM_ENTRY",
      institutionalSentiment: "BULLISH",
      volumeAnomaly: 2.1,
      correlatedSectors: ["Social Media", "AI", "VR/AR"],
      riskMatrix: {
        volatility: 0.28,
        marketCorrelation: 0.72,
        liquidityRisk: 0.09,
        fundamentalRisk: 0.21
      },
      aiConfidenceMetrics: {
        patternRecognition: 93,
        sentimentAnalysis: 89,
        fundamentalAlignment: 91,
        technicalSignals: 88
      },
      deepInsight: "CEO의 전략적 매수는 메타버스와 AI 투자에 대한 강한 확신을 보여줌. Reality Labs 손실 감소와 광고 수익 회복으로 중장기 성장 기대.",
      strategicRecommendation: "BUY",
      buySignalPrice: 315,
      entryStrategy: "ACCUMULATE_ON_STRENGTH",
      positionSizing: "MODERATE_TO_AGGRESSIVE"
    },
    {
      id: 5,
      company: "Microsoft Corporation",
      ticker: "MSFT",
      insider: "Amy E. Hood",
      position: "Executive Vice President and Chief Financial Officer",
      tradeType: "Option Exercise",
      shares: 25e3,
      price: 425.6,
      totalValue: 1064e4,
      date: "2024-09-27",
      time: "10:30",
      timezone: "EDT",
      credibilityScore: 75,
      riskLevel: 4,
      aiInsight: "💼 CFO 옵션 행사 - 정상적인 보상 실현. 중립적 신호로 해석",
      impactPrediction: "+1.2%",
      confidence: 68,
      isHot: false,
      priceAfter1Day: 427.35,
      priceAfter7Day: 431.8,
      priceAfter30Day: 438.9,
      actualReturn1Day: 0.41,
      actualReturn7Day: 1.46,
      actualReturn30Day: 3.12,
      predictionAccuracy: 72,
      similarTrades: 22,
      avgReturnAfterSimilar: 1.8,
      recommendedBuyPrice: 430,
      currentPrice: 431.8,
      psychologyPattern: "COMPENSATION_EXERCISE",
      marketTiming: "ROUTINE_EXECUTION",
      institutionalSentiment: "NEUTRAL",
      volumeAnomaly: 1,
      correlatedSectors: ["Cloud Computing", "Enterprise Software", "AI"],
      riskMatrix: {
        volatility: 0.19,
        marketCorrelation: 0.83,
        liquidityRisk: 0.06,
        fundamentalRisk: 0.18
      },
      aiConfidenceMetrics: {
        patternRecognition: 72,
        sentimentAnalysis: 65,
        fundamentalAlignment: 86,
        technicalSignals: 71
      },
      deepInsight: "CFO의 옵션 행사는 일반적인 보상 실현으로 투자 결정에 미치는 영향은 제한적. 하지만 기업의 견고한 펀더멘털은 지속적 성장 기대.",
      strategicRecommendation: "HOLD",
      buySignalPrice: 430,
      entryStrategy: "WAIT_FOR_PULLBACK",
      positionSizing: "CONSERVATIVE"
    },
    {
      id: 6,
      company: "Amazon.com Inc.",
      ticker: "AMZN",
      insider: "Andrew R. Jassy",
      position: "President and Chief Executive Officer",
      tradeType: "Grant",
      shares: 1e5,
      price: 0,
      totalValue: 0,
      date: "2024-09-26",
      time: "16:00",
      timezone: "EDT",
      credibilityScore: 90,
      riskLevel: 2,
      aiInsight: "📈 CEO 스톡 그랜트 - 장기 인센티브 정렬. 강한 성장 신뢰 신호",
      impactPrediction: "+4.5%",
      confidence: 85,
      isHot: true,
      priceAfter1Day: 178.9,
      priceAfter7Day: 183.45,
      priceAfter30Day: 189.2,
      actualReturn1Day: 2.12,
      actualReturn7Day: 4.73,
      actualReturn30Day: 8.06,
      predictionAccuracy: 89,
      similarTrades: 6,
      avgReturnAfterSimilar: 4.2,
      recommendedBuyPrice: 180,
      currentPrice: 183.45,
      psychologyPattern: "LONG_TERM_ALIGNMENT",
      marketTiming: "GROWTH_INCENTIVE",
      institutionalSentiment: "BULLISH",
      volumeAnomaly: 1.5,
      correlatedSectors: ["E-commerce", "Cloud Computing", "Logistics"],
      riskMatrix: {
        volatility: 0.24,
        marketCorrelation: 0.79,
        liquidityRisk: 0.07,
        fundamentalRisk: 0.19
      },
      aiConfidenceMetrics: {
        patternRecognition: 89,
        sentimentAnalysis: 87,
        fundamentalAlignment: 92,
        technicalSignals: 85
      },
      deepInsight: "CEO 스톡 그랜트는 장기적 성과와 보상을 연계하는 강한 신호. AWS 성장과 AI 투자 확대로 중장기 가치 상승 기대.",
      strategicRecommendation: "STRONG_BUY",
      buySignalPrice: 180,
      entryStrategy: "DOLLAR_COST_AVERAGE",
      positionSizing: "AGGRESSIVE"
    }
  ];
  const recentAlerts = [
    {
      id: 1,
      type: "buy_recommendation",
      ticker: "AAPL",
      message: "AI 추천 매수가격 도달: $185.20 (현재가 $189.23)",
      time: "2분 전",
      severity: "high"
    },
    {
      id: 2,
      type: "pattern_alert",
      ticker: "TSLA",
      message: "Tesla CEO 매수 패턴이 2021년과 유사합니다. 당시 +23% 상승",
      time: "15분 전",
      severity: "medium"
    },
    {
      id: 3,
      type: "opportunity_alert",
      ticker: "META",
      message: "메타 임원진 3명이 동시 매수. 강한 상승 신호",
      time: "1시간 전",
      severity: "high"
    }
  ];
  useEffect(() => {
    setTimeout(() => {
      setTrades(sampleTrades);
      setLoading(false);
    }, 1500);
  }, []);
  useEffect(() => {
    setChartAnimationKey((prev) => prev + 1);
  }, [activeTab]);
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  const getRiskColor = (level) => {
    if (level >= 7) return "text-red-500 bg-red-500/10";
    if (level >= 4) return "text-yellow-500 bg-yellow-500/10";
    return "text-green-500 bg-green-500/10";
  };
  const getTradeTypeColor = (type) => {
    switch (type) {
      case "Sale":
      case "Sell":
        return "text-red-400 bg-red-500/10";
      case "Buy":
      case "Purchase":
        return "text-green-400 bg-green-500/10";
      case "Option Exercise":
        return "text-blue-400 bg-blue-500/10";
      case "Grant":
        return "text-purple-400 bg-purple-500/10";
      case "Gift":
        return "text-orange-400 bg-orange-500/10";
      default:
        return "text-slate-400 bg-slate-500/10";
    }
  };
  const getTradeTypeIcon = (type) => {
    switch (type) {
      case "Sale":
      case "Sell":
        return "📉";
      case "Buy":
      case "Purchase":
        return "📈";
      case "Option Exercise":
        return "🎯";
      case "Grant":
        return "🎁";
      case "Gift":
        return "💝";
      default:
        return "🔄";
    }
  };
  const getRecommendationColor = (recommendation) => {
    switch (recommendation) {
      case "STRONG_BUY":
      case "BUY":
        return "text-green-400";
      case "HOLD":
        return "text-yellow-400";
      case "SELL_SIGNAL":
      case "CAUTIOUS_SELL":
        return "text-red-400";
      case "WAIT_FOR_DIP":
        return "text-orange-400";
      default:
        return "text-slate-400";
    }
  };
  const handleChartClick = (data, event) => {
    if (data && data.activePayload && data.activePayload[0]) {
      console.log("Chart clicked:", data.activePayload[0].payload);
    }
  };
  const CustomTooltip = ({ active, payload, label, formatter }) => {
    if (active && payload && payload.length) {
      return /* @__PURE__ */ jsxs("div", { className: "bg-slate-900/95 backdrop-blur border border-slate-600 rounded-lg p-3 shadow-xl", children: [
        /* @__PURE__ */ jsx("p", { className: "font-semibold text-white mb-2", children: label }),
        payload.map((entry, index) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between space-x-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
            /* @__PURE__ */ jsx(
              "div",
              {
                className: "w-3 h-3 rounded-full",
                style: { backgroundColor: entry.color }
              }
            ),
            /* @__PURE__ */ jsx("span", { className: "text-slate-300 text-sm", children: entry.dataKey })
          ] }),
          /* @__PURE__ */ jsx("span", { className: "font-semibold text-white", children: formatter ? formatter(entry.value, entry.dataKey) : entry.value })
        ] }, index))
      ] });
    }
    return null;
  };
  const CompanyLogo2 = ({ ticker, size = "md", className = "" }) => {
    const [currentSrc, setCurrentSrc] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const sizeClasses = {
      sm: "w-8 h-8",
      md: "w-12 h-12",
      lg: "w-16 h-16",
      xl: "w-20 h-20"
    };
    const sources = companyLogos[ticker] || [];
    const handleImageError = () => {
      if (currentSrc < sources.length - 1) {
        setCurrentSrc((prev) => prev + 1);
      } else {
        setHasError(true);
        setIsLoading(false);
      }
    };
    const handleImageLoad = () => {
      setIsLoading(false);
      setHasError(false);
    };
    if (hasError || sources.length === 0) {
      return /* @__PURE__ */ jsx("div", { className: `${sizeClasses[size]} bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-white shadow-md ${className}`, children: ticker.charAt(0) });
    }
    return /* @__PURE__ */ jsxs("div", { className: `${sizeClasses[size]} bg-white rounded-lg flex items-center justify-center p-2 shadow-md ${className}`, children: [
      /* @__PURE__ */ jsx(
        "img",
        {
          src: sources[currentSrc],
          alt: ticker,
          className: "w-full h-full object-contain",
          onError: handleImageError,
          onLoad: handleImageLoad,
          style: { display: isLoading ? "none" : "block" }
        }
      ),
      isLoading && /* @__PURE__ */ jsx("div", { className: "w-full h-full bg-slate-200 rounded animate-pulse" })
    ] });
  };
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsx("div", { className: "animate-spin rounded-full h-32 w-32 border-b-2 border-blue-400 mb-4" }),
      /* @__PURE__ */ jsx("p", { className: "text-white text-lg", children: "실시간 내부자 거래 데이터 로딩중..." })
    ] }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white", children: [
    /* @__PURE__ */ jsx("div", { className: "bg-slate-800/50 backdrop-blur border-b border-slate-700", children: /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto px-4 py-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-3", children: [
        /* @__PURE__ */ jsx("div", { className: "w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center", children: /* @__PURE__ */ jsx(Brain, { className: "w-5 h-5" }) }),
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent", children: "InsiderTrack Pro" }),
        /* @__PURE__ */ jsx("div", { className: "px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full", children: "LIVE" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(Bell, { className: "w-5 h-5 text-slate-400 cursor-pointer hover:text-white" }),
          alertsCount > 0 && /* @__PURE__ */ jsx("span", { className: "absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center", children: alertsCount })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "text-sm text-slate-400", children: "3일 무료 체험 중 • 2일 남음" }),
        /* @__PURE__ */ jsx("button", { className: "bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition", children: "프리미엄 구독" })
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto px-4 pt-6", children: /* @__PURE__ */ jsx("div", { className: "flex space-x-1 bg-slate-800/30 p-1 rounded-lg w-fit", children: [
      { id: "trades", label: "실시간 거래", icon: Zap },
      { id: "watchlist", label: "내 워치리스트", icon: Bookmark },
      { id: "patterns", label: "패턴 분석", icon: BarChart3 },
      { id: "alerts", label: "스마트 알림", icon: Bell }
    ].map((tab) => /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: () => setActiveTab(tab.id),
        className: `flex items-center space-x-2 px-4 py-2 rounded-md text-sm transition ${activeTab === tab.id ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-700/50"}`,
        children: [
          /* @__PURE__ */ jsx(tab.icon, { className: "w-4 h-4" }),
          /* @__PURE__ */ jsx("span", { children: tab.label })
        ]
      },
      tab.id
    )) }) }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 py-6", children: [
      activeTab === "trades" && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [
        /* @__PURE__ */ jsx("div", { className: "lg:col-span-2", children: /* @__PURE__ */ jsxs("div", { className: "bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-6 border-b border-slate-700", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold mb-2", children: "실시간 내부자 거래" }),
            /* @__PURE__ */ jsx("p", { className: "text-slate-400 text-sm", children: "AI 분석 + 추천 매수가격이 포함된 내부자 거래 정보" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-6 space-y-4", children: [
            trades.slice(0, displayedTradesCount).map((trade) => /* @__PURE__ */ jsxs(
              "div",
              {
                className: `bg-slate-900/50 border rounded-xl p-4 cursor-pointer transition-all duration-200 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 ${(selectedTrade == null ? void 0 : selectedTrade.id) === trade.id ? "border-blue-500 shadow-lg shadow-blue-500/20" : "border-slate-700"}`,
                onClick: () => setSelectedTrade(trade),
                children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between mb-3", children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-3", children: [
                      /* @__PURE__ */ jsx(CompanyLogo2, { ticker: trade.ticker, size: "md" }),
                      /* @__PURE__ */ jsxs("div", { children: [
                        /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
                          /* @__PURE__ */ jsx("h3", { className: "font-semibold", children: trade.company }),
                          /* @__PURE__ */ jsxs("span", { className: "text-slate-400", children: [
                            "(",
                            trade.ticker,
                            ")"
                          ] }),
                          trade.isHot && /* @__PURE__ */ jsx("span", { className: "text-orange-400", children: "🔥" })
                        ] }),
                        /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-400", children: [
                          trade.insider,
                          " • ",
                          trade.position
                        ] })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "text-right flex flex-col items-end space-y-1", children: [
                      /* @__PURE__ */ jsxs("div", { className: `flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-semibold ${getTradeTypeColor(trade.tradeType)}`, children: [
                        /* @__PURE__ */ jsx("span", { children: getTradeTypeIcon(trade.tradeType) }),
                        /* @__PURE__ */ jsx("span", { children: trade.tradeType })
                      ] }),
                      /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-400", children: [
                        trade.time,
                        " ",
                        trade.timezone
                      ] }),
                      /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: trade.date })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-5 gap-4 mb-3", children: [
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: t("trades.shares") }),
                      /* @__PURE__ */ jsx("p", { className: "font-semibold", children: trade.shares.toLocaleString() })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "단가" }),
                      /* @__PURE__ */ jsxs("p", { className: "font-semibold", children: [
                        "$",
                        trade.price
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "총액" }),
                      /* @__PURE__ */ jsx("p", { className: "font-semibold", children: formatCurrency(trade.totalValue) })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "AI 예측 정확도" }),
                      /* @__PURE__ */ jsxs("p", { className: `font-semibold ${trade.predictionAccuracy >= 90 ? "text-green-400" : trade.predictionAccuracy >= 80 ? "text-yellow-400" : "text-red-400"}`, children: [
                        trade.predictionAccuracy,
                        "%"
                      ] }),
                      /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: "주가 변동 예측" })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "위험도" }),
                      /* @__PURE__ */ jsxs("div", { className: `inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(trade.riskLevel)}`, children: [
                        trade.riskLevel,
                        "/10"
                      ] })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-3 mb-3", children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
                      /* @__PURE__ */ jsxs("h4", { className: "text-sm font-semibold text-purple-400 flex items-center space-x-1", children: [
                        /* @__PURE__ */ jsx(Brain, { className: "w-3 h-3" }),
                        /* @__PURE__ */ jsx("span", { children: "AI 심층 분석" })
                      ] }),
                      /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-400", children: trade.psychologyPattern.replace(/_/g, " ") })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 mb-2", children: [
                      /* @__PURE__ */ jsxs("div", { className: "bg-slate-800/50 rounded p-2", children: [
                        /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "패턴 인식 신뢰도" }),
                        /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
                          /* @__PURE__ */ jsx("div", { className: "flex-1 bg-slate-700 rounded-full h-1.5", children: /* @__PURE__ */ jsx(
                            "div",
                            {
                              className: "bg-green-400 h-1.5 rounded-full",
                              style: { width: `${trade.aiConfidenceMetrics.patternRecognition}%` }
                            }
                          ) }),
                          /* @__PURE__ */ jsxs("span", { className: "text-xs font-bold text-green-400", children: [
                            trade.aiConfidenceMetrics.patternRecognition,
                            "%"
                          ] })
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "bg-slate-800/50 rounded p-2", children: [
                        /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "기관 심리" }),
                        /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold text-cyan-400", children: trade.institutionalSentiment.replace(/_/g, " ") })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "text-xs text-slate-300", children: [
                      "🎯 전략: ",
                      /* @__PURE__ */ jsx("span", { className: `font-semibold ${getRecommendationColor(trade.strategicRecommendation)}`, children: trade.strategicRecommendation.replace(/_/g, " ") }),
                      " • ",
                      "포지션: ",
                      /* @__PURE__ */ jsx("span", { className: "font-semibold text-yellow-400", children: trade.positionSizing })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "bg-slate-800/30 rounded-lg p-3 mb-3", children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
                      /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-green-400", children: "💰 AI 추천 매수가격" }),
                      /* @__PURE__ */ jsxs("span", { className: "text-xs text-slate-400", children: [
                        "현재가: $",
                        trade.currentPrice
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                      /* @__PURE__ */ jsxs("div", { children: [
                        /* @__PURE__ */ jsxs("p", { className: "text-lg font-bold text-green-400", children: [
                          "$",
                          trade.recommendedBuyPrice
                        ] }),
                        /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-400", children: [
                          ((trade.currentPrice - trade.recommendedBuyPrice) / trade.recommendedBuyPrice * 100).toFixed(1),
                          "%",
                          trade.currentPrice > trade.recommendedBuyPrice ? " 위" : " 아래"
                        ] })
                      ] }),
                      /* @__PURE__ */ jsx("div", { className: "text-right", children: /* @__PURE__ */ jsxs(
                        "button",
                        {
                          onClick: (e) => {
                            e.stopPropagation();
                            setSelectedCompanyForAlert(trade.ticker);
                            setShowAlertModal(true);
                          },
                          className: "bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded-md transition flex items-center space-x-1",
                          children: [
                            /* @__PURE__ */ jsx(Mail, { className: "w-3 h-3" }),
                            /* @__PURE__ */ jsx("span", { children: "알림 설정" })
                          ]
                        }
                      ) })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "bg-slate-800/50 rounded-lg p-3", children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
                      /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
                        /* @__PURE__ */ jsx(Brain, { className: "w-4 h-4 text-purple-400" }),
                        /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-purple-400", children: "매수 추천" }),
                        /* @__PURE__ */ jsx("div", { className: "flex items-center space-x-1", children: [...Array(5)].map((_, i) => /* @__PURE__ */ jsx(Star, { className: `w-3 h-3 ${i < Math.floor(trade.credibilityScore / 20) ? "text-yellow-400 fill-current" : "text-slate-600"}` }, i)) })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
                        /* @__PURE__ */ jsx(
                          "button",
                          {
                            onClick: (e) => {
                              e.stopPropagation();
                              setSelectedCompanyForAlert(trade.ticker);
                              setShowAlertModal(true);
                            },
                            className: "p-1.5 bg-blue-600 hover:bg-blue-700 rounded-md transition",
                            title: "이메일 알림 설정",
                            children: /* @__PURE__ */ jsx(Mail, { className: "w-3 h-3" })
                          }
                        ),
                        /* @__PURE__ */ jsx(
                          "button",
                          {
                            onClick: (e) => {
                              e.stopPropagation();
                              setSelectedTrade(trade);
                              setShowWatchlistModal(true);
                            },
                            className: "p-1.5 bg-green-600 hover:bg-green-700 rounded-md transition",
                            title: "워치리스트 추가",
                            children: /* @__PURE__ */ jsx(Bookmark, { className: "w-3 h-3" })
                          }
                        ),
                        /* @__PURE__ */ jsx("button", { className: "p-1.5 bg-slate-600 hover:bg-slate-500 rounded-md transition", title: "SEC 원본 보기", children: /* @__PURE__ */ jsx(ExternalLink, { className: "w-3 h-3" }) }),
                        /* @__PURE__ */ jsx("button", { className: "p-1.5 bg-purple-600 hover:bg-purple-700 rounded-md transition", title: "계산기", children: /* @__PURE__ */ jsx(Calculator, { className: "w-3 h-3" }) })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsx("p", { className: "text-sm mb-2", children: trade.aiInsight }),
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-xs", children: [
                      /* @__PURE__ */ jsxs("span", { className: "text-slate-400", children: [
                        "예상 영향: ",
                        /* @__PURE__ */ jsx("span", { className: trade.impactPrediction.startsWith("+") ? "text-green-400" : "text-red-400", children: trade.impactPrediction })
                      ] }),
                      /* @__PURE__ */ jsxs("span", { className: "text-slate-400", children: [
                        "유사 거래: ",
                        trade.similarTrades,
                        "건 (평균 ",
                        trade.avgReturnAfterSimilar > 0 ? "+" : "",
                        trade.avgReturnAfterSimilar,
                        "%)"
                      ] })
                    ] })
                  ] })
                ]
              },
              trade.id
            )),
            displayedTradesCount < trades.length && /* @__PURE__ */ jsxs("div", { className: "text-center pt-4", children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => setDisplayedTradesCount((prev) => Math.min(prev + 50, trades.length)),
                  className: "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 mx-auto",
                  children: [
                    /* @__PURE__ */ jsxs("span", { children: [
                      "더보기 (",
                      Math.min(50, trades.length - displayedTradesCount),
                      "개 더)"
                    ] }),
                    /* @__PURE__ */ jsx(Target, { className: "w-4 h-4" })
                  ]
                }
              ),
              /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-400 mt-2", children: [
                displayedTradesCount,
                "개 / ",
                trades.length,
                "개 거래 표시 중"
              ] })
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6", children: [
            /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold mb-4 flex items-center space-x-2", children: [
              /* @__PURE__ */ jsx(Activity, { className: "w-5 h-5 text-green-400" }),
              /* @__PURE__ */ jsx("span", { children: "실시간 시장 펄스" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "h-48", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(AreaChart, { data: accuracyTrendData, children: [
              /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("linearGradient", { id: "marketPulseGradient", x1: "0", y1: "0", x2: "0", y2: "1", children: [
                /* @__PURE__ */ jsx("stop", { offset: "5%", stopColor: chartColors.success, stopOpacity: 0.8 }),
                /* @__PURE__ */ jsx("stop", { offset: "95%", stopColor: chartColors.success, stopOpacity: 0.1 })
              ] }) }),
              /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#374151" }),
              /* @__PURE__ */ jsx(XAxis, { dataKey: "week", stroke: "#9CA3AF", fontSize: 10 }),
              /* @__PURE__ */ jsx(YAxis, { hide: true }),
              /* @__PURE__ */ jsx(
                Tooltip$1,
                {
                  contentStyle: {
                    backgroundColor: "#1F2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#F9FAFB"
                  },
                  formatter: (value) => [`${value}%`, "AI 정확도"]
                }
              ),
              /* @__PURE__ */ jsx(
                Area,
                {
                  type: "monotone",
                  dataKey: "accuracy",
                  stroke: chartColors.success,
                  fillOpacity: 1,
                  fill: "url(#marketPulseGradient)",
                  strokeWidth: 2
                }
              )
            ] }) }) }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 mt-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "bg-slate-900/50 rounded-lg p-3 text-center", children: [
                /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-green-400", children: "91.8%" }),
                /* @__PURE__ */ jsx("div", { className: "text-xs text-slate-400", children: "AI 정확도" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-slate-900/50 rounded-lg p-3 text-center", children: [
                /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-blue-400", children: "247" }),
                /* @__PURE__ */ jsx("div", { className: "text-xs text-slate-400", children: "오늘 거래" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6", children: [
            /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold mb-4 flex items-center space-x-2", children: [
              /* @__PURE__ */ jsx(BarChart3, { className: "w-5 h-5 text-purple-400" }),
              /* @__PURE__ */ jsx("span", { children: "섹터 히트맵" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "h-32", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(BarChart, { data: sectorDistributionData, layout: "horizontal", children: [
              /* @__PURE__ */ jsx(XAxis, { type: "number", hide: true }),
              /* @__PURE__ */ jsx(YAxis, { dataKey: "name", type: "category", stroke: "#9CA3AF", fontSize: 10, width: 60 }),
              /* @__PURE__ */ jsx(
                Tooltip$1,
                {
                  contentStyle: {
                    backgroundColor: "#1F2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#F9FAFB"
                  },
                  formatter: (value) => [`${value}%`, "비율"]
                }
              ),
              /* @__PURE__ */ jsx(Bar, { dataKey: "value", radius: [0, 4, 4, 0], children: sectorDistributionData.map((entry, index) => /* @__PURE__ */ jsx(Cell, { fill: chartColors.gradient[index % chartColors.gradient.length] }, `cell-${index}`)) })
            ] }) }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6", children: [
            /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold mb-4 flex items-center space-x-2", children: [
              /* @__PURE__ */ jsx(Bell, { className: "w-5 h-5 text-orange-400" }),
              /* @__PURE__ */ jsx("span", { children: "실시간 스마트 알림" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "space-y-3", children: recentAlerts.map((alert2) => /* @__PURE__ */ jsxs("div", { className: `border-l-4 pl-3 py-2 ${alert2.severity === "high" ? "border-red-500 bg-red-500/5" : "border-yellow-500 bg-yellow-500/5"}`, children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-1", children: [
                /* @__PURE__ */ jsx("span", { className: "font-medium text-sm", children: alert2.ticker }),
                /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-400", children: alert2.time })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-300", children: alert2.message })
            ] }, alert2.id)) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6", children: [
            /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold mb-4 flex items-center space-x-2", children: [
              /* @__PURE__ */ jsx(TrendingUp, { className: "w-5 h-5 text-cyan-400" }),
              /* @__PURE__ */ jsx("span", { children: "투자 성과" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "h-24", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsx(LineChart, { data: [
              { day: "Mon", return: 2.3 },
              { day: "Tue", return: -1.1 },
              { day: "Wed", return: 4.5 },
              { day: "Thu", return: 1.8 },
              { day: "Fri", return: 3.2 },
              { day: "Sat", return: -0.5 },
              { day: "Sun", return: 2.7 }
            ], children: /* @__PURE__ */ jsx(Line, { type: "monotone", dataKey: "return", stroke: chartColors.info, strokeWidth: 2, dot: false }) }) }) }),
            /* @__PURE__ */ jsxs("div", { className: "mt-3 text-center", children: [
              /* @__PURE__ */ jsx("div", { className: "text-xl font-bold text-green-400", children: "+12.9%" }),
              /* @__PURE__ */ jsx("div", { className: "text-xs text-slate-400", children: "이번 주 수익률" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold mb-4", children: "스마트 액션" }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => setShowAlertModal(true),
                  className: "w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-4 rounded-lg text-sm hover:opacity-90 transition flex items-center justify-center space-x-2",
                  children: [
                    /* @__PURE__ */ jsx(Mail, { className: "w-4 h-4" }),
                    /* @__PURE__ */ jsx("span", { children: "이메일 알림 설정" })
                  ]
                }
              ),
              /* @__PURE__ */ jsx("button", { className: "w-full bg-slate-700 text-white py-2 px-4 rounded-lg text-sm hover:bg-slate-600 transition", children: "📱 모바일 알림 설정" }),
              /* @__PURE__ */ jsx("button", { className: "w-full bg-slate-700 text-white py-2 px-4 rounded-lg text-sm hover:bg-slate-600 transition", children: "맞춤 대시보드" })
            ] })
          ] })
        ] })
      ] }),
      activeTab === "watchlist" && /* @__PURE__ */ jsxs("div", { className: "bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-6", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold", children: "내 워치리스트" }),
          /* @__PURE__ */ jsxs("span", { className: "text-sm text-slate-400", children: [
            watchlist.length,
            "개 종목 추적 중"
          ] })
        ] }),
        watchlist.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-20 text-slate-400", children: [
          /* @__PURE__ */ jsx(Bookmark, { className: "w-16 h-16 mx-auto mb-4 opacity-50" }),
          /* @__PURE__ */ jsx("p", { children: "워치리스트가 비어있습니다." }),
          /* @__PURE__ */ jsx("p", { className: "text-sm mt-2", children: "관심 있는 종목을 추가해보세요." })
        ] }) : /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: trades.filter((trade) => watchlist.includes(trade.ticker)).map((trade) => /* @__PURE__ */ jsxs("div", { className: "bg-slate-900/50 rounded-lg p-4 border border-slate-700", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-3", children: [
              /* @__PURE__ */ jsx(CompanyLogo2, { ticker: trade.ticker, size: "sm" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h3", { className: "font-bold text-lg", children: trade.ticker }),
                /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400", children: trade.company })
              ] })
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => {
                  setWatchlist((prev) => prev.filter((t2) => t2 !== trade.ticker));
                },
                className: "text-red-400 hover:text-red-300 p-1",
                children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4" })
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
              /* @__PURE__ */ jsx("span", { children: "최근 거래:" }),
              /* @__PURE__ */ jsxs("div", { className: `flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-semibold ${getTradeTypeColor(trade.tradeType)}`, children: [
                /* @__PURE__ */ jsx("span", { children: getTradeTypeIcon(trade.tradeType) }),
                /* @__PURE__ */ jsx("span", { children: trade.tradeType })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
              /* @__PURE__ */ jsx("span", { children: "추천 매수가:" }),
              /* @__PURE__ */ jsxs("span", { className: "text-green-400", children: [
                "$",
                trade.recommendedBuyPrice
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
              /* @__PURE__ */ jsx("span", { children: "현재가:" }),
              /* @__PURE__ */ jsxs("span", { children: [
                "$",
                trade.currentPrice
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setSelectedTrade(trade),
              className: "w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md text-sm transition",
              children: "상세 보기"
            }
          )
        ] }, trade.id)) })
      ] }),
      activeTab === "patterns" && /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6 mb-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-6", children: [
            /* @__PURE__ */ jsxs("h3", { className: "text-xl font-bold flex items-center space-x-2", children: [
              /* @__PURE__ */ jsx(Activity, { className: "w-6 h-6 text-cyan-400" }),
              /* @__PURE__ */ jsx("span", { children: "종합 투자 메트릭 분석" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-4", children: [
              /* @__PURE__ */ jsx("div", { className: "text-sm text-slate-400", children: "실시간 다중 지표 비교" }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
                /* @__PURE__ */ jsx("div", { className: "w-3 h-3 bg-green-400 rounded-full" }),
                /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-400", children: "상승 추세" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-96", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(
            LineChart,
            {
              data: comparisonChartData,
              onClick: handleChartClick,
              children: [
                /* @__PURE__ */ jsxs("defs", { children: [
                  /* @__PURE__ */ jsxs("linearGradient", { id: "marketCapGradient", x1: "0", y1: "0", x2: "0", y2: "1", children: [
                    /* @__PURE__ */ jsx("stop", { offset: "5%", stopColor: chartColors.primary, stopOpacity: 0.8 }),
                    /* @__PURE__ */ jsx("stop", { offset: "95%", stopColor: chartColors.primary, stopOpacity: 0.1 })
                  ] }),
                  /* @__PURE__ */ jsxs("linearGradient", { id: "aiAccuracyGradient", x1: "0", y1: "0", x2: "0", y2: "1", children: [
                    /* @__PURE__ */ jsx("stop", { offset: "5%", stopColor: chartColors.success, stopOpacity: 0.8 }),
                    /* @__PURE__ */ jsx("stop", { offset: "95%", stopColor: chartColors.success, stopOpacity: 0.1 })
                  ] })
                ] }),
                /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#374151" }),
                /* @__PURE__ */ jsx(
                  XAxis,
                  {
                    dataKey: "date",
                    stroke: "#9CA3AF",
                    fontSize: 12,
                    tickFormatter: (value) => new Date(value).toLocaleDateString("ko", { month: "short", day: "numeric" })
                  }
                ),
                /* @__PURE__ */ jsx(YAxis, { stroke: "#9CA3AF", fontSize: 12, domain: [40, 100] }),
                /* @__PURE__ */ jsx(
                  Tooltip$1,
                  {
                    content: /* @__PURE__ */ jsx(
                      CustomTooltip,
                      {
                        formatter: (value, name) => {
                          if (name === "marketCap") return [`${value}%`, "시가총액 지수"];
                          if (name === "tradeVolume") return [`${value}%`, "거래량 지수"];
                          if (name === "aiAccuracy") return [`${value}%`, "AI 정확도"];
                          if (name === "riskLevel") return [`${value}%`, "리스크 레벨"];
                          if (name === "confidence") return [`${value}%`, "투자 신뢰도"];
                          return [value, name];
                        }
                      }
                    )
                  }
                ),
                /* @__PURE__ */ jsx(Legend, {}),
                /* @__PURE__ */ jsx(
                  Line,
                  {
                    type: "monotone",
                    dataKey: "aiAccuracy",
                    stroke: chartColors.success,
                    strokeWidth: 4,
                    dot: { fill: chartColors.success, strokeWidth: 3, r: 6 },
                    activeDot: { r: 10, stroke: chartColors.success, strokeWidth: 3, fill: "#fff" },
                    animationDuration: 2500,
                    name: "AI 정확도"
                  }
                ),
                /* @__PURE__ */ jsx(
                  Line,
                  {
                    type: "monotone",
                    dataKey: "confidence",
                    stroke: chartColors.info,
                    strokeWidth: 3,
                    strokeDasharray: "8 4",
                    dot: { fill: chartColors.info, strokeWidth: 2, r: 5 },
                    activeDot: { r: 8, stroke: chartColors.info, strokeWidth: 2, fill: "#fff" },
                    animationDuration: 2500,
                    animationBegin: 300,
                    name: "투자 신뢰도"
                  }
                ),
                /* @__PURE__ */ jsx(
                  Line,
                  {
                    type: "monotone",
                    dataKey: "marketCap",
                    stroke: chartColors.primary,
                    strokeWidth: 3,
                    dot: { fill: chartColors.primary, strokeWidth: 2, r: 5 },
                    activeDot: { r: 8, stroke: chartColors.primary, strokeWidth: 2, fill: "#fff" },
                    animationDuration: 2500,
                    animationBegin: 600,
                    name: "시가총액 지수"
                  }
                ),
                /* @__PURE__ */ jsx(
                  Line,
                  {
                    type: "monotone",
                    dataKey: "riskLevel",
                    stroke: chartColors.danger,
                    strokeWidth: 2,
                    strokeDasharray: "5 5",
                    dot: { fill: chartColors.danger, strokeWidth: 2, r: 4 },
                    activeDot: { r: 7, stroke: chartColors.danger, strokeWidth: 2, fill: "#fff" },
                    animationDuration: 2500,
                    animationBegin: 900,
                    name: "리스크 레벨"
                  }
                ),
                /* @__PURE__ */ jsx(
                  Line,
                  {
                    type: "monotone",
                    dataKey: "tradeVolume",
                    stroke: chartColors.warning,
                    strokeWidth: 2,
                    dot: { fill: chartColors.warning, strokeWidth: 2, r: 4 },
                    activeDot: { r: 7, stroke: chartColors.warning, strokeWidth: 2, fill: "#fff" },
                    animationDuration: 2500,
                    animationBegin: 1200,
                    name: "거래량 지수"
                  }
                )
              ]
            },
            `comparison-chart-${chartAnimationKey}`
          ) }) }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-6 border-t border-slate-700", children: [
            /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-xl p-4 text-center border border-green-500/30 hover:border-green-400/50 transition-all duration-300 group cursor-pointer", children: [
              /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center mb-2", children: /* @__PURE__ */ jsx(Brain, { className: "w-5 h-5 text-green-400 group-hover:scale-110 transition-transform" }) }),
              /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-green-400 group-hover:text-green-300", children: "93.1%" }),
              /* @__PURE__ */ jsx("div", { className: "text-xs text-slate-400 mt-1 group-hover:text-slate-300", children: "AI 정확도" }),
              /* @__PURE__ */ jsxs("div", { className: "text-xs text-green-400 flex items-center justify-center space-x-1", children: [
                /* @__PURE__ */ jsx(TrendingUp, { className: "w-3 h-3" }),
                /* @__PURE__ */ jsx("span", { children: "+1.3%" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 rounded-xl p-4 text-center border border-cyan-500/30 hover:border-cyan-400/50 transition-all duration-300 group cursor-pointer", children: [
              /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center mb-2", children: /* @__PURE__ */ jsx(Shield, { className: "w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" }) }),
              /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-cyan-400 group-hover:text-cyan-300", children: "94%" }),
              /* @__PURE__ */ jsx("div", { className: "text-xs text-slate-400 mt-1 group-hover:text-slate-300", children: "투자 신뢰도" }),
              /* @__PURE__ */ jsxs("div", { className: "text-xs text-cyan-400 flex items-center justify-center space-x-1", children: [
                /* @__PURE__ */ jsx(TrendingUp, { className: "w-3 h-3" }),
                /* @__PURE__ */ jsx("span", { children: "+2.1%" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-xl p-4 text-center border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 group cursor-pointer", children: [
              /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center mb-2", children: /* @__PURE__ */ jsx(DollarSign, { className: "w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" }) }),
              /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-blue-400 group-hover:text-blue-300", children: "85%" }),
              /* @__PURE__ */ jsx("div", { className: "text-xs text-slate-400 mt-1 group-hover:text-slate-300", children: "시가총액 지수" }),
              /* @__PURE__ */ jsxs("div", { className: "text-xs text-blue-400 flex items-center justify-center space-x-1", children: [
                /* @__PURE__ */ jsx(TrendingUp, { className: "w-3 h-3" }),
                /* @__PURE__ */ jsx("span", { children: "+2.4%" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-br from-red-500/10 to-red-600/5 rounded-xl p-4 text-center border border-red-500/30 hover:border-red-400/50 transition-all duration-300 group cursor-pointer", children: [
              /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center mb-2", children: /* @__PURE__ */ jsx(AlertTriangle, { className: "w-5 h-5 text-red-400 group-hover:scale-110 transition-transform" }) }),
              /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-red-400 group-hover:text-red-300", children: "54%" }),
              /* @__PURE__ */ jsx("div", { className: "text-xs text-slate-400 mt-1 group-hover:text-slate-300", children: "리스크 레벨" }),
              /* @__PURE__ */ jsxs("div", { className: "text-xs text-green-400 flex items-center justify-center space-x-1", children: [
                /* @__PURE__ */ jsx(TrendingDown, { className: "w-3 h-3" }),
                /* @__PURE__ */ jsx("span", { children: "-2.0%" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 rounded-xl p-4 text-center border border-yellow-500/30 hover:border-yellow-400/50 transition-all duration-300 group cursor-pointer", children: [
              /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center mb-2", children: /* @__PURE__ */ jsx(BarChart3, { className: "w-5 h-5 text-yellow-400 group-hover:scale-110 transition-transform" }) }),
              /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-yellow-400 group-hover:text-yellow-300", children: "62%" }),
              /* @__PURE__ */ jsx("div", { className: "text-xs text-slate-400 mt-1 group-hover:text-slate-300", children: "거래량 지수" }),
              /* @__PURE__ */ jsxs("div", { className: "text-xs text-yellow-400 flex items-center justify-center space-x-1", children: [
                /* @__PURE__ */ jsx(TrendingUp, { className: "w-3 h-3" }),
                /* @__PURE__ */ jsx("span", { children: "+6.9%" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "mt-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
              /* @__PURE__ */ jsx("div", { className: "w-2 h-2 bg-green-400 rounded-full animate-pulse" }),
              /* @__PURE__ */ jsx("span", { className: "text-sm text-slate-300", children: "실시간 업데이트" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "text-xs text-slate-400", children: [
              "마지막 업데이트: ",
              (/* @__PURE__ */ new Date()).toLocaleTimeString("ko")
            ] })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6", children: [
            /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between mb-4", children: /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold flex items-center space-x-2", children: [
              /* @__PURE__ */ jsx(BarChart3, { className: "w-5 h-5 text-pink-400" }),
              /* @__PURE__ */ jsx("span", { children: "섹터별 분포" })
            ] }) }),
            /* @__PURE__ */ jsx("div", { className: "h-64", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(PieChart$1, { children: [
              /* @__PURE__ */ jsx(
                Pie,
                {
                  data: sectorDistributionData,
                  cx: "50%",
                  cy: "50%",
                  outerRadius: 80,
                  fill: "#8884d8",
                  dataKey: "value",
                  label: ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`,
                  labelLine: false,
                  children: sectorDistributionData.map((entry, index) => /* @__PURE__ */ jsx(Cell, { fill: chartColors.gradient[index % chartColors.gradient.length] }, `cell-${index}`))
                }
              ),
              /* @__PURE__ */ jsx(
                Tooltip$1,
                {
                  contentStyle: {
                    backgroundColor: "#1F2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#F9FAFB"
                  },
                  formatter: (value, name) => {
                    var _a;
                    return [`${value}% (${((_a = sectorDistributionData.find((d) => d.value === value)) == null ? void 0 : _a.count) || 0}건)`, "비율"];
                  }
                }
              )
            ] }) }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6", children: [
            /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between mb-4", children: /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold flex items-center space-x-2", children: [
              /* @__PURE__ */ jsx(Brain, { className: "w-5 h-5 text-cyan-400" }),
              /* @__PURE__ */ jsx("span", { children: "AI 정확도 추이" })
            ] }) }),
            /* @__PURE__ */ jsx("div", { className: "h-64", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(AreaChart, { data: accuracyTrendData, children: [
              /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("linearGradient", { id: "accuracyGradient", x1: "0", y1: "0", x2: "0", y2: "1", children: [
                /* @__PURE__ */ jsx("stop", { offset: "5%", stopColor: chartColors.info, stopOpacity: 0.8 }),
                /* @__PURE__ */ jsx("stop", { offset: "95%", stopColor: chartColors.info, stopOpacity: 0.1 })
              ] }) }),
              /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#374151" }),
              /* @__PURE__ */ jsx(XAxis, { dataKey: "week", stroke: "#9CA3AF", fontSize: 12 }),
              /* @__PURE__ */ jsx(YAxis, { domain: [80, 100], stroke: "#9CA3AF", fontSize: 12 }),
              /* @__PURE__ */ jsx(
                Tooltip$1,
                {
                  contentStyle: {
                    backgroundColor: "#1F2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#F9FAFB"
                  },
                  formatter: (value, name) => {
                    if (name === "accuracy") return [`${value}%`, "AI 정확도"];
                    if (name === "predictions") return [`${value}건`, "예측 횟수"];
                    return [value, name];
                  }
                }
              ),
              /* @__PURE__ */ jsx(
                Area,
                {
                  type: "monotone",
                  dataKey: "accuracy",
                  stroke: chartColors.info,
                  fillOpacity: 1,
                  fill: "url(#accuracyGradient)",
                  strokeWidth: 2
                }
              )
            ] }) }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6", children: [
            /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between mb-4", children: /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold flex items-center space-x-2", children: [
              /* @__PURE__ */ jsx(Target, { className: "w-5 h-5 text-green-400" }),
              /* @__PURE__ */ jsx("span", { children: "거래 유형별 성과" })
            ] }) }),
            /* @__PURE__ */ jsx("div", { className: "h-64", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(BarChart, { data: tradeTypePerformanceData, layout: "horizontal", children: [
              /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#374151" }),
              /* @__PURE__ */ jsx(XAxis, { type: "number", stroke: "#9CA3AF", fontSize: 12 }),
              /* @__PURE__ */ jsx(YAxis, { dataKey: "type", type: "category", stroke: "#9CA3AF", fontSize: 10, width: 80 }),
              /* @__PURE__ */ jsx(
                Tooltip$1,
                {
                  contentStyle: {
                    backgroundColor: "#1F2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#F9FAFB"
                  },
                  formatter: (value, name) => {
                    if (name === "avgReturn") return [`${value}%`, "평균 수익률"];
                    if (name === "successRate") return [`${value}%`, "성공률"];
                    return [value, name];
                  }
                }
              ),
              /* @__PURE__ */ jsx(Bar, { dataKey: "avgReturn", fill: chartColors.success, radius: [0, 4, 4, 0] })
            ] }) }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
              /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold flex items-center space-x-2", children: [
                /* @__PURE__ */ jsx(Timer, { className: "w-5 h-5 text-orange-400" }),
                /* @__PURE__ */ jsx("span", { children: "시간대별 거래 패턴" })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "text-sm text-slate-400", children: "거래 집중 시간" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "h-80", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(ComposedChart, { data: timePatternData, children: [
              /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#374151" }),
              /* @__PURE__ */ jsx(XAxis, { dataKey: "hour", stroke: "#9CA3AF", fontSize: 12 }),
              /* @__PURE__ */ jsx(YAxis, { yAxisId: "left", stroke: "#9CA3AF", fontSize: 12 }),
              /* @__PURE__ */ jsx(YAxis, { yAxisId: "right", orientation: "right", stroke: "#9CA3AF", fontSize: 12 }),
              /* @__PURE__ */ jsx(
                Tooltip$1,
                {
                  contentStyle: {
                    backgroundColor: "#1F2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#F9FAFB"
                  },
                  formatter: (value, name) => {
                    if (name === "buyCount") return [`${value}건`, "매수 거래"];
                    if (name === "sellCount") return [`${value}건`, "매도 거래"];
                    if (name === "totalValue") return [`$${value}M`, "총 거래금액"];
                    return [value, name];
                  }
                }
              ),
              /* @__PURE__ */ jsx(Legend, {}),
              /* @__PURE__ */ jsx(Bar, { yAxisId: "left", dataKey: "buyCount", fill: chartColors.success, name: "매수", radius: [2, 2, 0, 0] }),
              /* @__PURE__ */ jsx(Bar, { yAxisId: "left", dataKey: "sellCount", fill: chartColors.danger, name: "매도", radius: [2, 2, 0, 0] }),
              /* @__PURE__ */ jsx(Line, { yAxisId: "right", type: "monotone", dataKey: "totalValue", stroke: chartColors.warning, strokeWidth: 3, dot: { fill: chartColors.warning, strokeWidth: 2, r: 6 }, name: "총 거래금액" })
            ] }) }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
              /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold flex items-center space-x-2", children: [
                /* @__PURE__ */ jsx(Shield, { className: "w-5 h-5 text-red-400" }),
                /* @__PURE__ */ jsx("span", { children: "리스크-수익률 매트릭스" })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "text-sm text-slate-400", children: "버블 크기 = 거래금액" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "h-80", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(ScatterChart, { data: riskReturnData, children: [
              /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#374151" }),
              /* @__PURE__ */ jsx(XAxis, { dataKey: "x", name: "리스크", stroke: "#9CA3AF", fontSize: 12, domain: [0, 10] }),
              /* @__PURE__ */ jsx(YAxis, { dataKey: "y", name: "수익률", stroke: "#9CA3AF", fontSize: 12, domain: [-10, 10] }),
              /* @__PURE__ */ jsx(
                Tooltip$1,
                {
                  contentStyle: {
                    backgroundColor: "#1F2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#F9FAFB"
                  },
                  formatter: (value, name) => {
                    if (name === "x") return [`${value}/10`, "리스크 레벨"];
                    if (name === "y") return [`${value}%`, "예상 수익률"];
                    if (name === "z") return [`$${value.toFixed(1)}M`, "거래금액"];
                    return [value, name];
                  },
                  labelFormatter: (label, payload) => {
                    var _a;
                    const point = (_a = payload == null ? void 0 : payload[0]) == null ? void 0 : _a.payload;
                    return point ? `${point.company}` : label;
                  }
                }
              ),
              /* @__PURE__ */ jsx(Scatter, { dataKey: "y", fill: chartColors.primary, children: riskReturnData.map((entry, index) => /* @__PURE__ */ jsx(Cell, { fill: entry.color }, `cell-${index}`)) })
            ] }) }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-6", children: [
          /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold mb-4 flex items-center space-x-2", children: [
            /* @__PURE__ */ jsx(Brain, { className: "w-5 h-5 text-purple-400" }),
            /* @__PURE__ */ jsx("span", { children: "AI 패턴 분석 인사이트" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "bg-slate-800/50 rounded-lg p-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2 mb-2", children: [
                /* @__PURE__ */ jsx(TrendingUp, { className: "w-4 h-4 text-green-400" }),
                /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-green-400", children: "최고 성과 패턴" })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-300", children: "Tesla CEO 매수 패턴이 최고 수익률 (+8.5%) 기록" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-slate-800/50 rounded-lg p-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2 mb-2", children: [
                /* @__PURE__ */ jsx(Activity, { className: "w-4 h-4 text-orange-400" }),
                /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-orange-400", children: "거래 집중 시간" })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-300", children: "오후 3-4시 대량 거래 집중 (총 $138.9M)" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-slate-800/50 rounded-lg p-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2 mb-2", children: [
                /* @__PURE__ */ jsx(Brain, { className: "w-4 h-4 text-cyan-400" }),
                /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-cyan-400", children: "AI 정확도" })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-300", children: "이번 주 예측 정확도 91.8% 달성" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-slate-800/50 rounded-lg p-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2 mb-2", children: [
                /* @__PURE__ */ jsx(Shield, { className: "w-4 h-4 text-red-400" }),
                /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-red-400", children: "리스크 경고" })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-300", children: "NVIDIA 고위험 매도 신호 감지" })
            ] })
          ] })
        ] })
      ] }),
      activeTab === "alerts" && /* @__PURE__ */ jsxs("div", { className: "bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold mb-4", children: "스마트 알림 센터" }),
        /* @__PURE__ */ jsx("div", { className: "space-y-4", children: recentAlerts.map((alert2) => /* @__PURE__ */ jsxs("div", { className: "bg-slate-900/50 rounded-lg p-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
            /* @__PURE__ */ jsx("span", { className: "font-bold", children: alert2.ticker }),
            /* @__PURE__ */ jsx("span", { className: "text-sm text-slate-400", children: alert2.time })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-slate-300", children: alert2.message }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mt-3", children: [
            /* @__PURE__ */ jsx("span", { className: `px-2 py-1 rounded-full text-xs ${alert2.severity === "high" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"}`, children: alert2.severity === "high" ? "높음" : "보통" }),
            /* @__PURE__ */ jsxs("div", { className: "flex space-x-2", children: [
              /* @__PURE__ */ jsx("button", { className: "text-blue-400 text-xs hover:underline", children: "상세보기" }),
              /* @__PURE__ */ jsx("button", { className: "text-slate-400 text-xs hover:underline", children: "무시" })
            ] })
          ] })
        ] }, alert2.id)) })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur border-t border-slate-700 p-4", children: /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "오늘 수집된 거래" }),
          /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-white", children: "247" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "추천 매수가격 도달" }),
          /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-green-400", children: "3개" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "AI 예측 정확도" }),
          /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-green-400", children: "91.2%" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-3", children: [
        /* @__PURE__ */ jsx("button", { className: "bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition", children: "🚨 긴급 알림 (3)" }),
        /* @__PURE__ */ jsx("button", { className: "bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm transition", children: "💰 매수가격 알림" }),
        /* @__PURE__ */ jsx("button", { className: "bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition", children: "🤖 AI 추천 실행" })
      ] })
    ] }) }) }),
    selectedTrade && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4", children: /* @__PURE__ */ jsx("div", { className: "bg-slate-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto", children: /* @__PURE__ */ jsxs("div", { className: "p-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-4", children: [
          /* @__PURE__ */ jsx(CompanyLogo2, { ticker: selectedTrade.ticker, size: "lg" }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("h2", { className: "text-xl font-bold", children: [
              "상세 분석: ",
              selectedTrade.ticker
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400", children: selectedTrade.company })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: `flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-semibold ${getTradeTypeColor(selectedTrade.tradeType)}`, children: [
            /* @__PURE__ */ jsx("span", { children: getTradeTypeIcon(selectedTrade.tradeType) }),
            /* @__PURE__ */ jsx("span", { children: selectedTrade.tradeType })
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setSelectedTrade(null),
            className: "text-slate-400 hover:text-white",
            children: "✕"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-slate-900/50 rounded-lg p-4 mb-6", children: [
        /* @__PURE__ */ jsxs("h3", { className: "font-bold mb-3 flex items-center space-x-2", children: [
          /* @__PURE__ */ jsx("span", { children: "💰 AI 추천 가격 분석" }),
          /* @__PURE__ */ jsx("span", { className: `text-xs px-2 py-1 rounded-full ${getRecommendationColor(selectedTrade.strategicRecommendation)} bg-opacity-20`, children: selectedTrade.strategicRecommendation.replace(/_/g, " ") })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mb-4", children: /* @__PURE__ */ jsxs("div", { className: "bg-slate-800/50 rounded-lg p-4", children: [
          /* @__PURE__ */ jsxs("h4", { className: "text-sm font-semibold mb-3 text-slate-300 flex items-center space-x-2", children: [
            /* @__PURE__ */ jsx(BarChart3, { className: "w-4 h-4" }),
            /* @__PURE__ */ jsx("span", { children: "가격 비교 차트" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-48", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(
            LineChart,
            {
              data: [
                { category: "내부자 거래가", value: selectedTrade.price },
                { category: "AI 추천 매수가", value: selectedTrade.recommendedBuyPrice },
                { category: "현재 시장가", value: selectedTrade.currentPrice },
                { category: "AI 추천 매도가", value: selectedTrade.currentPrice * (1 + parseFloat(selectedTrade.impactPrediction.replace("%", "")) / 100) }
              ],
              children: [
                /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#374151" }),
                /* @__PURE__ */ jsx(XAxis, { dataKey: "category", stroke: "#9CA3AF", fontSize: 10 }),
                /* @__PURE__ */ jsx(YAxis, { stroke: "#9CA3AF", fontSize: 12 }),
                /* @__PURE__ */ jsx(
                  Tooltip$1,
                  {
                    contentStyle: {
                      backgroundColor: "#1F2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                      color: "#F9FAFB"
                    },
                    formatter: (value) => [`$${value.toFixed(2)}`, "가격"]
                  }
                ),
                /* @__PURE__ */ jsx(
                  Line,
                  {
                    type: "monotone",
                    dataKey: "value",
                    stroke: chartColors.primary,
                    strokeWidth: 3,
                    dot: (props) => {
                      const colors = [chartColors.primary, chartColors.success, chartColors.warning, chartColors.danger];
                      return /* @__PURE__ */ jsx(
                        "circle",
                        {
                          cx: props.cx,
                          cy: props.cy,
                          r: 6,
                          fill: colors[props.index],
                          stroke: "#fff",
                          strokeWidth: 2
                        }
                      );
                    },
                    activeDot: { r: 8, stroke: chartColors.primary, strokeWidth: 2, fill: "#fff" },
                    animationDuration: 2e3
                  }
                )
              ]
            },
            `modal-price-chart-${selectedTrade.ticker}`
          ) }) })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-slate-900/50 rounded-lg p-4 mb-6", children: [
        /* @__PURE__ */ jsx("h3", { className: "font-bold mb-3", children: "🤖 AI 심층 분석" }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-300 mb-4", children: selectedTrade.aiInsight }),
        /* @__PURE__ */ jsxs("div", { className: "bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 mb-4", children: [
          /* @__PURE__ */ jsx("h4", { className: "font-semibold text-purple-400 mb-2", children: "🧠 고급 AI 인사이트" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-300 mb-3", children: selectedTrade.deepInsight }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 mb-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "bg-slate-800/50 rounded p-2", children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "패턴 인식" }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
                /* @__PURE__ */ jsx("div", { className: "flex-1 bg-slate-700 rounded-full h-2", children: /* @__PURE__ */ jsx(
                  "div",
                  {
                    className: "bg-green-400 h-2 rounded-full",
                    style: { width: `${selectedTrade.aiConfidenceMetrics.patternRecognition}%` }
                  }
                ) }),
                /* @__PURE__ */ jsxs("span", { className: "text-xs font-bold text-green-400", children: [
                  selectedTrade.aiConfidenceMetrics.patternRecognition,
                  "%"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-slate-800/50 rounded p-2", children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "감정 분석" }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
                /* @__PURE__ */ jsx("div", { className: "flex-1 bg-slate-700 rounded-full h-2", children: /* @__PURE__ */ jsx(
                  "div",
                  {
                    className: "bg-blue-400 h-2 rounded-full",
                    style: { width: `${selectedTrade.aiConfidenceMetrics.sentimentAnalysis}%` }
                  }
                ) }),
                /* @__PURE__ */ jsxs("span", { className: "text-xs font-bold text-blue-400", children: [
                  selectedTrade.aiConfidenceMetrics.sentimentAnalysis,
                  "%"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-slate-800/50 rounded p-2", children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "펀더멘털 정렬" }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
                /* @__PURE__ */ jsx("div", { className: "flex-1 bg-slate-700 rounded-full h-2", children: /* @__PURE__ */ jsx(
                  "div",
                  {
                    className: "bg-yellow-400 h-2 rounded-full",
                    style: { width: `${selectedTrade.aiConfidenceMetrics.fundamentalAlignment}%` }
                  }
                ) }),
                /* @__PURE__ */ jsxs("span", { className: "text-xs font-bold text-yellow-400", children: [
                  selectedTrade.aiConfidenceMetrics.fundamentalAlignment,
                  "%"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-slate-800/50 rounded p-2", children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "기술적 신호" }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-2", children: [
                /* @__PURE__ */ jsx("div", { className: "flex-1 bg-slate-700 rounded-full h-2", children: /* @__PURE__ */ jsx(
                  "div",
                  {
                    className: "bg-purple-400 h-2 rounded-full",
                    style: { width: `${selectedTrade.aiConfidenceMetrics.technicalSignals}%` }
                  }
                ) }),
                /* @__PURE__ */ jsxs("span", { className: "text-xs font-bold text-purple-400", children: [
                  selectedTrade.aiConfidenceMetrics.technicalSignals,
                  "%"
                ] })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3 mb-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-slate-800/50 rounded-lg p-3", children: [
            /* @__PURE__ */ jsx("h4", { className: "font-semibold text-orange-400 mb-2", children: "🧭 심리적 패턴" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-300", children: selectedTrade.psychologyPattern.replace(/_/g, " ") }),
            /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-400 mt-1", children: [
              "시장 타이밍: ",
              selectedTrade.marketTiming.replace(/_/g, " ")
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-slate-800/50 rounded-lg p-3", children: [
            /* @__PURE__ */ jsx("h4", { className: "font-semibold text-cyan-400 mb-2", children: "기관 심리" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-300", children: selectedTrade.institutionalSentiment.replace(/_/g, " ") }),
            /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-400 mt-1", children: [
              "거래량 이상: ",
              selectedTrade.volumeAnomaly,
              "x 평소"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4", children: [
          /* @__PURE__ */ jsx("h4", { className: "font-semibold text-red-400 mb-2", children: "⚡ 리스크 매트릭스" }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2 text-xs", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsx("span", { children: "변동성 리스크:" }),
              /* @__PURE__ */ jsxs("span", { className: `font-bold ${selectedTrade.riskMatrix.volatility > 0.3 ? "text-red-400" : "text-green-400"}`, children: [
                (selectedTrade.riskMatrix.volatility * 100).toFixed(1),
                "%"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsx("span", { children: "시장 상관성:" }),
              /* @__PURE__ */ jsxs("span", { className: "font-bold text-blue-400", children: [
                (selectedTrade.riskMatrix.marketCorrelation * 100).toFixed(1),
                "%"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsx("span", { children: "유동성 리스크:" }),
              /* @__PURE__ */ jsxs("span", { className: `font-bold ${selectedTrade.riskMatrix.liquidityRisk > 0.2 ? "text-red-400" : "text-green-400"}`, children: [
                (selectedTrade.riskMatrix.liquidityRisk * 100).toFixed(1),
                "%"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsx("span", { children: "펀더멘털 리스크:" }),
              /* @__PURE__ */ jsxs("span", { className: `font-bold ${selectedTrade.riskMatrix.fundamentalRisk > 0.5 ? "text-red-400" : "text-yellow-400"}`, children: [
                (selectedTrade.riskMatrix.fundamentalRisk * 100).toFixed(1),
                "%"
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-green-500/10 border border-green-500/20 rounded-lg p-3 mb-4", children: [
          /* @__PURE__ */ jsx("h4", { className: "font-semibold text-green-400 mb-2", children: "🎯 AI 전략 추천" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2 text-sm", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsx("span", { children: "투자 추천:" }),
              /* @__PURE__ */ jsx("span", { className: `font-bold ${getRecommendationColor(selectedTrade.strategicRecommendation)}`, children: selectedTrade.strategicRecommendation.replace(/_/g, " ") })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsx("span", { children: "진입 전략:" }),
              /* @__PURE__ */ jsx("span", { className: "font-bold text-blue-400", children: selectedTrade.entryStrategy.replace(/_/g, " ") })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsx("span", { children: "포지션 크기:" }),
              /* @__PURE__ */ jsx("span", { className: "font-bold text-yellow-400", children: selectedTrade.positionSizing })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-blue-500/10 border border-blue-500/20 rounded-lg p-3", children: [
          /* @__PURE__ */ jsx("h4", { className: "font-semibold text-blue-400 mb-2", children: "📈 유사 패턴 분석" }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-300", children: [
            "과거 ",
            selectedTrade.similarTrades,
            "건의 유사한 ",
            selectedTrade.insider,
            " 거래에서 평균 ",
            /* @__PURE__ */ jsxs("span", { className: `font-bold ${selectedTrade.avgReturnAfterSimilar > 0 ? "text-green-400" : "text-red-400"}`, children: [
              selectedTrade.avgReturnAfterSimilar > 0 ? "+" : "",
              selectedTrade.avgReturnAfterSimilar,
              "%"
            ] }),
            "의 수익률을 기록했습니다."
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-400 mt-2", children: [
            "현재 예측 정확도: ",
            selectedTrade.predictionAccuracy,
            "% | 연관 섹터: ",
            selectedTrade.correlatedSectors.join(", ")
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex space-x-3", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => {
              setSelectedCompanyForAlert(selectedTrade.ticker);
              setShowAlertModal(true);
            },
            className: "flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm transition flex items-center justify-center space-x-2",
            children: [
              /* @__PURE__ */ jsx(Mail, { className: "w-4 h-4" }),
              /* @__PURE__ */ jsx("span", { children: "이메일 알림 설정" })
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setShowWatchlistModal(true),
            className: "flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm transition flex items-center justify-center space-x-2",
            children: [
              /* @__PURE__ */ jsx(Bookmark, { className: "w-4 h-4" }),
              /* @__PURE__ */ jsx("span", { children: "워치리스트 추가" })
            ]
          }
        ),
        /* @__PURE__ */ jsxs("button", { className: "flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg text-sm transition flex items-center justify-center space-x-2", children: [
          /* @__PURE__ */ jsx(Calculator, { className: "w-4 h-4" }),
          /* @__PURE__ */ jsx("span", { children: "포지션 계산기" })
        ] })
      ] })
    ] }) }) }),
    showAlertModal && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4", children: /* @__PURE__ */ jsx("div", { className: "bg-slate-800 rounded-xl max-w-md w-full", children: /* @__PURE__ */ jsxs("div", { className: "p-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-6", children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-xl font-bold flex items-center space-x-2", children: [
          /* @__PURE__ */ jsx(Mail, { className: "w-6 h-6 text-blue-400" }),
          /* @__PURE__ */ jsx("span", { children: "이메일 알림 설정" })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setShowAlertModal(false),
            className: "text-slate-400 hover:text-white",
            children: /* @__PURE__ */ jsx(X, { className: "w-5 h-5" })
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-2", children: "알림 받을 이메일" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "email",
              value: userEmail,
              disabled: true,
              className: "w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-2", children: "회사 선택" }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: selectedCompanyForAlert,
              onChange: (e) => setSelectedCompanyForAlert(e.target.value),
              className: "w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm",
              children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "회사를 선택하세요" }),
                trades.map((trade) => /* @__PURE__ */ jsxs("option", { value: trade.ticker, children: [
                  trade.ticker,
                  " - ",
                  trade.company
                ] }, trade.ticker))
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-blue-500/10 border border-blue-500/20 rounded-lg p-3", children: [
          /* @__PURE__ */ jsx("h4", { className: "font-semibold text-blue-400 mb-2", children: "알림 조건" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2 text-sm text-slate-300", children: [
            /* @__PURE__ */ jsxs("label", { className: "flex items-center space-x-2", children: [
              /* @__PURE__ */ jsx("input", { type: "checkbox", defaultChecked: true, className: "rounded" }),
              /* @__PURE__ */ jsx("span", { children: "내부자 거래 발생 시" })
            ] }),
            /* @__PURE__ */ jsxs("label", { className: "flex items-center space-x-2", children: [
              /* @__PURE__ */ jsx("input", { type: "checkbox", defaultChecked: true, className: "rounded" }),
              /* @__PURE__ */ jsx("span", { children: "대량 거래 ($10M+)" })
            ] }),
            /* @__PURE__ */ jsxs("label", { className: "flex items-center space-x-2", children: [
              /* @__PURE__ */ jsx("input", { type: "checkbox", className: "rounded" }),
              /* @__PURE__ */ jsx("span", { children: "추천 매수가격 도달 시" })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex space-x-3 mt-6", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setShowAlertModal(false),
            className: "flex-1 bg-slate-600 hover:bg-slate-500 text-white py-2 px-4 rounded-lg text-sm transition",
            children: "취소"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => {
              alert(`${selectedCompanyForAlert} 알림이 ${userEmail}로 설정되었습니다!`);
              setShowAlertModal(false);
            },
            disabled: !selectedCompanyForAlert,
            className: "flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg text-sm transition",
            children: "알림 설정"
          }
        )
      ] })
    ] }) }) }),
    showWatchlistModal && selectedTrade && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4", children: /* @__PURE__ */ jsx("div", { className: "bg-slate-800 rounded-xl max-w-md w-full", children: /* @__PURE__ */ jsxs("div", { className: "p-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-6", children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-xl font-bold flex items-center space-x-2", children: [
          /* @__PURE__ */ jsx(Bookmark, { className: "w-6 h-6 text-green-400" }),
          /* @__PURE__ */ jsx("span", { children: "워치리스트 추가" })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setShowWatchlistModal(false),
            className: "text-slate-400 hover:text-white",
            children: /* @__PURE__ */ jsx(X, { className: "w-5 h-5" })
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "text-center space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-slate-900/50 rounded-lg p-4", children: [
          /* @__PURE__ */ jsx("div", { className: "flex justify-center mb-4", children: /* @__PURE__ */ jsx(CompanyLogo2, { ticker: selectedTrade.ticker, size: "lg" }) }),
          /* @__PURE__ */ jsx("h3", { className: "font-bold text-lg", children: selectedTrade.ticker }),
          /* @__PURE__ */ jsx("p", { className: "text-slate-400", children: selectedTrade.company }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-500 mt-2", children: [
            selectedTrade.insider,
            " • ",
            selectedTrade.position
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-green-500/10 border border-green-500/20 rounded-lg p-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center space-x-2 mb-2", children: [
            /* @__PURE__ */ jsx(Check, { className: "w-5 h-5 text-green-400" }),
            /* @__PURE__ */ jsx("span", { className: "font-semibold text-green-400", children: "워치리스트 추가 완료!" })
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-300", children: [
            "이제 '내 워치리스트' 탭에서 ",
            selectedTrade.ticker,
            "의 내부자 거래 정보만 따로 볼 수 있습니다."
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex space-x-3 mt-6", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setShowWatchlistModal(false),
            className: "flex-1 bg-slate-600 hover:bg-slate-500 text-white py-2 px-4 rounded-lg text-sm transition",
            children: "닫기"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => {
              if (!watchlist.includes(selectedTrade.ticker)) {
                setWatchlist((prev) => [...prev, selectedTrade.ticker]);
              }
              setActiveTab("watchlist");
              setShowWatchlistModal(false);
            },
            className: "flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm transition",
            children: "워치리스트 보기"
          }
        )
      ] })
    ] }) }) })
  ] });
};
const Checkbox = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  CheckboxPrimitive.Root,
  {
    ref,
    className: cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    ),
    ...props,
    children: /* @__PURE__ */ jsx(
      CheckboxPrimitive.Indicator,
      {
        className: cn("flex items-center justify-center text-current"),
        children: /* @__PURE__ */ jsx(Check, { className: "h-4 w-4" })
      }
    )
  }
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;
function PremiumCheckout() {
  const [selectedPlan, setSelectedPlan] = useState("monthly");
  const [isProcessing, setIsProcessing] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const isSubmittingRef = useRef(false);
  const { toast: toast2 } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  useEffect(() => {
    if (user && (user.subscriptionTier === "insider_pro" || user.subscriptionTier === "insider") && (user.subscriptionStatus === "active" || user.subscriptionStatus === "trialing")) {
      toast2({
        title: "이미 Insider 구독 중입니다",
        description: "트레이딩 페이지로 이동합니다."
      });
      setTimeout(() => setLocation("/trades"), 1500);
    }
  }, [user, setLocation, toast2]);
  const plans = {
    monthly: {
      name: "Insider",
      price: 14,
      priceId: "price_1SPBb1Q9br8aQ595KTOAcBfO",
      interval: "/month",
      billingInterval: "월간 자동결제",
      description: "Real-time insider trading data & AI analysis",
      features: [
        "Real-time insider trade alerts (no 48h delay)",
        "Pure buy/sell signals only (no grants, options, awards)",
        "AI-powered trade analysis & predictions",
        "Advanced pattern detection & signals",
        "Executive trade tracking (CEO, CFO, etc.)",
        "Live data updates & push notifications",
        "Historical insider performance analytics",
        "Exclusive market intelligence reports"
      ],
      savings: null
    },
    yearly: {
      name: "Insider",
      price: 112,
      originalPrice: 168,
      priceId: "price_1SPBdLQ9br8aQ595n0dKEOLv",
      interval: "/year",
      billingInterval: "연간 자동결제",
      pricePerMonth: 9.33,
      description: "Real-time insider trading data & AI analysis",
      features: [
        "Real-time insider trade alerts (no 48h delay)",
        "Pure buy/sell signals only (no grants, options, awards)",
        "AI-powered trade analysis & predictions",
        "Advanced pattern detection & signals",
        "Executive trade tracking (CEO, CFO, etc.)",
        "Live data updates & push notifications",
        "Historical insider performance analytics",
        "Exclusive market intelligence reports"
      ],
      savings: "Save 33% with annual billing",
      discount: "33% OFF"
    }
  };
  const currentPlan = plans[selectedPlan];
  const trialPeriodKo = selectedPlan === "yearly" ? "7일" : "3일";
  const trialPeriodEn = selectedPlan === "yearly" ? "7 days" : "3 days";
  const hasUsedTrial = (user == null ? void 0 : user.hasUsedTrial) || false;
  const showTrialInfo = !hasUsedTrial;
  const handleCheckout = async () => {
    if (showTrialInfo && !agreedToTerms) {
      toast2({
        title: "약관 동의 필요",
        description: "자동결제 및 환불 정책에 동의해주세요.",
        variant: "destructive"
      });
      return;
    }
    if (isSubmittingRef.current) {
      console.log("⚠️ Already submitting, ignoring duplicate click");
      return;
    }
    if (!user) {
      console.error("❌ No user found when attempting checkout");
      toast2({
        title: "로그인 필요",
        description: "구독하려면 먼저 로그인해주세요.",
        variant: "destructive"
      });
      setLocation("/login?redirect=/premium-checkout");
      return;
    }
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.error("❌ No auth token found in localStorage");
      toast2({
        title: "세션 만료",
        description: "로그인 세션이 만료되었습니다. 다시 로그인해주세요.",
        variant: "destructive"
      });
      setLocation("/login?redirect=/premium-checkout");
      return;
    }
    isSubmittingRef.current = true;
    setIsProcessing(true);
    console.log("🚀 Starting checkout process", {
      userId: user.id,
      email: user.email,
      plan: selectedPlan,
      priceId: currentPlan.priceId
    });
    try {
      const response = await apiRequest("POST", "/api/create-subscription", {
        priceId: currentPlan.priceId
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `서버 오류: ${response.status}`);
      }
      const data = await response.json();
      console.log("✅ Checkout session created:", data);
      if (data.url) {
        console.log("🔗 Redirecting to Stripe Checkout:", data.url);
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error) {
      console.error("❌ Error creating checkout session:", error);
      if (error.message && error.message.includes("이미 활성 구독이 있습니다")) {
        toast2({
          title: "이미 구독 중입니다",
          description: "이미 활성 구독이 있습니다. 대시보드로 이동합니다.",
          variant: "default"
        });
        setTimeout(() => setLocation("/dashboard"), 2e3);
      } else {
        toast2({
          title: "결제 오류",
          description: error.message || "결제 세션을 생성할 수 없습니다. 다시 시도해주세요.",
          variant: "destructive"
        });
      }
      isSubmittingRef.current = false;
      setIsProcessing(false);
    }
  };
  if (!authLoading && !user) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 flex items-center justify-center", children: /* @__PURE__ */ jsxs(Card, { className: "max-w-md w-full", children: [
      /* @__PURE__ */ jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsx(CardTitle, { className: "text-center", children: "로그인 필요" }),
        /* @__PURE__ */ jsx(CardDescription, { className: "text-center", children: "구독하려면 먼저 로그인해주세요" })
      ] }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx(
        Button,
        {
          onClick: () => setLocation("/login?redirect=/premium-checkout"),
          className: "w-full",
          children: "로그인 페이지로 이동"
        }
      ) })
    ] }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-[#0a0a0f] p-4 relative overflow-hidden", children: [
    /* @__PURE__ */ jsx(StripeMeshGradient, { variant: "purple", opacity: 0.4, animate: true }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-5xl mx-auto relative z-10", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-16 mt-8", children: [
        /* @__PURE__ */ jsxs(Badge, { className: "mb-8 px-4 py-2 text-xs font-medium\n                           bg-white/10 text-white border border-white/20\n                           backdrop-blur-xl rounded-full shadow-lg shadow-purple-500/10", children: [
          /* @__PURE__ */ jsx(Sparkles, { className: "inline-block w-3 h-3 mr-2" }),
          "Premium Subscription"
        ] }),
        /* @__PURE__ */ jsx("h1", { className: "text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-white tracking-tight\n                        bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/40", "data-testid": "text-checkout-title", children: "Upgrade to Insider" }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-400 max-w-2xl mx-auto text-lg md:text-xl leading-relaxed", children: showTrialInfo ? `Get ${trialPeriodEn} free trial + real-time insider trading alerts` : "Get real-time insider trading alerts and never miss a profitable opportunity" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-2 gap-8 items-start", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsx("div", { className: "flex justify-center mb-6", children: /* @__PURE__ */ jsxs("div", { className: "inline-flex rounded-lg bg-slate-800 p-1 border border-slate-700", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setSelectedPlan("monthly"),
                className: `px-6 py-3 rounded-md font-semibold transition-all ${selectedPlan === "monthly" ? "bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg" : "text-slate-400 hover:text-white"}`,
                children: "Monthly"
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => setSelectedPlan("yearly"),
                className: `relative px-6 py-3 rounded-md font-semibold transition-all ${selectedPlan === "yearly" ? "bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg" : "text-slate-400 hover:text-white"}`,
                children: [
                  "Yearly",
                  selectedPlan !== "yearly" && /* @__PURE__ */ jsx("span", { className: "absolute -top-2 -right-2 bg-amber-500 text-slate-900 text-xs font-bold px-2 py-0.5 rounded-full", children: "-33%" })
                ]
              }
            )
          ] }) }),
          /* @__PURE__ */ jsxs(Card, { className: "border-2 border-amber-500 bg-gradient-to-br from-slate-800 to-slate-900", children: [
            /* @__PURE__ */ jsxs(CardHeader, { children: [
              /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
                  /* @__PURE__ */ jsx(CardTitle, { className: "text-white text-2xl", children: currentPlan.name }),
                  selectedPlan === "yearly" && /* @__PURE__ */ jsxs(Badge, { variant: "default", className: "bg-amber-500 text-slate-900 font-bold", children: [
                    /* @__PURE__ */ jsx(Zap, { className: "w-3 h-3 mr-1" }),
                    plans.yearly.discount
                  ] })
                ] }),
                /* @__PURE__ */ jsx(CardDescription, { className: "text-slate-300 text-base", children: currentPlan.description })
              ] }) }),
              /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
                selectedPlan === "yearly" && /* @__PURE__ */ jsxs("div", { className: "flex items-baseline gap-2 mb-2", children: [
                  /* @__PURE__ */ jsxs("span", { className: "text-2xl font-bold text-slate-500 line-through", children: [
                    "$",
                    plans.yearly.originalPrice
                  ] }),
                  /* @__PURE__ */ jsx("span", { className: "text-sm text-slate-400", children: "/year" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-baseline gap-2", children: [
                  /* @__PURE__ */ jsxs("span", { className: "text-5xl font-bold text-amber-500", children: [
                    "$",
                    currentPlan.price
                  ] }),
                  /* @__PURE__ */ jsx("span", { className: "text-xl text-slate-400", children: currentPlan.interval })
                ] }),
                selectedPlan === "yearly" && /* @__PURE__ */ jsxs("div", { className: "mt-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-emerald-400 font-bold text-lg", children: "≈ $9/month" }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-emerald-300 mt-1", children: "Save $56 compared to monthly billing" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "mt-3 flex items-center gap-2 text-sm text-slate-400", children: [
                  /* @__PURE__ */ jsx(RefreshCw, { className: "w-4 h-4" }),
                  /* @__PURE__ */ jsx("span", { children: currentPlan.billingInterval })
                ] }),
                currentPlan.savings && /* @__PURE__ */ jsx("div", { className: "mt-3 flex items-center gap-2", children: /* @__PURE__ */ jsx(Badge, { className: "bg-green-500/20 text-green-400 border-green-500/30", children: currentPlan.savings }) })
              ] })
            ] }),
            /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("ul", { className: "space-y-3", children: currentPlan.features.map((feature, index) => /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-3 text-sm text-slate-200", children: [
              /* @__PURE__ */ jsx(CheckCircle, { className: "w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" }),
              /* @__PURE__ */ jsx("span", { children: feature })
            ] }, index)) }) })
          ] }),
          showTrialInfo && /* @__PURE__ */ jsx("div", { className: "mt-6 p-4 bg-gradient-to-r from-amber-500/10 to-emerald-500/10 rounded-lg border border-amber-500/30", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
            /* @__PURE__ */ jsx(Clock, { className: "w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("h3", { className: "font-semibold text-sm text-white", children: [
                trialPeriodKo,
                " 무료체험"
              ] }),
              /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-300 mt-1", children: [
                "오늘부터 ",
                trialPeriodKo,
                "간 무료로 모든 Insider 기능을 사용해보세요. 무료체험 기간이 끝나면 자동으로 $",
                currentPlan.price,
                currentPlan.interval,
                " 결제가 시작됩니다. 언제든지 해지 가능합니다."
              ] })
            ] })
          ] }) }),
          !showTrialInfo && /* @__PURE__ */ jsx("div", { className: "mt-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/30", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
            /* @__PURE__ */ jsx(AlertTriangle, { className: "w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h3", { className: "font-semibold text-sm text-white", children: "무료체험 이미 사용됨" }),
              /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-300 mt-1", children: [
                "무료체험은 계정당 1회만 제공됩니다. 결제 즉시 $",
                currentPlan.price,
                currentPlan.interval,
                " 자동결제가 시작됩니다."
              ] })
            ] })
          ] }) }),
          /* @__PURE__ */ jsx("div", { className: "mt-4 p-4 bg-slate-800 rounded-lg border border-slate-700", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
            /* @__PURE__ */ jsx(Shield, { className: "w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h3", { className: "font-semibold text-sm text-white", children: "Secure Payment & Auto-Renewal" }),
              /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-300 mt-1", children: [
                "All transactions are encrypted and processed securely through Stripe. Your subscription will automatically renew ",
                selectedPlan === "monthly" ? "every month" : "every year",
                " until you cancel. Cancel anytime with one click - you'll keep access until the end of your billing period."
              ] })
            ] })
          ] }) }),
          /* @__PURE__ */ jsx("div", { className: "mt-4 p-4 bg-slate-800 rounded-lg border border-slate-700", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
            /* @__PURE__ */ jsx(TrendingUp, { className: "w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h3", { className: "font-semibold text-sm text-white", children: "Real SEC Data" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-300 mt-1", children: "All data sourced directly from SEC filings. No fake data - only real, actionable intelligence." })
            ] })
          ] }) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex flex-col items-center justify-start lg:pt-16", children: /* @__PURE__ */ jsxs(Card, { className: "w-full max-w-md", children: [
          /* @__PURE__ */ jsxs(CardHeader, { children: [
            /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(CreditCard, { className: "h-5 w-5 text-primary" }),
              showTrialInfo ? "Start Free Trial" : "Subscribe Now"
            ] }),
            /* @__PURE__ */ jsx(CardDescription, { children: showTrialInfo ? `${trialPeriodKo} 무료체험 후 $${currentPlan.price}${currentPlan.interval}` : `즉시 $${currentPlan.price}${currentPlan.interval} 결제 시작` })
          ] }),
          /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-2 text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsx("span", { children: "Plan:" }),
                /* @__PURE__ */ jsxs("span", { className: "font-semibold", children: [
                  currentPlan.name,
                  " (",
                  selectedPlan === "monthly" ? "Monthly" : "Yearly",
                  ")"
                ] })
              ] }),
              showTrialInfo && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsx("span", { children: "Free Trial:" }),
                /* @__PURE__ */ jsx("span", { className: "font-semibold text-green-600 dark:text-green-400", children: trialPeriodEn })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsx("span", { children: showTrialInfo ? "After Trial:" : "Price:" }),
                /* @__PURE__ */ jsxs("span", { className: "font-semibold", children: [
                  "$",
                  currentPlan.price,
                  currentPlan.interval,
                  " (세금별도)"
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-xs text-slate-500", children: [
                /* @__PURE__ */ jsx("span", { children: "Billing Cycle:" }),
                /* @__PURE__ */ jsx("span", { children: currentPlan.billingInterval })
              ] })
            ] }),
            showTrialInfo && /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 p-3 rounded-lg border bg-muted/50", children: [
              /* @__PURE__ */ jsx(
                Checkbox,
                {
                  id: "terms",
                  checked: agreedToTerms,
                  onCheckedChange: (checked) => setAgreedToTerms(checked === true),
                  className: "mt-0.5"
                }
              ),
              /* @__PURE__ */ jsx(
                "label",
                {
                  htmlFor: "terms",
                  className: "text-xs text-muted-foreground leading-relaxed cursor-pointer",
                  children: "무료체험 종료 후 자동으로 결제가 진행됩니다. 원치 않으시면 카드사에서 자동결제를 직접 취소해주세요. 자동결제 이후에는 환불이 불가함을 이해했습니다."
                }
              )
            ] }),
            /* @__PURE__ */ jsx(
              Button,
              {
                onClick: handleCheckout,
                className: "w-full bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white font-semibold py-6 text-lg",
                disabled: isProcessing || showTrialInfo && !agreedToTerms,
                "data-testid": "button-complete-payment",
                children: isProcessing ? /* @__PURE__ */ jsxs(Fragment$1, { children: [
                  /* @__PURE__ */ jsx("div", { className: "animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" }),
                  "Processing..."
                ] }) : /* @__PURE__ */ jsxs(Fragment$1, { children: [
                  /* @__PURE__ */ jsx(Shield, { className: "w-5 h-5 mr-2" }),
                  showTrialInfo ? `Start ${trialPeriodEn} Free Trial` : "Subscribe Now"
                ] })
              }
            ),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-center text-slate-500", children: showTrialInfo ? `You won't be charged for ${trialPeriodEn}. Cancel anytime during the trial.` : "안전한 Stripe 결제 시스템을 통해 처리됩니다." })
          ] })
        ] }) })
      ] })
    ] })
  ] });
}
function PaymentSuccess() {
  const [paymentStatus, setPaymentStatus] = useState("loading");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user, login, refreshUser } = useAuth();
  const [, setLocation] = useLocation();
  useEffect(() => {
    const refreshUserData = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get("session_id");
      if (!sessionId) {
        console.log("❌ No session_id found in URL - redirecting to home");
        setLocation("/");
        return;
      }
      console.log("✅ Subscription checkout successful, session:", sessionId);
      console.log("🔄 [PAYMENT SUCCESS] Clearing all localStorage caches to force fresh data load");
      localStorage.getItem("authToken");
      localStorage.removeItem("authUser");
      localStorage.removeItem("pwa-installed");
      localStorage.removeItem("pwa-prompt-dismissed");
      await new Promise((resolve) => setTimeout(resolve, 5e3));
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          console.log("❌ No auth token found - redirecting to login");
          setLocation("/login");
          return;
        }
        apiClient.setToken(token);
        let retries = 0;
        const maxRetries = 3;
        let userUpdated = false;
        while (retries < maxRetries && !userUpdated) {
          console.log(`🔄 Attempt ${retries + 1}/${maxRetries} to verify user subscription status`);
          const response = await apiClient.verifyToken();
          if (response.success && response.user) {
            console.log("🔄 [PAYMENT SUCCESS] User data received from server:", {
              tier: response.user.subscriptionTier,
              status: response.user.subscriptionStatus,
              hasUsedTrial: response.user.hasUsedTrial
            });
            const isPremium = response.user.subscriptionTier === "insider_pro" && (response.user.subscriptionStatus === "active" || response.user.subscriptionStatus === "trialing");
            if (isPremium) {
              console.log("✅ [PAYMENT SUCCESS] User successfully upgraded to premium!");
              console.log("🔐 [PAYMENT SUCCESS] Logging in with fresh user data...");
              login(response.user, token);
              setPaymentStatus("success");
              userUpdated = true;
              localStorage.setItem("card-registered", "true");
              console.log("✅ [PAYMENT SUCCESS] Payment success process completed successfully");
            } else {
              console.log(`⚠️ [PAYMENT SUCCESS] User tier: ${response.user.subscriptionTier}, status: ${response.user.subscriptionStatus}`);
              console.log(`⚠️ [PAYMENT SUCCESS] Premium check failed, will retry... (attempt ${retries + 1}/${maxRetries})`);
              retries++;
              if (retries < maxRetries) {
                await new Promise((resolve) => setTimeout(resolve, 2e3));
              }
            }
          } else {
            console.log("❌ Failed to verify user token");
            retries++;
            if (retries < maxRetries) {
              await new Promise((resolve) => setTimeout(resolve, 2e3));
            }
          }
        }
        if (!userUpdated) {
          console.log("❌ User subscription status did not update after retries");
          setPaymentStatus("error");
        }
      } catch (error) {
        console.error("Failed to refresh user data:", error);
        setPaymentStatus("error");
      }
    };
    refreshUserData();
  }, [login, setLocation]);
  if (paymentStatus === "loading") {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-background flex items-center justify-center p-4", children: /* @__PURE__ */ jsxs("div", { className: "text-center space-y-4", children: [
      /* @__PURE__ */ jsx("div", { className: "animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Confirming your payment..." })
    ] }) });
  }
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    console.log("🔄 User manually triggered refresh...");
    const success = await refreshUser();
    if (success && user && user.subscriptionTier === "insider_pro") {
      console.log("✅ Manual refresh successful, subscription activated!");
      setPaymentStatus("success");
      localStorage.setItem("card-registered", "true");
    } else {
      console.log("❌ Manual refresh failed or subscription not active yet");
      alert("Subscription not activated yet. Please wait a moment and try again, or contact support.");
    }
    setIsRefreshing(false);
  };
  if (paymentStatus === "error") {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-background flex items-center justify-center p-4", children: /* @__PURE__ */ jsxs(Card, { className: "w-full max-w-md text-center", children: [
      /* @__PURE__ */ jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsx(CardTitle, { className: "text-destructive", children: "Subscription Activation Delayed" }),
        /* @__PURE__ */ jsx(CardDescription, { children: "Your payment was successful, but we're still activating your subscription. This can take a few moments." })
      ] }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3", children: [
        /* @__PURE__ */ jsx(
          Button,
          {
            className: "w-full",
            onClick: handleManualRefresh,
            disabled: isRefreshing,
            children: isRefreshing ? "Checking..." : "Check Subscription Status"
          }
        ),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "If the issue persists, please contact support with your payment confirmation." }),
        /* @__PURE__ */ jsx(Link, { href: "/premium-checkout", children: /* @__PURE__ */ jsx(Button, { variant: "outline", className: "w-full", children: "Return to Checkout" }) })
      ] })
    ] }) });
  }
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-gradient-to-br from-green-900 via-slate-900 to-slate-800 flex items-center justify-center p-4", children: /* @__PURE__ */ jsxs("div", { className: "max-w-2xl mx-auto text-center space-y-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsx("div", { className: "mx-auto w-20 h-20 bg-green-500 rounded-full flex items-center justify-center animate-pulse", children: /* @__PURE__ */ jsx(CheckCircle, { className: "w-12 h-12 text-white" }) }),
      /* @__PURE__ */ jsx("h1", { className: "text-4xl font-bold text-white", "data-testid": "text-success-title", children: "🎉 Welcome to Insider Pro!" }),
      /* @__PURE__ */ jsx("p", { className: "text-green-300 text-xl", children: "Your subscription is now active. Start tracking insider trades in real-time!" })
    ] }),
    /* @__PURE__ */ jsxs(Card, { className: "text-left bg-slate-800 border-green-500 border-2", children: [
      /* @__PURE__ */ jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2 text-white text-2xl", children: [
          /* @__PURE__ */ jsx(Shield, { className: "h-6 w-6 text-green-400" }),
          "All Premium Features Unlocked"
        ] }),
        /* @__PURE__ */ jsx(CardDescription, { className: "text-slate-300", children: "You now have full access to real-time insider trading intelligence" })
      ] }),
      /* @__PURE__ */ jsx(CardContent, { className: "space-y-4", children: /* @__PURE__ */ jsxs("div", { className: "grid gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(CheckCircle, { className: "w-5 h-5 text-green-400" }),
          /* @__PURE__ */ jsx("span", { className: "text-sm text-slate-200", children: "✨ Real-time insider trade alerts (no 48h delay)" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(CheckCircle, { className: "w-5 h-5 text-green-400" }),
          /* @__PURE__ */ jsx("span", { className: "text-sm text-slate-200", children: "🚀 AI-powered trade analysis & predictions" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(CheckCircle, { className: "w-5 h-5 text-green-400" }),
          /* @__PURE__ */ jsx("span", { className: "text-sm text-slate-200", children: "📊 Advanced pattern detection & signals" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(CheckCircle, { className: "w-5 h-5 text-green-400" }),
          /* @__PURE__ */ jsx("span", { className: "text-sm text-slate-200", children: "🎯 Executive trade tracking (CEO, CFO, etc.)" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(CheckCircle, { className: "w-5 h-5 text-green-400" }),
          /* @__PURE__ */ jsx("span", { className: "text-sm text-slate-200", children: "⚡ Live data updates & push notifications" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(CheckCircle, { className: "w-5 h-5 text-green-400" }),
          /* @__PURE__ */ jsx("span", { className: "text-sm text-slate-200", children: "📈 Historical insider performance analytics" })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsx(Link, { href: "/", children: /* @__PURE__ */ jsxs(Button, { size: "lg", className: "w-full bg-green-500 hover:bg-green-600 text-white", "data-testid": "button-start-exploring", children: [
        /* @__PURE__ */ jsx(TrendingUp, { className: "w-5 h-5 mr-2" }),
        "Start Tracking Insider Trades",
        /* @__PURE__ */ jsx(ArrowRight, { className: "w-5 h-5 ml-2" })
      ] }) }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-300", children: "🎯 Your Insider Pro subscription is active. Cancel anytime from your account settings." })
    ] })
  ] }) });
}
const logoLight$3 = "/Gemini_Generated_Image_wdqi0fwdqi0fwdqi.png";
const logoDark$3 = "/insiderpulse_logo1.png";
function SignupPage() {
  const [, navigate2] = useLocation();
  const { t } = useLanguage();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("signup");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef([]);
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1e3);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);
  useEffect(() => {
    if (mode === "verify" && code.every((digit) => digit !== "") && !isLoading) {
      handleVerifyCode();
    }
  }, [code, mode, isLoading]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password || !confirmPassword) {
      setError(t("auth.signup.errorAllFields"));
      return;
    }
    if (password.length < 8) {
      setError(t("auth.signup.errorPasswordLength"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("auth.signup.errorPasswordMatch"));
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(t("auth.signup.errorInvalidEmail"));
      return;
    }
    setIsLoading(true);
    try {
      await apiClient.signup(email, password);
      setMode("verify");
      setCode(["", "", "", "", "", ""]);
      setTimeout(() => {
        var _a;
        (_a = inputRefs.current[0]) == null ? void 0 : _a.focus();
      }, 100);
    } catch (err) {
      setError(err.message || t("auth.signup.errorFailed"));
    } finally {
      setIsLoading(false);
    }
  };
  const handleCodeChange = (index, value) => {
    var _a;
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    if (value && index < 5) {
      (_a = inputRefs.current[index + 1]) == null ? void 0 : _a.focus();
    }
  };
  const handleCodeKeyDown = (index, e) => {
    var _a;
    if (e.key === "Backspace" && !code[index] && index > 0) {
      (_a = inputRefs.current[index - 1]) == null ? void 0 : _a.focus();
    }
  };
  const handleCodePaste = (e) => {
    var _a;
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newCode = [...code];
    pastedData.split("").forEach((digit, index) => {
      if (index < 6) {
        newCode[index] = digit;
      }
    });
    setCode(newCode);
    const nextEmptyIndex = newCode.findIndex((c) => !c);
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
    (_a = inputRefs.current[focusIndex]) == null ? void 0 : _a.focus();
  };
  const handleVerifyCode = async (e) => {
    e == null ? void 0 : e.preventDefault();
    setError("");
    const codeString = code.join("");
    if (codeString.length !== 6) {
      setError(t("auth.verifyCode.errorEnterAll"));
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: codeString })
      });
      const data = await response.json();
      if (data.success) {
        setMode("success");
        setTimeout(async () => {
          try {
            const loginResponse = await apiClient.login(email, password);
            if (loginResponse.success && loginResponse.user && loginResponse.token) {
              login(loginResponse.user, loginResponse.token);
              navigate2("/trades");
            }
          } catch (err) {
            console.error("Auto-login failed:", err);
            navigate2("/login");
          }
        }, 1500);
      } else {
        setError(data.message || t("auth.verifyCode.errorFailed"));
      }
    } catch (err) {
      setError(err.message || t("auth.verifyCode.errorFailed"));
    } finally {
      setIsLoading(false);
    }
  };
  const handleResendCode = async () => {
    var _a;
    if (resendCooldown > 0) return;
    setIsResending(true);
    setError("");
    try {
      const response = await fetch("/api/auth/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (data.success) {
        setResendCooldown(60);
        setCode(["", "", "", "", "", ""]);
        (_a = inputRefs.current[0]) == null ? void 0 : _a.focus();
      } else {
        setError(data.message || t("auth.verifyCode.errorResend"));
      }
    } catch (err) {
      setError(err.message || t("auth.verifyCode.errorResend"));
    } finally {
      setIsResending(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen grid md:grid-cols-2", children: [
    /* @__PURE__ */ jsxs("div", { className: "hidden md:flex flex-col justify-between bg-gradient-to-br from-purple-600 via-purple-700 to-blue-600 p-12", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("img", { src: logoDark$3, alt: "InsiderPulse", className: "h-10 w-auto mb-16" }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-6 max-w-md", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-4xl font-bold text-white leading-tight", children: t("auth.signup.heroTitle") }),
          /* @__PURE__ */ jsx("p", { className: "text-lg text-slate-400", children: t("auth.signup.heroDesc") })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-16 space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
            /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded bg-pink-500/10 flex items-center justify-center", children: /* @__PURE__ */ jsx(TrendingUp, { className: "h-6 w-6 text-pink-500" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h3", { className: "font-semibold text-white", children: t("auth.login.realtimeData") }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400", children: t("auth.login.realtimeDesc") })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
            /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded bg-cyan-500/10 flex items-center justify-center", children: /* @__PURE__ */ jsx(Shield, { className: "h-6 w-6 text-cyan-500" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h3", { className: "font-semibold text-white", children: t("auth.login.verifiedInfo") }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400", children: t("auth.login.verifiedDesc") })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
            /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded bg-violet-500/10 flex items-center justify-center", children: /* @__PURE__ */ jsx(Zap, { className: "h-6 w-6 text-violet-500" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h3", { className: "font-semibold text-white", children: t("auth.login.smartAlerts") }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400", children: t("auth.login.smartAlertsDesc") })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "text-xs text-slate-500", children: "© 2024 InsiderPulse. All rights reserved." })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center p-4 bg-white dark:bg-slate-950", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-md", children: [
      mode === "success" ? /* @__PURE__ */ jsxs("div", { className: "space-y-6 py-12 text-center", "data-testid": "success-message", children: [
        /* @__PURE__ */ jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center", children: /* @__PURE__ */ jsx(CheckCircle, { className: "h-8 w-8 text-white" }) }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-slate-900 dark:text-white mb-2", children: t("auth.verifyCode.successTitle") }),
          /* @__PURE__ */ jsx("p", { className: "text-slate-600 dark:text-slate-400", children: t("auth.verifyCode.successDesc") })
        ] })
      ] }) : mode === "verify" ? (
        /* Verification Code View */
        /* @__PURE__ */ jsxs(Fragment$1, { children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
            /* @__PURE__ */ jsx("div", { className: "mb-3 flex justify-center", children: /* @__PURE__ */ jsx("div", { className: "inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500", children: /* @__PURE__ */ jsx(Mail, { className: "h-8 w-8 text-white" }) }) }),
            /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-slate-900 dark:text-white mb-2 text-center", children: t("auth.verifyCode.title") }),
            /* @__PURE__ */ jsxs("p", { className: "text-slate-600 dark:text-slate-400 text-center text-sm", children: [
              /* @__PURE__ */ jsx("strong", { children: email }),
              t("auth.verifyCode.subtitle"),
              /* @__PURE__ */ jsx("br", {}),
              t("auth.verifyCode.enterCode")
            ] })
          ] }),
          error && /* @__PURE__ */ jsxs(Alert, { variant: "destructive", className: "mb-4", "data-testid": "alert-error", children: [
            /* @__PURE__ */ jsx(AlertCircle, { className: "h-4 w-4" }),
            /* @__PURE__ */ jsx(AlertDescription, { children: error })
          ] }),
          /* @__PURE__ */ jsxs("form", { onSubmit: handleVerifyCode, className: "space-y-6", children: [
            /* @__PURE__ */ jsx("div", { className: "flex justify-center gap-2", children: code.map((digit, index) => /* @__PURE__ */ jsx(
              "input",
              {
                ref: (el) => inputRefs.current[index] = el,
                type: "text",
                inputMode: "numeric",
                pattern: "\\d*",
                maxLength: 1,
                value: digit,
                onChange: (e) => handleCodeChange(index, e.target.value),
                onKeyDown: (e) => handleCodeKeyDown(index, e),
                onPaste: handleCodePaste,
                disabled: isLoading,
                className: "w-12 h-14 text-center text-2xl font-bold border-2 border-slate-300 dark:border-slate-600 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-slate-800 text-slate-900 dark:text-white",
                autoFocus: index === 0
              },
              index
            )) }),
            /* @__PURE__ */ jsx("p", { className: "text-center text-sm text-slate-500 dark:text-slate-400", children: t("auth.verifyCode.codeValid") }),
            /* @__PURE__ */ jsx(
              Button,
              {
                type: "submit",
                className: "w-full h-10 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium",
                disabled: isLoading || code.join("").length !== 6,
                children: isLoading ? /* @__PURE__ */ jsxs(Fragment$1, { children: [
                  /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }),
                  t("auth.verifyCode.verifying")
                ] }) : t("auth.verifyCode.verify")
              }
            ),
            /* @__PURE__ */ jsx("div", { className: "text-center", children: /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: handleResendCode,
                disabled: resendCooldown > 0 || isResending,
                className: "text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 font-medium disabled:text-slate-400 disabled:cursor-not-allowed",
                children: isResending ? /* @__PURE__ */ jsxs(Fragment$1, { children: [
                  /* @__PURE__ */ jsx(Loader2, { className: "inline h-3 w-3 animate-spin mr-1" }),
                  t("auth.verifyCode.resending")
                ] }) : resendCooldown > 0 ? t("auth.verifyCode.resendIn", { seconds: resendCooldown }) : t("auth.verifyCode.resendCode")
              }
            ) }),
            /* @__PURE__ */ jsx("div", { className: "text-center pt-4 border-t", children: /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => setMode("signup"),
                className: "text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white inline-flex items-center gap-1",
                children: [
                  /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
                  t("auth.verifyCode.backToSignup")
                ]
              }
            ) })
          ] })
        ] })
      ) : (
        /* Signup Form View */
        /* @__PURE__ */ jsx(Fragment$1, { children: /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-3 flex justify-center", children: [
            /* @__PURE__ */ jsx("img", { src: logoLight$3, alt: "InsiderPulse", className: "h-64 w-auto block dark:hidden" }),
            /* @__PURE__ */ jsx("img", { src: logoDark$3, alt: "InsiderPulse", className: "h-64 w-auto hidden dark:block" })
          ] }),
          /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-slate-900 dark:text-white mb-2", children: t("auth.signup.title") }),
          /* @__PURE__ */ jsx("p", { className: "text-slate-600 dark:text-slate-400", children: t("auth.signup.subtitle") })
        ] }) })
      ),
      mode === "signup" && /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-3", children: [
        error && /* @__PURE__ */ jsxs(Alert, { variant: "destructive", "data-testid": "alert-error", children: [
          /* @__PURE__ */ jsx(AlertCircle, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsx(AlertDescription, { children: error })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "email", className: "text-sm font-medium text-slate-700 dark:text-slate-300", children: t("auth.signup.email") }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "email",
              type: "email",
              placeholder: t("auth.login.emailPlaceholder"),
              value: email,
              onChange: (e) => setEmail(e.target.value),
              disabled: isLoading,
              required: true,
              className: "h-10",
              "data-testid": "input-email"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "password", className: "text-sm font-medium text-slate-700 dark:text-slate-300", children: t("auth.signup.password") }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "password",
              type: "password",
              placeholder: t("auth.login.passwordPlaceholder"),
              value: password,
              onChange: (e) => setPassword(e.target.value),
              disabled: isLoading,
              required: true,
              className: "h-10",
              "data-testid": "input-password"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "confirmPassword", className: "text-sm font-medium text-slate-700 dark:text-slate-300", children: t("auth.signup.confirmPassword") }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "confirmPassword",
              type: "password",
              placeholder: t("auth.login.passwordPlaceholder"),
              value: confirmPassword,
              onChange: (e) => setConfirmPassword(e.target.value),
              disabled: isLoading,
              required: true,
              className: "h-10",
              "data-testid": "input-confirm-password"
            }
          )
        ] }),
        /* @__PURE__ */ jsx(
          Button,
          {
            type: "submit",
            className: "w-full h-10 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium",
            disabled: isLoading,
            "data-testid": "button-signup",
            children: isLoading ? /* @__PURE__ */ jsxs(Fragment$1, { children: [
              /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }),
              t("auth.signup.creating")
            ] }) : t("auth.signup.button")
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "text-center text-sm", children: [
          /* @__PURE__ */ jsx("span", { className: "text-slate-600 dark:text-slate-400", children: t("auth.signup.haveAccount") }),
          " ",
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => navigate2("/login"),
              className: "text-purple-600 dark:text-purple-400 font-medium hover:underline",
              "data-testid": "button-login",
              children: t("auth.signup.signIn")
            }
          )
        ] })
      ] })
    ] }) })
  ] });
}
const logoLight$2 = "/Gemini_Generated_Image_wdqi0fwdqi0fwdqi.png";
const logoDark$2 = "/insiderpulse_logo1.png";
function LoginPage() {
  const [, navigate2] = useLocation();
  const { login } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError(t("auth.login.errorRequired"));
      return;
    }
    setIsLoading(true);
    try {
      const response = await apiClient.login(email, password);
      if (response.success && response.user && response.token) {
        login(response.user, response.token);
        navigate2("/trades");
      } else {
        setError(response.message || t("auth.login.errorFailed"));
      }
    } catch (err) {
      setError(err.message || t("auth.login.errorFailed"));
    } finally {
      setIsLoading(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen grid md:grid-cols-2", children: [
    /* @__PURE__ */ jsxs("div", { className: "hidden md:flex flex-col justify-between bg-slate-900 p-12", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("img", { src: logoDark$2, alt: "InsiderPulse", className: "h-10 w-auto mb-16" }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-6 max-w-md", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-4xl font-bold text-white leading-tight", children: t("auth.login.welcome") }),
          /* @__PURE__ */ jsx("p", { className: "text-lg text-slate-400", children: t("auth.login.welcomeDesc") })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-16 space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
            /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded bg-emerald-500/10 flex items-center justify-center", children: /* @__PURE__ */ jsx(TrendingUp, { className: "h-6 w-6 text-emerald-500" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h3", { className: "font-semibold text-white", children: t("auth.login.realtimeData") }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400", children: t("auth.login.realtimeDesc") })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
            /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded bg-blue-500/10 flex items-center justify-center", children: /* @__PURE__ */ jsx(Shield, { className: "h-6 w-6 text-blue-500" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h3", { className: "font-semibold text-white", children: t("auth.login.verifiedInfo") }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400", children: t("auth.login.verifiedDesc") })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
            /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded bg-amber-500/10 flex items-center justify-center", children: /* @__PURE__ */ jsx(Zap, { className: "h-6 w-6 text-amber-500" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h3", { className: "font-semibold text-white", children: t("auth.login.smartAlerts") }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400", children: t("auth.login.smartAlertsDesc") })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "text-xs text-slate-500", children: "© 2024 InsiderPulse. All rights reserved." })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center p-4 bg-white dark:bg-slate-950", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-md", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-3 flex justify-center", children: [
          /* @__PURE__ */ jsx("img", { src: logoLight$2, alt: "InsiderPulse", className: "h-64 w-auto block dark:hidden" }),
          /* @__PURE__ */ jsx("img", { src: logoDark$2, alt: "InsiderPulse", className: "h-64 w-auto hidden dark:block" })
        ] }),
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-slate-900 dark:text-white mb-2", children: t("auth.login.title") }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-600 dark:text-slate-400", children: t("auth.login.subtitle") })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-3", children: [
        error && /* @__PURE__ */ jsxs(Alert, { variant: "destructive", "data-testid": "alert-error", children: [
          /* @__PURE__ */ jsx(AlertCircle, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsx(AlertDescription, { children: error })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "email", className: "text-sm font-medium text-slate-700 dark:text-slate-300", children: t("auth.login.email") }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "email",
              type: "email",
              placeholder: t("auth.login.emailPlaceholder"),
              value: email,
              onChange: (e) => setEmail(e.target.value),
              disabled: isLoading,
              required: true,
              className: "h-10",
              "data-testid": "input-email"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "password", className: "text-sm font-medium text-slate-700 dark:text-slate-300", children: t("auth.login.password") }),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                className: "text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white",
                onClick: () => navigate2("/forgot-password"),
                "data-testid": "button-forgot-password",
                children: t("auth.login.forgotPassword")
              }
            )
          ] }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "password",
              type: "password",
              placeholder: t("auth.login.passwordPlaceholder"),
              value: password,
              onChange: (e) => setPassword(e.target.value),
              disabled: isLoading,
              required: true,
              className: "h-10",
              "data-testid": "input-password"
            }
          )
        ] }),
        /* @__PURE__ */ jsx(
          Button,
          {
            type: "submit",
            className: "w-full h-10 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 font-medium",
            disabled: isLoading,
            "data-testid": "button-login",
            children: isLoading ? /* @__PURE__ */ jsxs(Fragment$1, { children: [
              /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }),
              t("auth.login.signingIn")
            ] }) : t("auth.login.button")
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "text-center text-sm", children: [
          /* @__PURE__ */ jsx("span", { className: "text-slate-600 dark:text-slate-400", children: t("auth.login.noAccount") }),
          " ",
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => navigate2("/signup"),
              className: "text-slate-900 dark:text-white font-medium hover:underline",
              "data-testid": "button-signup",
              children: t("auth.login.signUp")
            }
          )
        ] })
      ] })
    ] }) })
  ] });
}
const logoLight$1 = "/Gemini_Generated_Image_wdqi0fwdqi0fwdqi.png";
const logoDark$1 = "/insiderpulse_logo1.png";
function ForgotPasswordPage() {
  const [, navigate2] = useLocation();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    if (!email) {
      setError(t("auth.forgotPassword.errorEmailRequired"));
      return;
    }
    setIsLoading(true);
    try {
      const response = await apiClient.requestPasswordReset(email);
      if (response.success) {
        setSuccess(true);
      } else {
        setError(response.message || t("auth.forgotPassword.errorFailed"));
      }
    } catch (err) {
      setError(err.message || t("auth.forgotPassword.errorFailed"));
    } finally {
      setIsLoading(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen flex", children: [
    /* @__PURE__ */ jsx("div", { className: "flex-1 flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-20 xl:px-24", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto w-full max-w-sm lg:w-96", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(
          "img",
          {
            className: "h-12 w-auto dark:hidden",
            src: logoLight$1,
            alt: "InsiderPulse"
          }
        ),
        /* @__PURE__ */ jsx(
          "img",
          {
            className: "h-12 w-auto hidden dark:block",
            src: logoDark$1,
            alt: "InsiderPulse"
          }
        ),
        /* @__PURE__ */ jsx("h2", { className: "mt-6 text-3xl font-bold tracking-tight text-gray-900 dark:text-white", children: t("auth.forgotPassword.title") }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-gray-600 dark:text-gray-400", children: t("auth.forgotPassword.description") })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-8", children: [
        error && /* @__PURE__ */ jsxs(Alert, { className: "mb-4 border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950", children: [
          /* @__PURE__ */ jsx(AlertCircle, { className: "h-4 w-4 text-red-600 dark:text-red-400" }),
          /* @__PURE__ */ jsx(AlertDescription, { className: "text-red-600 dark:text-red-400", children: error })
        ] }),
        success && /* @__PURE__ */ jsxs(Alert, { className: "mb-4 border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950", children: [
          /* @__PURE__ */ jsx(CheckCircle, { className: "h-4 w-4 text-green-600 dark:text-green-400" }),
          /* @__PURE__ */ jsx(AlertDescription, { className: "text-green-600 dark:text-green-400", children: t("auth.forgotPassword.successMessage") })
        ] }),
        !success ? /* @__PURE__ */ jsxs("form", { className: "space-y-6", onSubmit: handleSubmit, children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "email", children: t("auth.forgotPassword.emailLabel") }),
            /* @__PURE__ */ jsx("div", { className: "mt-2", children: /* @__PURE__ */ jsx(
              Input,
              {
                id: "email",
                name: "email",
                type: "email",
                autoComplete: "email",
                required: true,
                value: email,
                onChange: (e) => setEmail(e.target.value),
                className: "block w-full",
                placeholder: t("auth.forgotPassword.emailPlaceholder")
              }
            ) })
          ] }),
          /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(
            Button,
            {
              type: "submit",
              className: "w-full",
              disabled: isLoading,
              children: isLoading ? /* @__PURE__ */ jsxs(Fragment$1, { children: [
                /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }),
                t("auth.forgotPassword.sending")
              ] }) : /* @__PURE__ */ jsxs(Fragment$1, { children: [
                /* @__PURE__ */ jsx(Mail, { className: "mr-2 h-4 w-4" }),
                t("auth.forgotPassword.sendButton")
              ] })
            }
          ) }),
          /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center", children: /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              className: "flex items-center text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300",
              onClick: () => navigate2("/login"),
              children: [
                /* @__PURE__ */ jsx(ArrowLeft, { className: "mr-1 h-4 w-4" }),
                t("auth.forgotPassword.backToLogin")
              ]
            }
          ) })
        ] }) : /* @__PURE__ */ jsxs("div", { className: "text-center space-y-4", children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: t("auth.forgotPassword.checkEmail") }),
          /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "outline",
              onClick: () => navigate2("/login"),
              className: "w-full",
              children: [
                /* @__PURE__ */ jsx(ArrowLeft, { className: "mr-2 h-4 w-4" }),
                t("auth.forgotPassword.backToLogin")
              ]
            }
          )
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "hidden lg:block relative flex-1 bg-gradient-to-br from-indigo-600 to-purple-700", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-black opacity-20" }),
      /* @__PURE__ */ jsx("div", { className: "relative h-full flex flex-col justify-center px-12", children: /* @__PURE__ */ jsxs("div", { className: "space-y-8", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-3xl font-bold text-white", children: t("auth.forgotPassword.secureReset") }),
        /* @__PURE__ */ jsx("div", { className: "space-y-6", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start space-x-4", children: [
          /* @__PURE__ */ jsx("div", { className: "flex-shrink-0", children: /* @__PURE__ */ jsx(Mail, { className: "h-8 w-8 text-white opacity-90" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h4", { className: "text-lg font-semibold text-white", children: t("auth.forgotPassword.feature1Title") }),
            /* @__PURE__ */ jsx("p", { className: "mt-2 text-indigo-100", children: t("auth.forgotPassword.feature1Description") })
          ] })
        ] }) })
      ] }) })
    ] })
  ] });
}
const logoLight = "/Gemini_Generated_Image_wdqi0fwdqi0fwdqi.png";
const logoDark = "/insiderpulse_logo1.png";
function ResetPasswordPage() {
  const [, navigate2] = useLocation();
  const { t } = useLanguage();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get("token");
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setError(t("auth.resetPassword.errorNoToken"));
    }
  }, [t]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    if (!newPassword || !confirmPassword) {
      setError(t("auth.resetPassword.errorRequired"));
      return;
    }
    if (newPassword.length < 6) {
      setError(t("auth.resetPassword.errorTooShort"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("auth.resetPassword.errorMismatch"));
      return;
    }
    if (!token) {
      setError(t("auth.resetPassword.errorNoToken"));
      return;
    }
    setIsLoading(true);
    try {
      const response = await apiClient.resetPassword(token, newPassword);
      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate2("/login");
        }, 3e3);
      } else {
        setError(response.message || t("auth.resetPassword.errorFailed"));
      }
    } catch (err) {
      setError(err.message || t("auth.resetPassword.errorFailed"));
    } finally {
      setIsLoading(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen flex", children: [
    /* @__PURE__ */ jsx("div", { className: "flex-1 flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-20 xl:px-24", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto w-full max-w-sm lg:w-96", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(
          "img",
          {
            className: "h-12 w-auto dark:hidden",
            src: logoLight,
            alt: "InsiderPulse"
          }
        ),
        /* @__PURE__ */ jsx(
          "img",
          {
            className: "h-12 w-auto hidden dark:block",
            src: logoDark,
            alt: "InsiderPulse"
          }
        ),
        /* @__PURE__ */ jsx("h2", { className: "mt-6 text-3xl font-bold tracking-tight text-gray-900 dark:text-white", children: t("auth.resetPassword.title") }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-gray-600 dark:text-gray-400", children: t("auth.resetPassword.description") })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-8", children: [
        error && /* @__PURE__ */ jsxs(Alert, { className: "mb-4 border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950", children: [
          /* @__PURE__ */ jsx(AlertCircle, { className: "h-4 w-4 text-red-600 dark:text-red-400" }),
          /* @__PURE__ */ jsx(AlertDescription, { className: "text-red-600 dark:text-red-400", children: error })
        ] }),
        success && /* @__PURE__ */ jsxs(Alert, { className: "mb-4 border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950", children: [
          /* @__PURE__ */ jsx(CheckCircle, { className: "h-4 w-4 text-green-600 dark:text-green-400" }),
          /* @__PURE__ */ jsx(AlertDescription, { className: "text-green-600 dark:text-green-400", children: t("auth.resetPassword.successMessage") })
        ] }),
        !success && /* @__PURE__ */ jsxs("form", { className: "space-y-6", onSubmit: handleSubmit, children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "newPassword", children: t("auth.resetPassword.newPasswordLabel") }),
            /* @__PURE__ */ jsx("div", { className: "mt-2", children: /* @__PURE__ */ jsx(
              Input,
              {
                id: "newPassword",
                name: "newPassword",
                type: "password",
                autoComplete: "new-password",
                required: true,
                value: newPassword,
                onChange: (e) => setNewPassword(e.target.value),
                className: "block w-full",
                placeholder: t("auth.resetPassword.newPasswordPlaceholder")
              }
            ) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "confirmPassword", children: t("auth.resetPassword.confirmPasswordLabel") }),
            /* @__PURE__ */ jsx("div", { className: "mt-2", children: /* @__PURE__ */ jsx(
              Input,
              {
                id: "confirmPassword",
                name: "confirmPassword",
                type: "password",
                autoComplete: "new-password",
                required: true,
                value: confirmPassword,
                onChange: (e) => setConfirmPassword(e.target.value),
                className: "block w-full",
                placeholder: t("auth.resetPassword.confirmPasswordPlaceholder")
              }
            ) })
          ] }),
          /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(
            Button,
            {
              type: "submit",
              className: "w-full",
              disabled: isLoading || !token,
              children: isLoading ? /* @__PURE__ */ jsxs(Fragment$1, { children: [
                /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }),
                t("auth.resetPassword.resetting")
              ] }) : /* @__PURE__ */ jsxs(Fragment$1, { children: [
                /* @__PURE__ */ jsx(Lock, { className: "mr-2 h-4 w-4" }),
                t("auth.resetPassword.resetButton")
              ] })
            }
          ) }),
          /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center", children: /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              className: "text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300",
              onClick: () => navigate2("/login"),
              children: t("auth.resetPassword.backToLogin")
            }
          ) })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "hidden lg:block relative flex-1 bg-gradient-to-br from-indigo-600 to-purple-700", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-black opacity-20" }),
      /* @__PURE__ */ jsx("div", { className: "relative h-full flex flex-col justify-center px-12", children: /* @__PURE__ */ jsxs("div", { className: "space-y-8", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-3xl font-bold text-white", children: t("auth.resetPassword.secureAccount") }),
        /* @__PURE__ */ jsx("div", { className: "space-y-6", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start space-x-4", children: [
          /* @__PURE__ */ jsx("div", { className: "flex-shrink-0", children: /* @__PURE__ */ jsx(Lock, { className: "h-8 w-8 text-white opacity-90" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h4", { className: "text-lg font-semibold text-white", children: t("auth.resetPassword.feature1Title") }),
            /* @__PURE__ */ jsx("p", { className: "mt-2 text-indigo-100", children: t("auth.resetPassword.feature1Description") })
          ] })
        ] }) })
      ] }) })
    ] })
  ] });
}
function VerifyEmail() {
  const [, navigate2] = useLocation();
  useRoute("/verify-email");
  const { t } = useLanguage();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage(t("auth.verify.noToken"));
      return;
    }
    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/auth/verify-email/${token}`);
        const data = await response.json();
        if (data.success) {
          if (data.alreadyVerified) {
            setStatus("already-verified");
            setMessage(data.message);
          } else {
            setStatus("success");
            setMessage(data.message);
          }
        } else {
          setStatus("error");
          setMessage(data.message || t("auth.verify.error"));
        }
      } catch (error) {
        console.error("Email verification error:", error);
        setStatus("error");
        setMessage(t("auth.verify.error"));
      }
    };
    verifyEmail();
  }, [t]);
  const handleGoToLogin = () => {
    navigate2("/");
  };
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center bg-background p-4", children: /* @__PURE__ */ jsxs(Card, { className: "w-full max-w-md", "data-testid": "card-verify-email", children: [
    /* @__PURE__ */ jsxs(CardHeader, { className: "text-center", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex justify-center mb-4", children: [
        status === "loading" && /* @__PURE__ */ jsx("div", { className: "p-3 rounded-full bg-primary/10", "data-testid": "icon-loading", children: /* @__PURE__ */ jsx(Loader2, { className: "h-12 w-12 text-primary animate-spin" }) }),
        status === "success" && /* @__PURE__ */ jsx("div", { className: "p-3 rounded-full bg-green-500/10", "data-testid": "icon-success", children: /* @__PURE__ */ jsx(CheckCircle2, { className: "h-12 w-12 text-green-500" }) }),
        status === "already-verified" && /* @__PURE__ */ jsx("div", { className: "p-3 rounded-full bg-blue-500/10", "data-testid": "icon-already-verified", children: /* @__PURE__ */ jsx(Mail, { className: "h-12 w-12 text-blue-500" }) }),
        status === "error" && /* @__PURE__ */ jsx("div", { className: "p-3 rounded-full bg-destructive/10", "data-testid": "icon-error", children: /* @__PURE__ */ jsx(XCircle, { className: "h-12 w-12 text-destructive" }) })
      ] }),
      /* @__PURE__ */ jsxs(CardTitle, { className: "text-2xl", "data-testid": "text-title", children: [
        status === "loading" && t("auth.verify.verifying"),
        status === "success" && t("auth.verify.success"),
        status === "already-verified" && t("auth.verify.alreadyVerified"),
        status === "error" && t("auth.verify.error")
      ] }),
      /* @__PURE__ */ jsxs(CardDescription, { "data-testid": "text-message", children: [
        status === "loading" && t("auth.verify.loading"),
        (status === "success" || status === "already-verified" || status === "error") && message
      ] })
    ] }),
    /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
      (status === "success" || status === "already-verified") && /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsx("div", { className: "p-4 rounded-lg bg-green-500/10 border border-green-500/20", children: /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground text-center", children: t("auth.verify.successDesc") }) }),
        /* @__PURE__ */ jsx(
          Button,
          {
            onClick: handleGoToLogin,
            className: "w-full",
            "data-testid": "button-go-login",
            children: t("auth.verify.goToLogin")
          }
        )
      ] }),
      status === "error" && /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsx("div", { className: "p-4 rounded-lg bg-destructive/10 border border-destructive/20", children: /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground text-center", children: t("auth.verify.errorDesc") }) }),
        /* @__PURE__ */ jsx(
          Button,
          {
            onClick: handleGoToLogin,
            variant: "outline",
            className: "w-full",
            "data-testid": "button-back-login",
            children: t("auth.verify.backToLogin")
          }
        )
      ] })
    ] })
  ] }) });
}
function VerifyCode() {
  const [, navigate2] = useLocation();
  const { t } = useLanguage();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef([]);
  useEffect(() => {
    const storedEmail = localStorage.getItem("pendingVerificationEmail");
    console.log("🔍 Checking for stored email:", storedEmail);
    if (storedEmail) {
      setEmail(storedEmail);
      console.log("✅ Email found, ready for verification");
    } else {
      console.log("⚠️ No email found, waiting before redirect...");
      setTimeout(() => {
        const retryEmail = localStorage.getItem("pendingVerificationEmail");
        if (retryEmail) {
          setEmail(retryEmail);
          console.log("✅ Email found on retry");
        } else {
          console.log("❌ Still no email, redirecting to signup");
          navigate2("/signup");
        }
      }, 200);
    }
  }, [navigate2]);
  const handleChange = (index, value) => {
    var _a;
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    if (value && index < 5) {
      (_a = inputRefs.current[index + 1]) == null ? void 0 : _a.focus();
    }
  };
  const handleKeyDown = (index, e) => {
    var _a;
    if (e.key === "Backspace" && !code[index] && index > 0) {
      (_a = inputRefs.current[index - 1]) == null ? void 0 : _a.focus();
    }
  };
  const handlePaste = (e) => {
    var _a;
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newCode = [...code];
    pastedData.split("").forEach((digit, index) => {
      if (index < 6) {
        newCode[index] = digit;
      }
    });
    setCode(newCode);
    const nextEmptyIndex = newCode.findIndex((c) => !c);
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
    (_a = inputRefs.current[focusIndex]) == null ? void 0 : _a.focus();
  };
  const handleSubmit = async (e) => {
    e == null ? void 0 : e.preventDefault();
    setError("");
    const codeString = code.join("");
    if (codeString.length !== 6) {
      setError(t("auth.verifyCode.errorEnterAll"));
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: codeString })
      });
      const data = await response.json();
      if (data.success) {
        setSuccess(true);
        localStorage.removeItem("pendingVerificationEmail");
        setTimeout(() => {
          navigate2("/login");
        }, 2e3);
      } else {
        setError(data.message || t("auth.verifyCode.errorFailed"));
      }
    } catch (err) {
      setError(err.message || t("auth.verifyCode.errorFailed"));
    } finally {
      setIsLoading(false);
    }
  };
  const handleResend = async () => {
    var _a;
    if (resendCooldown > 0) return;
    setIsResending(true);
    setError("");
    try {
      const response = await fetch("/api/auth/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (data.success) {
        setResendCooldown(60);
        setCode(["", "", "", "", "", ""]);
        (_a = inputRefs.current[0]) == null ? void 0 : _a.focus();
      } else {
        setError(data.message || t("auth.verifyCode.errorResend"));
      }
    } catch (err) {
      setError(err.message || t("auth.verifyCode.errorResend"));
    } finally {
      setIsResending(false);
    }
  };
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1e3);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);
  useEffect(() => {
    if (code.every((digit) => digit !== "") && !isLoading) {
      handleSubmit();
    }
  }, [code, isLoading]);
  if (success) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-md text-center space-y-6", children: [
      /* @__PURE__ */ jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsx("div", { className: "w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center", children: /* @__PURE__ */ jsx(CheckCircle, { className: "h-10 w-10 text-white" }) }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-slate-900 mb-2", children: t("auth.verifyCode.successTitle") }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-600", children: t("auth.verifyCode.successDesc") })
      ] })
    ] }) });
  }
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4", children: /* @__PURE__ */ jsx("div", { className: "w-full max-w-md", children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-2xl shadow-xl p-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center mb-8", children: [
      /* @__PURE__ */ jsx("div", { className: "inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 mb-4", children: /* @__PURE__ */ jsx(Mail, { className: "h-8 w-8 text-white" }) }),
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-slate-900 mb-2", children: t("auth.verifyCode.title") }),
      /* @__PURE__ */ jsxs("p", { className: "text-slate-600 text-sm", children: [
        /* @__PURE__ */ jsx("strong", { children: email }),
        t("auth.verifyCode.subtitle"),
        /* @__PURE__ */ jsx("br", {}),
        t("auth.verifyCode.enterCode")
      ] })
    ] }),
    error && /* @__PURE__ */ jsxs(Alert, { variant: "destructive", className: "mb-6", children: [
      /* @__PURE__ */ jsx(AlertCircle, { className: "h-4 w-4" }),
      /* @__PURE__ */ jsx(AlertDescription, { children: error })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [
      /* @__PURE__ */ jsx("div", { className: "flex justify-center gap-2", children: code.map((digit, index) => /* @__PURE__ */ jsx(
        "input",
        {
          ref: (el) => inputRefs.current[index] = el,
          type: "text",
          inputMode: "numeric",
          pattern: "\\d*",
          maxLength: 1,
          value: digit,
          onChange: (e) => handleChange(index, e.target.value),
          onKeyDown: (e) => handleKeyDown(index, e),
          onPaste: handlePaste,
          disabled: isLoading,
          className: "w-12 h-14 text-center text-2xl font-bold border-2 border-slate-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed",
          autoFocus: index === 0
        },
        index
      )) }),
      /* @__PURE__ */ jsx("p", { className: "text-center text-sm text-slate-500", children: t("auth.verifyCode.codeValid") }),
      /* @__PURE__ */ jsx(
        Button,
        {
          type: "submit",
          className: "w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium h-11",
          disabled: isLoading || code.join("").length !== 6,
          children: isLoading ? /* @__PURE__ */ jsxs(Fragment$1, { children: [
            /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }),
            t("auth.verifyCode.verifying")
          ] }) : t("auth.verifyCode.verify")
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "text-center", children: /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: handleResend,
          disabled: resendCooldown > 0 || isResending,
          className: "text-sm text-purple-600 hover:text-purple-700 font-medium disabled:text-slate-400 disabled:cursor-not-allowed",
          children: isResending ? /* @__PURE__ */ jsxs(Fragment$1, { children: [
            /* @__PURE__ */ jsx(Loader2, { className: "inline h-3 w-3 animate-spin mr-1" }),
            t("auth.verifyCode.resending")
          ] }) : resendCooldown > 0 ? t("auth.verifyCode.resendIn", { seconds: resendCooldown }) : t("auth.verifyCode.resendCode")
        }
      ) }),
      /* @__PURE__ */ jsx("div", { className: "text-center pt-4 border-t", children: /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: () => navigate2("/signup"),
          className: "text-sm text-slate-600 hover:text-slate-900 inline-flex items-center gap-1",
          children: [
            /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
            t("auth.verifyCode.backToSignup")
          ]
        }
      ) })
    ] })
  ] }) }) });
}
function TrialCardForm({
  planType,
  onSuccess,
  onError,
  isLoading: externalLoading,
  onSubmit,
  clientSecret
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { t } = useLanguage();
  const [cardComplete, setCardComplete] = useState(false);
  const [cardError, setCardError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isLoading = externalLoading || isSubmitting;
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) {
      onError(t("trial.errors.stripeNotLoaded"));
      return;
    }
    if (!cardComplete) {
      onError(t("trial.errors.enterCard"));
      return;
    }
    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      onError(t("trial.errors.cardNotFound"));
      return;
    }
    setIsSubmitting(true);
    try {
      const { setupIntent, error: stripeError } = await stripe.confirmCardSetup(
        clientSecret,
        {
          payment_method: {
            card: cardElement
          }
        }
      );
      if (stripeError) {
        onError(stripeError.message || t("trial.errors.cardVerificationFailed"));
        setIsSubmitting(false);
        return;
      }
      if (!setupIntent || !setupIntent.payment_method) {
        onError(t("trial.errors.paymentSaveFailed"));
        setIsSubmitting(false);
        return;
      }
      console.log("✅ Card setup confirmed:", setupIntent.id);
      const response = await apiClient.activateTrialWithCard(
        setupIntent.payment_method,
        planType
      );
      if (!response.success) {
        onError(response.message || response.error || t("trial.errors.activationFailed"));
        setIsSubmitting(false);
        return;
      }
      console.log("✅ Trial activated:", response);
      setIsSubmitting(false);
      onSuccess(response.message || t("trial.success.message"));
    } catch (error) {
      console.error("Trial activation failed:", error);
      onError(error instanceof Error ? error.message : t("trial.errors.unknown"));
      setIsSubmitting(false);
    }
  };
  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#E4E5E8",
        backgroundColor: "transparent",
        fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSmoothing: "antialiased",
        fontWeight: "400",
        letterSpacing: "-0.01em",
        "::placeholder": {
          color: "#6B7280"
        },
        ":-webkit-autofill": {
          color: "#E4E5E8",
          backgroundColor: "transparent"
        }
      },
      invalid: {
        color: "#EF5B6B",
        iconColor: "#EF5B6B"
      },
      complete: {
        color: "#1FB57A",
        iconColor: "#1FB57A"
      }
    }
  };
  return /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-foreground", children: t("trial.form.cardInfo") }),
      /* @__PURE__ */ jsx("div", { className: "group p-4 border border-card-border rounded-lg bg-card/50 backdrop-blur-sm\n                      transition-all duration-200\n                      focus-within:border-emerald-500/50\n                      focus-within:ring-2\n                      focus-within:ring-emerald-500/20\n                      focus-within:shadow-lg\n                      focus-within:shadow-emerald-500/10", children: /* @__PURE__ */ jsx(
        CardElement,
        {
          options: cardElementOptions,
          onChange: (e) => {
            var _a;
            setCardComplete(e.complete);
            setCardError(((_a = e.error) == null ? void 0 : _a.message) || null);
          }
        }
      ) }),
      cardError && /* @__PURE__ */ jsx("p", { className: "text-sm text-red-400", children: cardError })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: [
      /* @__PURE__ */ jsx(
        "svg",
        {
          className: "w-5 h-5 text-emerald-400",
          fill: "none",
          stroke: "currentColor",
          viewBox: "0 0 24 24",
          children: /* @__PURE__ */ jsx(
            "path",
            {
              strokeLinecap: "round",
              strokeLinejoin: "round",
              strokeWidth: 2,
              d: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            }
          )
        }
      ),
      /* @__PURE__ */ jsx("span", { children: t("trial.form.securePayment") })
    ] }),
    /* @__PURE__ */ jsx(
      Button,
      {
        type: "submit",
        className: "w-full h-12 text-lg font-semibold bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 shadow-lg shadow-emerald-500/20 transition-all duration-200",
        disabled: !stripe || !cardComplete || isLoading,
        children: isLoading ? /* @__PURE__ */ jsxs(Fragment$1, { children: [
          /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-5 w-5 animate-spin" }),
          t("trial.form.processing")
        ] }) : t("trial.form.startTrial")
      }
    ),
    /* @__PURE__ */ jsx("p", { className: "text-center text-sm text-muted-foreground/70", children: planType === "monthly" ? t("trial.form.afterTrialMonthly") : t("trial.form.afterTrialYearly") })
  ] });
}
let stripePromise$1 = null;
const getStripe$1 = () => {
  if (typeof window === "undefined") return null;
  if (!stripePromise$1) {
    stripePromise$1 = loadStripe("pk_live_51SOwUMQ9br8aQ595DPCku84CHeluDHnp90rUF5FVVrMwFrYE5HHMx3MYvWUSUjEWZfqI9dsq44x07s2HmMnK70ep00XLlAWoTn");
  }
  return stripePromise$1;
};
function useTrialSetup() {
  const [state, setState] = useState({
    isLoading: false,
    error: null,
    clientSecret: null,
    customerId: null,
    isSuccess: false
  });
  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      clientSecret: null,
      customerId: null,
      isSuccess: false
    });
  }, []);
  const createSetupIntent = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await apiClient.createTrialSetupIntent();
      if (!response.success || !response.clientSecret) {
        throw new Error(response.message || "SetupIntent 생성 실패");
      }
      setState((prev) => ({
        ...prev,
        isLoading: false,
        clientSecret: response.clientSecret,
        customerId: response.customerId || null
      }));
    } catch (error) {
      console.error("SetupIntent creation failed:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다"
      }));
    }
  }, []);
  const confirmCardSetup = useCallback(async (planType) => {
    if (!state.clientSecret) {
      setState((prev) => ({ ...prev, error: "SetupIntent가 생성되지 않았습니다" }));
      return;
    }
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const stripe = await getStripe$1();
      if (!stripe) {
        throw new Error("Stripe를 로드할 수 없습니다");
      }
      const cardElement = document.querySelector(".StripeElement iframe");
      const { setupIntent, error: stripeError } = await stripe.confirmCardSetup(
        state.clientSecret,
        {
          payment_method: {
            card: cardElement
          }
        }
      );
      if (stripeError) {
        throw new Error(stripeError.message);
      }
      if (!setupIntent || !setupIntent.payment_method) {
        throw new Error("결제 정보 저장 실패");
      }
      console.log("✅ Card setup confirmed:", setupIntent.id);
      const response = await apiClient.activateTrialWithCard(
        setupIntent.payment_method,
        planType
      );
      if (!response.success) {
        throw new Error(response.message || response.error || "트라이얼 활성화 실패");
      }
      console.log("✅ Trial activated:", response);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        isSuccess: true
      }));
    } catch (error) {
      console.error("Trial activation failed:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다"
      }));
    }
  }, [state.clientSecret]);
  return {
    ...state,
    createSetupIntent,
    confirmCardSetup,
    reset
  };
}
let stripePromise = null;
const getStripe = () => {
  if (typeof window === "undefined") return null;
  if (!stripePromise) {
    stripePromise = loadStripe("pk_live_51SOwUMQ9br8aQ595DPCku84CHeluDHnp90rUF5FVVrMwFrYE5HHMx3MYvWUSUjEWZfqI9dsq44x07s2HmMnK70ep00XLlAWoTn");
  }
  return stripePromise;
};
function StartTrialPage() {
  const [, navigate2] = useLocation();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [planType, setPlanType] = useState("monthly");
  const { createSetupIntent, isLoading, error, clientSecret } = useTrialSetup();
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [serverMessage, setServerMessage] = useState("");
  useEffect(() => {
    if (!user) {
      navigate2("/login?redirect=/start-trial");
      return;
    }
    if (user.hasUsedTrial) {
      setSubmitError("이미 무료 체험을 사용하셨습니다. 구독을 시작해주세요.");
      setTimeout(() => {
        navigate2("/premium-checkout");
      }, 2e3);
      return;
    }
    if (user.subscriptionStatus === "active" || user.subscriptionStatus === "trialing") {
      navigate2("/trades");
      return;
    }
    createSetupIntent();
  }, [user]);
  useEffect(() => {
    if (isSuccess) {
      setTimeout(() => {
        window.location.href = "/trades";
      }, 2e3);
    }
  }, [isSuccess]);
  const handleSuccess = (message) => {
    setServerMessage(message);
    setIsSuccess(true);
  };
  const handleError = (errorMessage) => {
    setSubmitError(errorMessage);
  };
  if (isSuccess) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4", children: /* @__PURE__ */ jsx(Card, { className: "max-w-md w-full border-emerald-500/30 bg-gradient-to-br from-card to-slate-900/50 backdrop-blur-sm shadow-2xl shadow-emerald-500/10", children: /* @__PURE__ */ jsxs(CardContent, { className: "pt-6 text-center", children: [
      /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center justify-center", children: /* @__PURE__ */ jsx("div", { className: "w-20 h-20 bg-emerald-500/20 rounded-full blur-xl" }) }),
        /* @__PURE__ */ jsx(CheckCircle2, { className: "relative w-16 h-16 text-emerald-500 mx-auto mb-4" })
      ] }),
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold mb-2 text-foreground", children: t("trial.success.title") }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mb-4", children: serverMessage || t("trial.success.message") }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground/70", children: t("trial.success.redirecting") })
    ] }) }) });
  }
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4", children: /* @__PURE__ */ jsxs("div", { className: "max-w-6xl mx-auto", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center mb-12", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-4xl md:text-5xl font-bold text-foreground mb-4 bg-gradient-to-r from-white via-emerald-100 to-blue-100 bg-clip-text text-transparent", children: t("trial.heading") }),
      /* @__PURE__ */ jsx("p", { className: "text-xl text-muted-foreground", children: t("trial.description") })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-2 gap-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxs(Card, { className: "border-card-border bg-gradient-to-br from-card to-slate-900/50 shadow-lg", children: [
          /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2 text-foreground", children: [
            /* @__PURE__ */ jsx(Sparkles, { className: "w-5 h-5 text-amber-400" }),
            t("trial.benefits.title")
          ] }) }),
          /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: "p-2 rounded-lg bg-blue-500/10 border border-blue-500/20", children: /* @__PURE__ */ jsx(TrendingUp, { className: "w-5 h-5 text-blue-400 flex-shrink-0" }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h3", { className: "font-semibold text-foreground", children: t("trial.benefits.realtime") }),
                /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: t("trial.benefits.realtimeDesc") })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: "p-2 rounded-lg bg-purple-500/10 border border-purple-500/20", children: /* @__PURE__ */ jsx(Brain, { className: "w-5 h-5 text-purple-400 flex-shrink-0" }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h3", { className: "font-semibold text-foreground", children: t("trial.benefits.ai") }),
                /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: t("trial.benefits.aiDesc") })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: "p-2 rounded-lg bg-red-500/10 border border-red-500/20", children: /* @__PURE__ */ jsx(Bell, { className: "w-5 h-5 text-red-400 flex-shrink-0" }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h3", { className: "font-semibold text-foreground", children: t("trial.benefits.alerts") }),
                /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: t("trial.benefits.alertsDesc") })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: "p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20", children: /* @__PURE__ */ jsx(Shield, { className: "w-5 h-5 text-emerald-400 flex-shrink-0" }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h3", { className: "font-semibold text-foreground", children: t("trial.benefits.filter") }),
                /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: t("trial.benefits.filterDesc") })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(Card, { className: "border border-emerald-500/30 bg-emerald-500/5 backdrop-blur-sm shadow-lg shadow-emerald-500/10", children: [
          /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-emerald-400", children: t("trial.terms.title") }) }),
          /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2", children: [
              /* @__PURE__ */ jsx(CheckCircle2, { className: "w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-foreground font-medium", children: t("trial.terms.instant") })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2", children: [
              /* @__PURE__ */ jsx(CheckCircle2, { className: "w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-foreground font-medium", children: t("trial.terms.noBilling") })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2", children: [
              /* @__PURE__ */ jsx(CheckCircle2, { className: "w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-foreground font-medium", children: t("trial.terms.noChargeUntilEnd") })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2", children: [
              /* @__PURE__ */ jsx(CheckCircle2, { className: "w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-foreground font-medium", children: t("trial.terms.cancel") })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs(Card, { className: "border-card-border bg-gradient-to-br from-card to-slate-900/50 shadow-lg", children: [
        /* @__PURE__ */ jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsx(CardTitle, { className: "text-foreground", children: t("trial.form.title") }),
          /* @__PURE__ */ jsx(CardDescription, { className: "text-muted-foreground", children: t("trial.form.description") })
        ] }),
        /* @__PURE__ */ jsxs(CardContent, { className: "space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-foreground", children: t("trial.form.selectPlan") }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => setPlanType("monthly"),
                  className: `p-4 rounded-lg text-left transition-all duration-200 ${planType === "monthly" ? "bg-gradient-to-br from-emerald-500 to-blue-500 shadow-lg shadow-emerald-500/20 border border-emerald-400/50" : "bg-slate-800/50 border border-card-border hover:border-emerald-500/30 hover:bg-slate-800/70"}`,
                  children: [
                    /* @__PURE__ */ jsx("div", { className: "font-semibold text-white", children: t("trial.form.monthly") }),
                    /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold mt-1 text-white", children: "$14" }),
                    /* @__PURE__ */ jsx("div", { className: "text-sm text-white/80", children: t("trial.form.perMonth") })
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => setPlanType("yearly"),
                  className: `p-4 rounded-lg text-left transition-all duration-200 relative overflow-hidden ${planType === "yearly" ? "bg-gradient-to-br from-emerald-500 to-blue-500 shadow-lg shadow-emerald-500/20 border border-emerald-400/50" : "bg-slate-800/50 border border-card-border hover:border-emerald-500/30 hover:bg-slate-800/70"}`,
                  children: [
                    /* @__PURE__ */ jsx("div", { className: "absolute -right-8 -top-8 w-24 h-24 bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 rotate-45 flex items-end justify-center pb-6 shadow-lg", children: /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-slate-900 -rotate-45 translate-y-3", children: "33% OFF" }) }),
                    /* @__PURE__ */ jsx("div", { className: "font-semibold text-white", children: t("trial.form.yearly") }),
                    /* @__PURE__ */ jsxs("div", { className: "flex items-baseline gap-2 mt-1", children: [
                      /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-white", children: "$112" }),
                      /* @__PURE__ */ jsx("div", { className: "text-sm text-white/60 line-through", children: "$168" })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "text-xs text-white/80 mt-1", children: [
                      "= ",
                      /* @__PURE__ */ jsx("span", { className: "font-bold text-amber-300", children: "$9.33" }),
                      t("trial.yearly.perMonth")
                    ] }),
                    /* @__PURE__ */ jsx("div", { className: "text-xs text-emerald-300 font-medium mt-0.5", children: t("trial.yearly.savings") })
                  ]
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-4 p-4 border-2 border-blue-400 rounded-lg bg-blue-500/10", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("span", { className: "text-blue-400 font-bold text-xs px-2 py-1 bg-blue-500/20 rounded", children: "💎 MINI" }),
                /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-foreground", children: "미니 플랜" })
              ] }),
              /* @__PURE__ */ jsx("span", { className: "text-2xl font-bold text-blue-400", children: "$0.10" })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mb-3", children: "1분 무료체험 후 자동 청구" }),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setPlanType("test"),
                className: `w-full py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${planType === "test" ? "bg-blue-500 text-white shadow-lg" : "bg-slate-800/50 text-foreground border border-blue-500/30 hover:bg-blue-500/10"}`,
                children: planType === "test" ? "✓ 선택됨" : "미니 플랜 선택"
              }
            )
          ] }),
          clientSecret && /* @__PURE__ */ jsx(Elements, { stripe: getStripe(), children: /* @__PURE__ */ jsx(
            TrialCardForm,
            {
              planType,
              onSuccess: handleSuccess,
              onError: handleError,
              isLoading,
              onSubmit: async () => {
              },
              clientSecret
            }
          ) }),
          (error || submitError) && /* @__PURE__ */ jsx(Alert, { variant: "destructive", children: /* @__PURE__ */ jsx(AlertDescription, { children: error || submitError }) }),
          /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground/70 space-y-2 pt-4 border-t border-card-border", children: [
            /* @__PURE__ */ jsx("p", { children: t("trial.form.info1") }),
            /* @__PURE__ */ jsx("p", { children: t("trial.form.info2") }),
            /* @__PURE__ */ jsx("p", { children: t("trial.form.info3") })
          ] })
        ] })
      ] }) })
    ] })
  ] }) });
}
function NotFound() {
  const { t } = useLanguage();
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen w-full flex items-center justify-center bg-gray-50", children: /* @__PURE__ */ jsx(Card, { className: "w-full max-w-md mx-4", children: /* @__PURE__ */ jsxs(CardContent, { className: "pt-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex mb-4 gap-2", children: [
      /* @__PURE__ */ jsx(AlertCircle, { className: "h-8 w-8 text-red-500" }),
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900", children: t("notFound.title") })
    ] }),
    /* @__PURE__ */ jsx("p", { className: "mt-4 text-sm text-gray-600", children: t("notFound.message") })
  ] }) }) });
}
function AdminDashboard() {
  useLanguage();
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [growthData, setGrowthData] = useState([]);
  const [conversionData, setConversionData] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [geographyData, setGeographyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adminKey, setAdminKey] = useState("");
  const [showKeyInput, setShowKeyInput] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem("adminKey");
    if (stored) {
      setAdminKey(stored);
      loadAdminData(stored);
    } else {
      setShowKeyInput(true);
      setLoading(false);
    }
  }, []);
  const handleKeySubmit = () => {
    if (adminKey.trim()) {
      localStorage.setItem("adminKey", adminKey.trim());
      setShowKeyInput(false);
      loadAdminData(adminKey.trim());
    }
  };
  const loadAdminData = async (key) => {
    try {
      setLoading(true);
      setError(null);
      const headers = { "x-admin-key": key };
      const metricsRes = await fetch("/api/admin/metrics/overview", { headers });
      if (!metricsRes.ok) {
        throw new Error(`Failed to fetch metrics: ${metricsRes.statusText}`);
      }
      const metricsData = await metricsRes.json();
      setMetrics(metricsData.metrics);
      const usersRes = await fetch("/api/admin/metrics/users?limit=50", { headers });
      if (!usersRes.ok) {
        throw new Error(`Failed to fetch users: ${usersRes.statusText}`);
      }
      const usersData = await usersRes.json();
      setUsers(usersData.users);
      const growthRes = await fetch("/api/admin/metrics/growth", { headers });
      if (!growthRes.ok) {
        throw new Error(`Failed to fetch growth: ${growthRes.statusText}`);
      }
      const growthDataRes = await growthRes.json();
      setGrowthData(growthDataRes.growth || []);
      const conversionRes = await fetch("/api/admin/metrics/conversion", { headers });
      if (!conversionRes.ok) {
        throw new Error(`Failed to fetch conversion: ${conversionRes.statusText}`);
      }
      const conversionDataRes = await conversionRes.json();
      setConversionData({
        funnel: conversionDataRes.funnel || [],
        metrics: conversionDataRes.metrics || { signupToTrialRate: 0, trialToPaidRate: 0, overallConversionRate: 0 }
      });
      const revenueRes = await fetch("/api/admin/metrics/revenue", { headers });
      if (!revenueRes.ok) {
        throw new Error(`Failed to fetch revenue: ${revenueRes.statusText}`);
      }
      const revenueDataRes = await revenueRes.json();
      setRevenueData({
        mrr: revenueDataRes.mrr || 0,
        arr: revenueDataRes.arr || 0,
        totalPaidUsers: revenueDataRes.totalPaidUsers || 0,
        arpu: revenueDataRes.arpu || 0,
        newSubscriptionsLast30Days: revenueDataRes.newSubscriptionsLast30Days || 0,
        revenueTrend: revenueDataRes.revenueTrend || [],
        calculatedAt: revenueDataRes.calculatedAt || (/* @__PURE__ */ new Date()).toISOString()
      });
      const geographyRes = await fetch("/api/admin/metrics/geography", { headers });
      if (!geographyRes.ok) {
        throw new Error(`Failed to fetch geography: ${geographyRes.statusText}`);
      }
      const geographyDataRes = await geographyRes.json();
      setGeographyData({
        totalSessions: geographyDataRes.totalSessions || 0,
        uniqueUsers: geographyDataRes.uniqueUsers || 0,
        countries: geographyDataRes.countries || [],
        topCities: geographyDataRes.topCities || [],
        calculatedAt: geographyDataRes.calculatedAt || (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (err) {
      console.error("Failed to load admin data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  };
  const getStatusBadge = (status) => {
    const variants = {
      paid: "default",
      trial: "secondary",
      free: "outline"
    };
    const labels = {
      paid: "유료",
      trial: "무료체험",
      free: "무료"
    };
    return /* @__PURE__ */ jsx(Badge, { variant: variants[status] || "outline", children: labels[status] || status });
  };
  if (showKeyInput) {
    return /* @__PURE__ */ jsx("div", { className: "container mx-auto p-8 max-w-md", children: /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Admin Access" }) }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "text-sm font-medium", children: "Admin API Key" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              type: "password",
              value: adminKey,
              onChange: (e) => setAdminKey(e.target.value),
              onKeyPress: (e) => e.key === "Enter" && handleKeySubmit(),
              placeholder: "Enter admin API key",
              className: "mt-2"
            }
          )
        ] }),
        /* @__PURE__ */ jsx(Button, { onClick: handleKeySubmit, className: "w-full", children: "Access Dashboard" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Find your admin key in Replit Secrets (ADMIN_API_KEY or SESSION_SECRET)" })
      ] }) })
    ] }) });
  }
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "container mx-auto p-8", children: /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "flex items-center justify-center py-12", children: [
      /* @__PURE__ */ jsx(RefreshCw, { className: "h-8 w-8 animate-spin text-primary" }),
      /* @__PURE__ */ jsx("span", { className: "ml-3", children: "Loading admin dashboard..." })
    ] }) }) });
  }
  if (error) {
    return /* @__PURE__ */ jsx("div", { className: "container mx-auto p-8 max-w-md", children: /* @__PURE__ */ jsxs(Card, { className: "border-destructive", children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-destructive", children: "Error" }) }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm", children: error }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsx(Button, { onClick: () => loadAdminData(adminKey), variant: "outline", children: "Retry" }),
          /* @__PURE__ */ jsx(
            Button,
            {
              onClick: () => {
                localStorage.removeItem("adminKey");
                setShowKeyInput(true);
                setError(null);
              },
              variant: "ghost",
              children: "Reset Key"
            }
          )
        ] })
      ] })
    ] }) });
  }
  if (!metrics) return null;
  return /* @__PURE__ */ jsxs("div", { className: "container mx-auto p-4 md:p-8 space-y-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "Admin Dashboard" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "SaaS metrics overview" })
      ] }),
      /* @__PURE__ */ jsxs(Button, { onClick: () => loadAdminData(adminKey), variant: "outline", size: "sm", children: [
        /* @__PURE__ */ jsx(RefreshCw, { className: "h-4 w-4 mr-2" }),
        "Refresh"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: [
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsxs(CardHeader, { className: "flex flex-row items-center justify-between pb-2", children: [
          /* @__PURE__ */ jsx(CardTitle, { className: "text-sm font-medium", children: "Total Users" }),
          /* @__PURE__ */ jsx(Users, { className: "h-4 w-4 text-muted-foreground" })
        ] }),
        /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold", children: metrics.totalUsers }) })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsxs(CardHeader, { className: "flex flex-row items-center justify-between pb-2", children: [
          /* @__PURE__ */ jsx(CardTitle, { className: "text-sm font-medium", children: "Free Trial" }),
          /* @__PURE__ */ jsx(UserCheck, { className: "h-4 w-4 text-muted-foreground" })
        ] }),
        /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold", children: metrics.trialUsers }) })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsxs(CardHeader, { className: "flex flex-row items-center justify-between pb-2", children: [
          /* @__PURE__ */ jsx(CardTitle, { className: "text-sm font-medium", children: "Paid Users" }),
          /* @__PURE__ */ jsx(CreditCard, { className: "h-4 w-4 text-muted-foreground" })
        ] }),
        /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold", children: metrics.paidUsers }) })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsxs(CardHeader, { className: "flex flex-row items-center justify-between pb-2", children: [
          /* @__PURE__ */ jsx(CardTitle, { className: "text-sm font-medium", children: "Today's Signups" }),
          /* @__PURE__ */ jsx(TrendingUp, { className: "h-4 w-4 text-muted-foreground" })
        ] }),
        /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold", children: metrics.todaySignups }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Signup Growth (Last 30 Days)" }) }),
        /* @__PURE__ */ jsx(CardContent, { children: growthData.length > 0 ? /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: 300, children: /* @__PURE__ */ jsxs(LineChart, { data: growthData, children: [
          /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3" }),
          /* @__PURE__ */ jsx(
            XAxis,
            {
              dataKey: "date",
              tick: { fontSize: 12 },
              tickFormatter: (value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }
            }
          ),
          /* @__PURE__ */ jsx(YAxis, {}),
          /* @__PURE__ */ jsx(
            Tooltip$1,
            {
              labelFormatter: (value) => new Date(value).toLocaleDateString("ko-KR")
            }
          ),
          /* @__PURE__ */ jsx(Legend, {}),
          /* @__PURE__ */ jsx(
            Line,
            {
              type: "monotone",
              dataKey: "signups",
              stroke: "#8884d8",
              strokeWidth: 2,
              name: "New Signups"
            }
          )
        ] }) }) : /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-[300px] text-muted-foreground", children: "No signup data available" }) })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "User Composition" }) }),
        /* @__PURE__ */ jsx(CardContent, { children: metrics && /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: 300, children: /* @__PURE__ */ jsxs(PieChart$1, { children: [
          /* @__PURE__ */ jsx(
            Pie,
            {
              data: [
                { name: "Free Users", value: metrics.freeUsers, color: "#94a3b8" },
                { name: "Trial Users", value: metrics.trialUsers, color: "#60a5fa" },
                { name: "Paid Users", value: metrics.paidUsers, color: "#34d399" }
              ],
              cx: "50%",
              cy: "50%",
              labelLine: false,
              label: ({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`,
              outerRadius: 80,
              fill: "#8884d8",
              dataKey: "value",
              children: [
                { name: "Free Users", value: metrics.freeUsers, color: "#94a3b8" },
                { name: "Trial Users", value: metrics.trialUsers, color: "#60a5fa" },
                { name: "Paid Users", value: metrics.paidUsers, color: "#34d399" }
              ].map((entry, index) => /* @__PURE__ */ jsx(Cell, { fill: entry.color }, `cell-${index}`))
            }
          ),
          /* @__PURE__ */ jsx(Tooltip$1, {}),
          /* @__PURE__ */ jsx(Legend, {})
        ] }) }) })
      ] })
    ] }),
    conversionData && /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Conversion Funnel" }) }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 mb-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg", children: [
            /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "Signup → Trial" }),
            /* @__PURE__ */ jsxs("div", { className: "text-2xl font-bold text-blue-600 dark:text-blue-400", children: [
              conversionData.metrics.signupToTrialRate,
              "%"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-4 bg-green-50 dark:bg-green-900/20 rounded-lg", children: [
            /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "Trial → Paid" }),
            /* @__PURE__ */ jsxs("div", { className: "text-2xl font-bold text-green-600 dark:text-green-400", children: [
              conversionData.metrics.trialToPaidRate,
              "%"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg", children: [
            /* @__PURE__ */ jsx("div", { className: "text-sm text-muted-foreground", children: "Overall Conversion" }),
            /* @__PURE__ */ jsxs("div", { className: "text-2xl font-bold text-purple-600 dark:text-purple-400", children: [
              conversionData.metrics.overallConversionRate,
              "%"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: 300, children: /* @__PURE__ */ jsxs(BarChart, { data: conversionData.funnel, layout: "vertical", children: [
          /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3" }),
          /* @__PURE__ */ jsx(XAxis, { type: "number" }),
          /* @__PURE__ */ jsx(YAxis, { dataKey: "stage", type: "category", width: 150 }),
          /* @__PURE__ */ jsx(
            Tooltip$1,
            {
              formatter: (value, name) => {
                if (name === "count") return [value, "Users"];
                if (name === "percentage") return [`${value.toFixed(1)}%`, "Percentage"];
                return [value, name];
              }
            }
          ),
          /* @__PURE__ */ jsx(Legend, {}),
          /* @__PURE__ */ jsx(Bar, { dataKey: "count", fill: "#8884d8", name: "Users" })
        ] }) })
      ] }) })
    ] }),
    revenueData && /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: [
        /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsxs(CardHeader, { className: "flex flex-row items-center justify-between pb-2", children: [
            /* @__PURE__ */ jsx(CardTitle, { className: "text-sm font-medium", children: "MRR" }),
            /* @__PURE__ */ jsx(TrendingUp, { className: "h-4 w-4 text-muted-foreground" })
          ] }),
          /* @__PURE__ */ jsxs(CardContent, { children: [
            /* @__PURE__ */ jsxs("div", { className: "text-2xl font-bold", children: [
              "$",
              revenueData.mrr.toLocaleString()
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "Monthly Recurring Revenue" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsxs(CardHeader, { className: "flex flex-row items-center justify-between pb-2", children: [
            /* @__PURE__ */ jsx(CardTitle, { className: "text-sm font-medium", children: "ARR" }),
            /* @__PURE__ */ jsx(TrendingUp, { className: "h-4 w-4 text-muted-foreground" })
          ] }),
          /* @__PURE__ */ jsxs(CardContent, { children: [
            /* @__PURE__ */ jsxs("div", { className: "text-2xl font-bold", children: [
              "$",
              revenueData.arr.toLocaleString()
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "Annual Recurring Revenue" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsxs(CardHeader, { className: "flex flex-row items-center justify-between pb-2", children: [
            /* @__PURE__ */ jsx(CardTitle, { className: "text-sm font-medium", children: "ARPU" }),
            /* @__PURE__ */ jsx(CreditCard, { className: "h-4 w-4 text-muted-foreground" })
          ] }),
          /* @__PURE__ */ jsxs(CardContent, { children: [
            /* @__PURE__ */ jsxs("div", { className: "text-2xl font-bold", children: [
              "$",
              revenueData.arpu.toFixed(2)
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "Average Revenue Per User" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(Card, { children: [
          /* @__PURE__ */ jsxs(CardHeader, { className: "flex flex-row items-center justify-between pb-2", children: [
            /* @__PURE__ */ jsx(CardTitle, { className: "text-sm font-medium", children: "New Subs (30d)" }),
            /* @__PURE__ */ jsx(UserCheck, { className: "h-4 w-4 text-muted-foreground" })
          ] }),
          /* @__PURE__ */ jsxs(CardContent, { children: [
            /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold", children: revenueData.newSubscriptionsLast30Days }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "Last 30 days" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Revenue Trend (Last 30 Days)" }) }),
        /* @__PURE__ */ jsx(CardContent, { children: revenueData.revenueTrend.length > 0 ? /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: 300, children: /* @__PURE__ */ jsxs(LineChart, { data: revenueData.revenueTrend, children: [
          /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3" }),
          /* @__PURE__ */ jsx(
            XAxis,
            {
              dataKey: "date",
              tick: { fontSize: 12 },
              tickFormatter: (value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }
            }
          ),
          /* @__PURE__ */ jsx(YAxis, {}),
          /* @__PURE__ */ jsx(
            Tooltip$1,
            {
              labelFormatter: (value) => new Date(value).toLocaleDateString("ko-KR"),
              formatter: (value, name) => {
                if (name === "revenue") return [`$${value}`, "Revenue"];
                return [value, "New Subscribers"];
              }
            }
          ),
          /* @__PURE__ */ jsx(Legend, {}),
          /* @__PURE__ */ jsx(
            Line,
            {
              type: "monotone",
              dataKey: "revenue",
              stroke: "#10b981",
              strokeWidth: 2,
              name: "Revenue"
            }
          ),
          /* @__PURE__ */ jsx(
            Line,
            {
              type: "monotone",
              dataKey: "newSubscribers",
              stroke: "#3b82f6",
              strokeWidth: 2,
              name: "New Subscribers"
            }
          )
        ] }) }) : /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-[300px] text-muted-foreground", children: "No revenue data available" }) })
      ] })
    ] }),
    geographyData && /* @__PURE__ */ jsx("div", { className: "space-y-6", children: /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Geographic Distribution" }) }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h4", { className: "text-sm font-medium mb-4", children: "Sessions by Country" }),
          geographyData.countries.length > 0 ? /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: 300, children: /* @__PURE__ */ jsxs(BarChart, { data: geographyData.countries.slice(0, 10), layout: "vertical", children: [
            /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3" }),
            /* @__PURE__ */ jsx(XAxis, { type: "number" }),
            /* @__PURE__ */ jsx(YAxis, { dataKey: "countryName", type: "category", width: 100, tick: { fontSize: 12 } }),
            /* @__PURE__ */ jsx(Tooltip$1, {}),
            /* @__PURE__ */ jsx(Legend, {}),
            /* @__PURE__ */ jsx(Bar, { dataKey: "sessions", fill: "#8b5cf6", name: "Sessions" })
          ] }) }) : /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-[300px] text-muted-foreground", children: "No geographic data available yet" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h4", { className: "text-sm font-medium mb-4", children: "Top Cities" }),
          /* @__PURE__ */ jsx("div", { className: "space-y-2", children: geographyData.topCities.length > 0 ? geographyData.topCities.map((city, index) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-3 bg-muted/50 rounded-lg", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("div", { className: "font-medium text-sm", children: city.city }),
              /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: city.country })
            ] }),
            /* @__PURE__ */ jsxs(Badge, { children: [
              city.sessions,
              " sessions"
            ] })
          ] }, index)) : /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-[300px] text-muted-foreground", children: "No city data available yet" }) })
        ] })
      ] }) })
    ] }) }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { children: [
        "Recent Users (",
        users.length,
        ")"
      ] }) }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b", children: [
          /* @__PURE__ */ jsx("th", { className: "text-left py-2 px-4 font-medium", children: "Email" }),
          /* @__PURE__ */ jsx("th", { className: "text-left py-2 px-4 font-medium", children: "Status" }),
          /* @__PURE__ */ jsx("th", { className: "text-left py-2 px-4 font-medium", children: "Verified" }),
          /* @__PURE__ */ jsx("th", { className: "text-left py-2 px-4 font-medium", children: "Joined" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { children: users.map((user) => /* @__PURE__ */ jsxs("tr", { className: "border-b hover:bg-muted/50", children: [
          /* @__PURE__ */ jsxs("td", { className: "py-3 px-4", children: [
            /* @__PURE__ */ jsx("div", { className: "font-medium", children: user.email }),
            user.role === "admin" && /* @__PURE__ */ jsx(Badge, { variant: "destructive", className: "text-xs mt-1", children: "Admin" })
          ] }),
          /* @__PURE__ */ jsx("td", { className: "py-3 px-4", children: getStatusBadge(user.status) }),
          /* @__PURE__ */ jsx("td", { className: "py-3 px-4", children: user.emailVerified ? /* @__PURE__ */ jsx(Badge, { variant: "default", children: "✓ Yes" }) : /* @__PURE__ */ jsx(Badge, { variant: "outline", children: "✗ No" }) }),
          /* @__PURE__ */ jsx("td", { className: "py-3 px-4 text-sm text-muted-foreground", children: formatDate(user.createdAt) })
        ] }, user.id)) })
      ] }) }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "text-center text-sm text-muted-foreground", children: [
      "Last updated: ",
      formatDate(metrics.calculatedAt)
    ] })
  ] });
}
const Dialog = SheetPrimitive.Root;
const DialogPortal = SheetPrimitive.Portal;
const DialogOverlay = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SheetPrimitive.Overlay,
  {
    ref,
    className: cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    ),
    ...props
  }
));
DialogOverlay.displayName = SheetPrimitive.Overlay.displayName;
const DialogContent = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs(DialogPortal, { children: [
  /* @__PURE__ */ jsx(DialogOverlay, {}),
  /* @__PURE__ */ jsxs(
    SheetPrimitive.Content,
    {
      ref,
      className: cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      ),
      ...props,
      children: [
        children,
        /* @__PURE__ */ jsxs(SheetPrimitive.Close, { className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground", children: [
          /* @__PURE__ */ jsx(X, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Close" })
        ] })
      ]
    }
  )
] }));
DialogContent.displayName = SheetPrimitive.Content.displayName;
const DialogHeader = ({
  className,
  ...props
}) => /* @__PURE__ */ jsx(
  "div",
  {
    className: cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    ),
    ...props
  }
);
DialogHeader.displayName = "DialogHeader";
const DialogTitle = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SheetPrimitive.Title,
  {
    ref,
    className: cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    ),
    ...props
  }
));
DialogTitle.displayName = SheetPrimitive.Title.displayName;
const DialogDescription = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SheetPrimitive.Description,
  {
    ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
DialogDescription.displayName = SheetPrimitive.Description.displayName;
function LanguageSelectionModal({ open, onClose }) {
  const { setLanguage } = useLanguage();
  const [selectedLang, setSelectedLang] = useState(null);
  const languages = [
    {
      code: "en",
      name: "English",
      nativeName: "English",
      flag: "🇺🇸"
    },
    {
      code: "ko",
      name: "Korean",
      nativeName: "한국어",
      flag: "🇰🇷"
    },
    {
      code: "ja",
      name: "Japanese",
      nativeName: "日本語",
      flag: "🇯🇵"
    },
    {
      code: "zh",
      name: "Chinese",
      nativeName: "中文",
      flag: "🇨🇳"
    }
  ];
  const handleLanguageSelect = (lang) => {
    setSelectedLang(lang);
    setLanguage(lang);
    localStorage.setItem("language-selected", "true");
    setTimeout(() => {
      onClose();
    }, 300);
  };
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange: (isOpen) => !isOpen && onClose(), children: /* @__PURE__ */ jsxs(DialogContent, { className: "sm:max-w-md bg-[#0a0a0f]/95 backdrop-blur-2xl border-white/10", children: [
    /* @__PURE__ */ jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center mb-4", children: /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500", children: /* @__PURE__ */ jsx(TrendingUp, { className: "h-6 w-6 text-white" }) }) }),
      /* @__PURE__ */ jsx(DialogTitle, { className: "text-2xl font-bold text-center text-white", children: "Select Your Language" }),
      /* @__PURE__ */ jsx(DialogDescription, { className: "text-center text-slate-400", children: "Choose your preferred language for the best experience" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "space-y-3 mt-4", children: languages.map((lang) => /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: () => handleLanguageSelect(lang.code),
        className: `w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${selectedLang === lang.code ? "border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/20" : "border-white/10 hover:border-emerald-500/50 hover:bg-white/5"}`,
        children: [
          /* @__PURE__ */ jsx("div", { className: "text-4xl", children: lang.flag }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1 text-left", children: [
            /* @__PURE__ */ jsx("div", { className: "font-semibold text-white text-lg", children: lang.nativeName }),
            /* @__PURE__ */ jsx("div", { className: "text-sm text-slate-400", children: lang.name })
          ] }),
          selectedLang === lang.code && /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500", children: /* @__PURE__ */ jsx(Check, { className: "w-4 h-4 text-white" }) })
        ]
      },
      lang.code
    )) }),
    /* @__PURE__ */ jsx("div", { className: "mt-6 text-center text-xs text-slate-500", children: "You can change this anytime in settings" })
  ] }) });
}
function LandingPage() {
  const [, navigate2] = useLocation();
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [showLanguageSelection, setShowLanguageSelection] = useState(false);
  useEffect(() => {
    const languageSelected = localStorage.getItem("language-selected");
    if (!languageSelected) {
      setShowLanguageSelection(true);
    }
  }, []);
  useEffect(() => {
    if (isAuthenticated) {
      navigate2("/trades");
    }
  }, [isAuthenticated, navigate2]);
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen relative bg-[#0a0a0f] overflow-hidden", children: [
    /* @__PURE__ */ jsx(
      LanguageSelectionModal,
      {
        open: showLanguageSelection,
        onClose: () => setShowLanguageSelection(false)
      }
    ),
    /* @__PURE__ */ jsx(StripeMeshGradient, { variant: "purple", opacity: 0.4, animate: true }),
    /* @__PURE__ */ jsx("header", { className: "sticky top-0 z-50 w-full border-b border-white/5 bg-black/40 backdrop-blur-2xl", children: /* @__PURE__ */ jsxs("div", { className: "container flex h-16 items-center justify-between px-6 max-w-7xl mx-auto", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500", children: /* @__PURE__ */ jsx(TrendingUp, { className: "h-5 w-5 text-white" }) }),
        /* @__PURE__ */ jsx("span", { className: "text-lg font-semibold text-white tracking-tight", children: "InsiderPulse" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-4" })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "container px-4 lg:px-6 py-32 md:py-48 relative z-10 max-w-7xl mx-auto", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-5xl text-center", children: [
      /* @__PURE__ */ jsxs(Badge, { className: "mb-8 px-4 py-2 text-xs font-medium\n                           bg-white/10 text-white border border-white/20\n                           backdrop-blur-xl rounded-full\n                           shadow-lg shadow-purple-500/10", children: [
        /* @__PURE__ */ jsx(Sparkles, { className: "inline-block w-3 h-3 mr-2" }),
        t("landing.tagline")
      ] }),
      /* @__PURE__ */ jsx("h1", { className: "mb-8 text-5xl sm:text-6xl md:text-7xl lg:text-8xl\n                        font-bold tracking-tight\n                        text-white leading-[1.1]\n                        bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/40\n                        [text-shadow:_0_1px_2px_rgb(0_0_0_/_20%)]", children: t("landing.title") }),
      /* @__PURE__ */ jsx("p", { className: "mb-12 text-lg sm:text-xl md:text-2xl\n                        text-slate-400 max-w-3xl mx-auto\n                        leading-relaxed font-normal", children: t("landing.description") }),
      /* @__PURE__ */ jsx("div", { className: "flex flex-col sm:flex-row justify-center gap-4 items-center mb-8", children: /* @__PURE__ */ jsx(Link, { href: "/trades", children: /* @__PURE__ */ jsxs(
        Button,
        {
          size: "lg",
          className: "w-full sm:w-auto text-base font-medium px-8 py-6\n                           bg-white text-black\n                           hover:bg-slate-100\n                           rounded-full\n                           shadow-[0_20px_60px_-15px_rgba(255,255,255,0.3)]\n                           hover:shadow-[0_25px_80px_-15px_rgba(255,255,255,0.4)]\n                           transition-all duration-200\n                           border border-white/20",
          "data-testid": "button-hero-browse",
          children: [
            t("landing.browse"),
            /* @__PURE__ */ jsx(ArrowRight, { className: "ml-2 h-5 w-5" })
          ]
        }
      ) }) }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 font-medium", children: t("landing.noCreditCard") })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "container px-4 lg:px-6 py-24 md:py-32 relative z-10 max-w-7xl mx-auto", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-6xl", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-20", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white tracking-tight leading-tight", children: t("landing.features.title") }),
        /* @__PURE__ */ jsx("p", { className: "text-lg md:text-xl text-slate-400 font-normal max-w-2xl mx-auto", children: t("landing.features.subtitle") })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 lg:grid-cols-3 gap-6", children: [
        /* @__PURE__ */ jsxs(GlassCard, { variant: "default", className: "p-8", children: [
          /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 mb-6", children: /* @__PURE__ */ jsx(Brain, { className: "h-6 w-6 text-white" }) }),
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold mb-3 text-white", children: t("landing.features.aiAnalysis") }),
          /* @__PURE__ */ jsx("p", { className: "text-base text-slate-400 leading-relaxed", children: t("landing.features.aiAnalysisDesc") })
        ] }),
        /* @__PURE__ */ jsxs(GlassCard, { variant: "default", className: "p-8", children: [
          /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 mb-6", children: /* @__PURE__ */ jsx(Zap, { className: "h-6 w-6 text-white" }) }),
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold mb-3 text-white", children: t("landing.features.realtime") }),
          /* @__PURE__ */ jsx("p", { className: "text-base text-slate-400 leading-relaxed", children: t("landing.features.realtimeDesc") })
        ] }),
        /* @__PURE__ */ jsxs(GlassCard, { variant: "default", className: "p-8", children: [
          /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 mb-6", children: /* @__PURE__ */ jsx(BarChart3, { className: "h-6 w-6 text-white" }) }),
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold mb-3 text-white", children: t("landing.features.filtering") }),
          /* @__PURE__ */ jsx("p", { className: "text-base text-slate-400 leading-relaxed", children: t("landing.features.filteringDesc") })
        ] }),
        /* @__PURE__ */ jsxs(GlassCard, { variant: "default", className: "p-8", children: [
          /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 mb-6", children: /* @__PURE__ */ jsx(Bell, { className: "h-6 w-6 text-white" }) }),
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold mb-3 text-white", children: t("landing.features.alerts") }),
          /* @__PURE__ */ jsx("p", { className: "text-base text-slate-400 leading-relaxed", children: t("landing.features.alertsDesc") })
        ] }),
        /* @__PURE__ */ jsxs(GlassCard, { variant: "default", className: "p-8", children: [
          /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 mb-6", children: /* @__PURE__ */ jsx(Shield, { className: "h-6 w-6 text-white" }) }),
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold mb-3 text-white", children: t("landing.features.secData") }),
          /* @__PURE__ */ jsx("p", { className: "text-base text-slate-400 leading-relaxed", children: t("landing.features.secDataDesc") })
        ] }),
        /* @__PURE__ */ jsxs(GlassCard, { variant: "default", className: "p-8", children: [
          /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 mb-6", children: /* @__PURE__ */ jsx(Clock, { className: "h-6 w-6 text-white" }) }),
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold mb-3 text-white", children: t("landing.features.historical") }),
          /* @__PURE__ */ jsx("p", { className: "text-base text-slate-400 leading-relaxed", children: t("landing.features.historicalDesc") })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "container px-4 lg:px-6 py-24 md:py-32 relative z-10 max-w-7xl mx-auto", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-6xl", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-20", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white tracking-tight", children: t("landing.pricing.title") }),
        /* @__PURE__ */ jsx("p", { className: "text-lg md:text-xl text-slate-400 font-normal", children: t("landing.pricing.subtitle") })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-8 max-w-4xl mx-auto", children: [
        /* @__PURE__ */ jsxs(GlassCard, { variant: "premium", className: "p-10 relative", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute -top-4 left-1/2 -translate-x-1/2", children: /* @__PURE__ */ jsxs(Badge, { className: "bg-gradient-to-r from-purple-500 to-cyan-500 text-white border-none px-4 py-1.5 rounded-full shadow-lg", children: [
            /* @__PURE__ */ jsx(Sparkles, { className: "inline-block w-3 h-3 mr-1" }),
            t("landing.pricing.mostPopular")
          ] }) }),
          /* @__PURE__ */ jsxs("div", { className: "mb-8", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-2xl font-bold text-white mb-2", children: t("landing.pricing.monthly") }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-baseline gap-2 mb-4", children: [
              /* @__PURE__ */ jsx("span", { className: "text-6xl font-bold text-white", children: t("landing.pricing.monthlyPrice") }),
              /* @__PURE__ */ jsx("span", { className: "text-slate-400 font-medium", children: t("landing.pricing.monthlyPeriod") })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-emerald-400 font-medium", children: t("landing.pricing.monthlyTrial") })
          ] }),
          /* @__PURE__ */ jsxs("ul", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-3", children: [
              /* @__PURE__ */ jsx(Check, { className: "h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" }),
              /* @__PURE__ */ jsx("span", { className: "text-white", children: t("landing.pricing.monthlyFeature1") })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-3", children: [
              /* @__PURE__ */ jsx(Check, { className: "h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" }),
              /* @__PURE__ */ jsx("span", { className: "text-white", children: t("landing.pricing.monthlyFeature2") })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-3", children: [
              /* @__PURE__ */ jsx(Check, { className: "h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" }),
              /* @__PURE__ */ jsx("span", { className: "text-white", children: t("landing.pricing.monthlyFeature3") })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-3", children: [
              /* @__PURE__ */ jsx(Check, { className: "h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" }),
              /* @__PURE__ */ jsx("span", { className: "text-white", children: t("landing.pricing.monthlyFeature4") })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-3", children: [
              /* @__PURE__ */ jsx(Check, { className: "h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" }),
              /* @__PURE__ */ jsx("span", { className: "text-white", children: t("landing.pricing.monthlyFeature5") })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(GlassCard, { variant: "elevated", className: "p-10 relative", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute -top-4 left-1/2 -translate-x-1/2", children: /* @__PURE__ */ jsx(Badge, { className: "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-none px-4 py-1.5 rounded-full shadow-lg", children: t("landing.pricing.savePercent") }) }),
          /* @__PURE__ */ jsxs("div", { className: "mb-8", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-2xl font-bold text-white mb-2", children: t("landing.pricing.yearly") }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-baseline gap-2 mb-4", children: [
              /* @__PURE__ */ jsx("span", { className: "text-6xl font-bold text-white", children: t("landing.pricing.yearlyPrice") }),
              /* @__PURE__ */ jsx("span", { className: "text-slate-400 font-medium", children: t("landing.pricing.yearlyPeriod") })
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-400", children: [
              /* @__PURE__ */ jsx("span", { className: "line-through", children: t("landing.pricing.yearlySaveOriginal") }),
              " • ",
              t("landing.pricing.yearlyTrial")
            ] })
          ] }),
          /* @__PURE__ */ jsxs("ul", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-3", children: [
              /* @__PURE__ */ jsx(Check, { className: "h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" }),
              /* @__PURE__ */ jsx("span", { className: "text-white", children: t("landing.pricing.yearlyFeature1") })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-3", children: [
              /* @__PURE__ */ jsx(Check, { className: "h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" }),
              /* @__PURE__ */ jsx("span", { className: "text-white", children: t("landing.pricing.yearlyFeature2") })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-3", children: [
              /* @__PURE__ */ jsx(Check, { className: "h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" }),
              /* @__PURE__ */ jsx("span", { className: "text-white", children: t("landing.pricing.yearlyFeature3") })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-3", children: [
              /* @__PURE__ */ jsx(Check, { className: "h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" }),
              /* @__PURE__ */ jsx("span", { className: "text-white", children: t("landing.pricing.yearlyFeature4") })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-12 text-center", children: [
        /* @__PURE__ */ jsx("p", { className: "text-slate-400 mb-4", children: t("landing.pricing.notReady") }),
        /* @__PURE__ */ jsx(Link, { href: "/trades", children: /* @__PURE__ */ jsxs(Button, { variant: "ghost", className: "text-white hover:bg-white/5 rounded-full", children: [
          t("landing.pricing.browseDelayed"),
          /* @__PURE__ */ jsx(LineChart$1, { className: "ml-2 h-4 w-4" })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-16 flex flex-wrap justify-center items-center gap-12 text-sm text-slate-500", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Shield, { className: "h-5 w-5" }),
          /* @__PURE__ */ jsx("span", { className: "font-medium", children: t("landing.pricing.cancelAnytime") })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Lock, { className: "h-5 w-5" }),
          /* @__PURE__ */ jsx("span", { className: "font-medium", children: t("landing.pricing.securePayment") })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(CheckCircle2, { className: "h-5 w-5" }),
          /* @__PURE__ */ jsx("span", { className: "font-medium", children: t("landing.pricing.noHiddenFees") })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("footer", { className: "border-t border-white/5 relative z-10 bg-black/40 backdrop-blur-xl mt-32", children: /* @__PURE__ */ jsxs("div", { className: "container px-4 lg:px-6 py-16 max-w-7xl mx-auto", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-12 mb-12", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-xs font-semibold mb-4 text-white uppercase tracking-wider", children: t("landing.footer.product") }),
          /* @__PURE__ */ jsxs("ul", { className: "space-y-3 text-sm text-slate-400", children: [
            /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { href: "/premium-checkout", children: /* @__PURE__ */ jsx("a", { className: "hover:text-white transition-colors", children: t("landing.footer.pricing") }) }) }),
            /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { href: "/trades", children: /* @__PURE__ */ jsx("a", { className: "hover:text-white transition-colors", children: t("landing.footer.browseTrades") }) }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-xs font-semibold mb-4 text-white uppercase tracking-wider", children: t("landing.footer.company") }),
          /* @__PURE__ */ jsxs("ul", { className: "space-y-3 text-sm text-slate-400", children: [
            /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { href: "#", className: "hover:text-white transition-colors", children: t("landing.footer.about") }) }),
            /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { href: "#", className: "hover:text-white transition-colors", children: t("landing.footer.blog") }) }),
            /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { href: "#", className: "hover:text-white transition-colors", children: t("landing.footer.contact") }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-xs font-semibold mb-4 text-white uppercase tracking-wider", children: t("landing.footer.legal") }),
          /* @__PURE__ */ jsxs("ul", { className: "space-y-3 text-sm text-slate-400", children: [
            /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { href: "#", className: "hover:text-white transition-colors", children: t("landing.footer.privacy") }) }),
            /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { href: "#", className: "hover:text-white transition-colors", children: t("landing.footer.terms") }) }),
            /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { href: "/sitemap.xml", className: "hover:text-white transition-colors", children: t("landing.footer.sitemap") }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-xs font-semibold mb-4 text-white uppercase tracking-wider", children: t("landing.footer.connect") }),
          /* @__PURE__ */ jsxs("ul", { className: "space-y-3 text-sm text-slate-400", children: [
            /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { href: "#", className: "hover:text-white transition-colors", children: t("landing.footer.twitter") }) }),
            /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { href: "#", className: "hover:text-white transition-colors", children: t("landing.footer.linkedin") }) }),
            /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", { href: "#", className: "hover:text-white transition-colors", children: t("landing.footer.github") }) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500", children: /* @__PURE__ */ jsx(TrendingUp, { className: "h-4 w-4 text-white" }) }),
          /* @__PURE__ */ jsx("span", { className: "text-base font-semibold tracking-tight text-white", children: "InsiderPulse" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500", children: t("landing.footer.copyright") })
      ] })
    ] }) })
  ] });
}
function ProfilePage() {
  const { user } = useAuth();
  const [, navigate2] = useLocation();
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const handleManageSubscription = async () => {
    if (!(user == null ? void 0 : user.stripeCustomerId)) return;
    setIsLoadingPortal(true);
    try {
      const response = await fetch("/api/create-portal-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error creating portal session:", error);
    } finally {
      setIsLoadingPortal(false);
    }
  };
  const handleUpgradeToInsider = () => {
    navigate2("/premium-checkout");
  };
  if (!user) {
    return /* @__PURE__ */ jsx("div", { className: "container max-w-4xl mx-auto p-6", children: /* @__PURE__ */ jsx("p", { className: "text-center text-muted-foreground", children: "Loading..." }) });
  }
  const isPremium = hasPremiumAccess(user);
  const tierDisplayName = getSubscriptionDisplayName(user.subscriptionTier);
  const statusDisplayName = getStatusDisplayName(user.subscriptionStatus);
  let endDate = null;
  let endDateLabel = "";
  if (user.subscriptionStatus === "trialing") {
    endDate = user.subscriptionEndDate;
    endDateLabel = "무료체험 종료까지";
  } else if (user.subscriptionStatus === "active") {
    endDate = user.subscriptionEndDate;
    endDateLabel = user.subscriptionStatus === "canceled" ? "구독 종료까지" : "다음 결제까지";
  } else if (user.subscriptionStatus === "canceled" && user.subscriptionEndDate) {
    endDate = user.subscriptionEndDate;
    endDateLabel = "구독 종료까지";
  }
  const timeRemaining = formatTimeRemaining(endDate);
  const formattedEndDate = endDate ? new Date(endDate).toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }) : null;
  return /* @__PURE__ */ jsxs("div", { className: "container max-w-4xl mx-auto p-6 space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold tracking-tight", children: "프로필" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mt-2", children: "계정 정보 및 구독 상태를 관리하세요" })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(User, { className: "h-5 w-5" }),
          "계정 정보"
        ] }),
        /* @__PURE__ */ jsx(CardDescription, { children: "기본 계정 정보" })
      ] }),
      /* @__PURE__ */ jsx(CardContent, { className: "space-y-4", children: /* @__PURE__ */ jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-sm text-muted-foreground", children: "이메일" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: user.email })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx(Label, { className: "text-sm text-muted-foreground", children: "가입일" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: user.createdAt ? new Date(user.createdAt).toLocaleDateString("ko-KR") : "N/A" })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Crown, { className: "h-5 w-5" }),
          "구독 상태"
        ] }),
        /* @__PURE__ */ jsx(CardDescription, { children: "현재 플랜 및 구독 정보" })
      ] }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-4 rounded-lg border bg-card", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-sm text-muted-foreground", children: "현재 플랜" }),
            /* @__PURE__ */ jsxs("p", { className: "text-2xl font-bold flex items-center gap-2", children: [
              tierDisplayName,
              isPremium && /* @__PURE__ */ jsx(Crown, { className: "h-5 w-5 text-yellow-500" })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "text-right", children: /* @__PURE__ */ jsx("p", { className: `text-sm font-medium px-3 py-1 rounded-full ${user.subscriptionStatus === "active" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : user.subscriptionStatus === "trialing" ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" : user.subscriptionStatus === "canceled" ? "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"}`, children: statusDisplayName }) })
        ] }),
        /* @__PURE__ */ jsx(Separator, {}),
        /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsx(Label, { className: "text-sm font-medium", children: "무료체험 사용 여부" }),
            /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2", children: user.hasUsedTrial ? /* @__PURE__ */ jsxs(Fragment$1, { children: [
              /* @__PURE__ */ jsx(CheckCircle2, { className: "h-4 w-4 text-green-600 dark:text-green-400" }),
              /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground", children: "사용 완료" })
            ] }) : /* @__PURE__ */ jsxs(Fragment$1, { children: [
              /* @__PURE__ */ jsx(XCircle, { className: "h-4 w-4 text-slate-600 dark:text-slate-400" }),
              /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground", children: "미사용 (사용 가능)" })
            ] }) })
          ] }),
          endDate && /* @__PURE__ */ jsxs("div", { className: "space-y-2 p-4 rounded-lg bg-muted", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm font-medium", children: [
              /* @__PURE__ */ jsx(Clock, { className: "h-4 w-4" }),
              endDateLabel
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsx("div", { className: "text-3xl font-bold font-mono", children: timeRemaining }),
              /* @__PURE__ */ jsx("div", { className: "text-right text-xs text-muted-foreground", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
                /* @__PURE__ */ jsx(Calendar, { className: "h-3 w-3" }),
                formattedEndDate
              ] }) })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx(Separator, {}),
        /* @__PURE__ */ jsx("div", { className: "space-y-3", children: !isPremium ? /* @__PURE__ */ jsxs(Fragment$1, { children: [
          /* @__PURE__ */ jsxs(
            Button,
            {
              onClick: handleUpgradeToInsider,
              className: "w-full",
              size: "lg",
              children: [
                /* @__PURE__ */ jsx(Crown, { className: "w-4 h-4 mr-2" }),
                "Upgrade to Insider"
              ]
            }
          ),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-center text-muted-foreground", children: "실시간 insider 거래 데이터 및 고급 기능에 액세스하세요" })
        ] }) : /* @__PURE__ */ jsxs(Fragment$1, { children: [
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-2", children: [
            /* @__PURE__ */ jsx(
              Button,
              {
                onClick: handleManageSubscription,
                disabled: isLoadingPortal,
                className: "w-full",
                variant: "outline",
                children: isLoadingPortal ? /* @__PURE__ */ jsxs(Fragment$1, { children: [
                  /* @__PURE__ */ jsx("div", { className: "animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" }),
                  "Loading..."
                ] }) : /* @__PURE__ */ jsxs(Fragment$1, { children: [
                  /* @__PURE__ */ jsx(ExternalLink, { className: "w-4 h-4 mr-2" }),
                  "구독 관리"
                ] })
              }
            ),
            /* @__PURE__ */ jsx(RefreshAccountButton, { className: "w-full" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground text-center", children: '💡 구독 상태가 자동으로 업데이트되지 않으면 "계정 새로고침"을 클릭하세요' })
        ] }) }),
        isPremium && user.subscriptionStatus === "trialing" && /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-blue-50 dark:bg-blue-950 p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
          /* @__PURE__ */ jsx(AlertCircle, { className: "h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-blue-900 dark:text-blue-100", children: "무료체험 이용 중" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-blue-800 dark:text-blue-200", children: "무료체험 종료 시 자동으로 결제가 진행됩니다. 자동결제를 원하지 않으시면 카드사를 통해 자동결제를 취소하세요. 단, 무료체험 기간은 계속 유지되며 종료 시까지 서비스를 이용하실 수 있습니다." })
          ] })
        ] }) }),
        isPremium && user.subscriptionStatus === "canceled" && /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-orange-50 dark:bg-orange-950 p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
          /* @__PURE__ */ jsx(AlertCircle, { className: "h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-orange-900 dark:text-orange-100", children: "구독이 취소되었습니다" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-orange-800 dark:text-orange-200", children: '구독 종료일까지 Insider 기능을 계속 이용하실 수 있습니다. 종료 후 다시 구독하시려면 "Upgrade to Insider" 버튼을 클릭하세요.' })
          ] })
        ] }) })
      ] })
    ] }),
    isPremium && user.stripeCustomerId && /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(CreditCard, { className: "h-5 w-5" }),
          "결제 정보"
        ] }),
        /* @__PURE__ */ jsx(CardDescription, { children: "Stripe를 통한 안전한 결제 관리" })
      ] }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-3", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "결제 수단 변경, 영수증 확인, 구독 취소 등은 Stripe 고객 포털에서 관리하실 수 있습니다." }),
        /* @__PURE__ */ jsx(
          Button,
          {
            onClick: handleManageSubscription,
            disabled: isLoadingPortal,
            variant: "outline",
            className: "w-full",
            children: isLoadingPortal ? /* @__PURE__ */ jsxs(Fragment$1, { children: [
              /* @__PURE__ */ jsx("div", { className: "animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" }),
              "Loading..."
            ] }) : /* @__PURE__ */ jsxs(Fragment$1, { children: [
              /* @__PURE__ */ jsx(ExternalLink, { className: "w-4 h-4 mr-2" }),
              "Stripe 고객 포털 열기"
            ] })
          }
        )
      ] })
    ] })
  ] });
}
function PublicRouter() {
  return /* @__PURE__ */ jsxs(Switch$1, { children: [
    /* @__PURE__ */ jsx(Route, { path: "/", component: LandingPage }),
    /* @__PURE__ */ jsx(Route, { path: "/signup", component: SignupPage }),
    /* @__PURE__ */ jsx(Route, { path: "/login", component: LoginPage }),
    /* @__PURE__ */ jsx(Route, { path: "/forgot-password", component: ForgotPasswordPage }),
    /* @__PURE__ */ jsx(Route, { path: "/reset-password", component: ResetPasswordPage }),
    /* @__PURE__ */ jsx(Route, { path: "/verify-email", component: VerifyEmail }),
    /* @__PURE__ */ jsx(Route, { path: "/verify-code", component: VerifyCode }),
    /* @__PURE__ */ jsx(Route, { path: "/start-trial", component: StartTrialPage }),
    /* @__PURE__ */ jsx(Route, { path: "/premium-checkout", component: PremiumCheckout }),
    /* @__PURE__ */ jsx(Route, { component: NotFound })
  ] });
}
function AppRouter() {
  useLanguage();
  return /* @__PURE__ */ jsxs(Switch$1, { children: [
    /* @__PURE__ */ jsx(Route, { path: "/trade/:tradeId", component: TradeDetail }),
    /* @__PURE__ */ jsx(Route, { path: "/trades", component: LiveTrading }),
    /* @__PURE__ */ jsx(Route, { path: "/dashboard", component: Dashboard }),
    /* @__PURE__ */ jsx(Route, { path: "/analytics", component: Analytics }),
    /* @__PURE__ */ jsx(Route, { path: "/search", component: SearchPage }),
    /* @__PURE__ */ jsx(Route, { path: "/ranking", component: Ranking }),
    /* @__PURE__ */ jsx(Route, { path: "/password-demo", component: PasswordDemo }),
    /* @__PURE__ */ jsx(Route, { path: "/enhanced-dashboard", component: EnhancedInsiderTradingDashboard }),
    /* @__PURE__ */ jsx(Route, { path: "/payment-success", component: PaymentSuccess }),
    /* @__PURE__ */ jsx(Route, { path: "/profile", component: ProfilePage }),
    /* @__PURE__ */ jsx(Route, { path: "/settings", component: Settings }),
    /* @__PURE__ */ jsx(Route, { path: "/admin", component: AdminDashboard }),
    /* @__PURE__ */ jsx(Route, { component: NotFound })
  ] });
}
function AppContent() {
  const { t, language } = useLanguage();
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState(false);
  const [location2] = useLocation();
  useEffect(() => {
    const languageSelected = localStorage.getItem("language-selected");
    const savedLanguage = localStorage.getItem("language");
    if (languageSelected === "true" || savedLanguage) {
      setHasSelectedLanguage(true);
    }
  }, []);
  const publicPaths = ["/", "/signup", "/login", "/forgot-password", "/reset-password", "/verify-code", "/verify-email", "/start-trial", "/premium-checkout"];
  const isPublicRoute = publicPaths.includes(location2);
  if (!hasSelectedLanguage && !isPublicRoute) {
    return /* @__PURE__ */ jsx(LanguageSelection, { onLanguageSelected: () => setHasSelectedLanguage(true) });
  }
  if (isPublicRoute) {
    return /* @__PURE__ */ jsx(PublicRouter, {});
  }
  const style = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "4rem"
  };
  return /* @__PURE__ */ jsx(SidebarProvider, { style, children: /* @__PURE__ */ jsxs("div", { className: "flex h-screen w-full overflow-hidden", children: [
    /* @__PURE__ */ jsx(AppSidebar, {}),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col flex-1 min-w-0 overflow-hidden", children: [
      /* @__PURE__ */ jsxs("header", { className: "flex items-center justify-between p-2 sm:p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [
          /* @__PURE__ */ jsx(SidebarTrigger, { "data-testid": "button-sidebar-toggle", className: "flex-shrink-0" }),
          /* @__PURE__ */ jsxs("div", { className: "text-xs sm:text-sm text-muted-foreground truncate hidden sm:block", children: [
            t("dashboard.lastUpdated"),
            ": ",
            (/* @__PURE__ */ new Date()).toLocaleTimeString()
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 sm:gap-2 flex-shrink-0", children: [
          /* @__PURE__ */ jsx(LanguageSelector, {}),
          /* @__PURE__ */ jsx(ThemeToggle, {})
        ] })
      ] }),
      /* @__PURE__ */ jsx("main", { className: "flex-1 overflow-x-hidden overflow-y-auto w-full", children: /* @__PURE__ */ jsx(AppRouter, {}) })
    ] })
  ] }) });
}
function App() {
  useEffect(() => {
    const keepAlive = async () => {
      try {
        await fetch("/api/health");
      } catch (error) {
      }
    };
    const interval = setInterval(keepAlive, 5 * 60 * 1e3);
    keepAlive();
    return () => clearInterval(interval);
  }, []);
  return /* @__PURE__ */ jsx(QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ jsx(AuthProvider, { children: /* @__PURE__ */ jsx(LanguageProvider, { children: /* @__PURE__ */ jsx(AccessProvider, { children: /* @__PURE__ */ jsxs(TooltipProvider, { children: [
    /* @__PURE__ */ jsx(AppContent, {}),
    /* @__PURE__ */ jsx(AuthModal, {}),
    /* @__PURE__ */ jsx(PWAInstallPrompt, {}),
    /* @__PURE__ */ jsx(Toaster, {})
  ] }) }) }) }) });
}
function useStaticLocation() {
  return ["/", () => {
  }];
}
function render(url) {
  const html = renderToString(
    /* @__PURE__ */ jsx(Router, { hook: useStaticLocation, children: /* @__PURE__ */ jsx(App, {}) })
  );
  return { html };
}
export {
  render
};
