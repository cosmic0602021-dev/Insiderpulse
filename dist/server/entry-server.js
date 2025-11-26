import { jsx, jsxs, Fragment as Fragment$1 } from "react/jsx-runtime";
import { renderToString } from "react-dom/server";
import { parse } from "regexparam";
import * as React from "react";
import { createContext, forwardRef, isValidElement, cloneElement, createElement, useContext, useRef, Fragment, useState, useEffect, useId, useMemo, memo, useCallback } from "react";
import { useSyncExternalStore } from "use-sync-external-store/shim/index.js";
import { notifyManager, isServer, QueryObserver, QueryClient } from "@tanstack/query-core";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva } from "class-variance-authority";
import { X, Bell, Zap, Smartphone, ShieldCheck, Share2, Plus, Download, Check, DollarSign, ChevronDown, ChevronUp, Newspaper, CheckCircle, ExternalLink, Brain, Target, AlertTriangle, TrendingUp, TrendingDown, BarChart3, Clock, Search, Lock, ArrowUpRight, ArrowDownLeft, CreditCard, Loader2, Mail, AlertCircle, ArrowLeft, Database, Activity, Scan, Crosshair, Globe, Fingerprint, ArrowRight, CheckCircle2, XCircle, Sparkles, Shield, Terminal, FileText, Hash, Building2, LayoutDashboard, User, Settings, Power, LogIn, Crown, Ticket, Monitor, BellOff, ScanLine, EyeOff, Eye, Users, Menu } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { Slot } from "@radix-ui/react-slot";
import * as SelectPrimitive from "@radix-ui/react-select";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as LabelPrimitive from "@radix-ui/react-label";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, ReferenceLine, Area, Line, ReferenceDot, LineChart, BarChart, Bar, Cell } from "recharts";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { formatDistanceToNow } from "date-fns";
import { ko, ja, zhCN, enUS } from "date-fns/locale";
import "html2canvas";
import { useStripe, useElements, CardElement, Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
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
forwardRef((props, ref) => {
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
      refetchOnWindowFocus: true,
      // Refetch when window regains focus
      refetchOnMount: "always",
      // Always refetch on component mount
      staleTime: 5 * 60 * 1e3,
      // Data becomes stale after 5 minutes
      gcTime: 10 * 60 * 1e3,
      // Garbage collect after 10 minutes
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
    "lockedTrade.startTrial": "Start Free Trial",
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
    "trial.heading": "InsiderPulse Pro Free Trial",
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
    "trial.form.description": "Subscription starts automatically after free trial",
    "trial.form.selectPlan": "Select Subscription Plan",
    "trial.form.monthly": "Monthly",
    "trial.form.yearly": "Annual",
    "trial.form.perMonth": "Billed monthly",
    "trial.form.perYear": "Billed annually",
    "trial.form.discount": "(33% off)",
    "trial.form.info1": "* No charges during the free trial period.",
    "trial.form.info2": "* Automatically converts to selected plan when trial ends.",
    "trial.form.info3": "* Cancel anytime; Pro features will be disabled immediately upon cancellation.",
    "trial.success.title": "Trial Started!",
    "trial.success.message": "Free trial activated. Start using real-time trade tracking now!",
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
    // Filters
    "filter.all": "All",
    "filter.buy": "Buy Only",
    "filter.sell": "Sell Only",
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
    "ranking.avgBuyPrice": "Avg Buy Price",
    "ranking.avgTradeValue": "Avg Buy Price",
    // Legacy support
    "ranking.currentPrice": "Current Price",
    "ranking.simultaneousBuyers": "Simultaneous Buyers",
    "ranking.netBuying": "Net Buying",
    "ranking.totalBuyAmount": "Total Buy Amount",
    "ranking.loading": "Loading stock rankings...",
    "ranking.noData": "No ranking data available",
    "ranking.refreshData": "Refresh Data",
    "ranking.lockedTitle": "Premium Feature",
    "ranking.lockedDescription": "Upgrade to Insider Pro to see our top stock recommendations based on insider trading patterns",
    "ranking.unlockButton": "Unlock Top Rankings",
    "ranking.recommendationReason": "Recommendation Reason:",
    "ranking.recommendationReasonNetBuying": "Recommendation Reason: Net Buying",
    "ranking.recommendationSimple": "{count} insiders buying",
    "ranking.recommendationSimpleSingle": "Large purchase {amount}",
    "ranking.buySell": "Buy / Sell",
    "ranking.recentTrade": "Recent Trade:",
    "ranking.buyPrice": "Buy Price",
    "ranking.shareCount": "Share Count",
    "ranking.totalAmount": "Total Amount",
    "ranking.tradeDate": "Trade Date:",
    "ranking.lastUpdated": "Last Updated",
    "ranking.alert.noTradeData": "No recent trade information available for {company}.",
    "ranking.alert.loadFailed": "Failed to load trade data.",
    // Ranking AI Analysis
    "ranking.aiAnalysis.executiveSummary": "{name} ({title}) bought {shares} shares of {company} at ${price}. This is interpreted as a positive signal.",
    "ranking.aiAnalysis.riskMitigation": "Insider buying is generally a positive signal, but diversified investment is recommended.",
    "ranking.aiAnalysis.recommendation": "The purchase by {title} is likely based on internal company information. Consider entry near ${price}.",
    "ranking.aiAnalysis.insiderBuyByTitle": "Insider buy by {title}",
    "ranking.aiAnalysis.totalTradeValue": "Total trade value: ${value}K",
    "ranking.aiAnalysis.simultaneousBuyersCount": "{count} simultaneous buyers",
    "ranking.aiAnalysis.executiveBuyActivity": "Direct executive buying activity",
    "ranking.aiAnalysis.insiderConfidence": "Increased insider confidence",
    "ranking.aiAnalysis.simultaneousEntry": "{count} simultaneous entries",
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
    "tradeDetail.tradeDate": "Trade Date",
    "tradeDetail.priceUpdatedAt": "Price Updated At",
    // Price Chart Errors
    "priceChart.error.invalidTicker": "Invalid Ticker Symbol",
    "priceChart.error.invalidTickerDesc": "Please check the ticker format",
    "priceChart.error.invalidDate": "Invalid Trade Date",
    "priceChart.error.invalidDateDesc": "Unable to load price data for this date",
    "priceChart.error.noDataTitle": "Unable to collect real-time stock price data",
    "priceChart.error.noDataDescDelisted": "This stock may be delisted or not traded on major exchanges",
    "priceChart.error.noDataDescPending": "Stock price data has not been collected yet",
    "priceChart.error.fallbackTitle": "Providing analysis based on insider trade price",
    "priceChart.error.fallbackDesc": "You can check insider trade prices and related information below",
    "priceChart.error.apiFailed": "Failed to load price data",
    "priceChart.error.apiFailedDesc": "This is a temporary error. Please try again later",
    "priceChart.error.tradeInfoAvailable": "Insider trade information is available below",
    // Dashboard
    "dashboard.loadMoreTradesError": "Failed to load more trades. Please try again.",
    // Landing Page
    "landing.browse": "Browse",
    "landing.tagline": "AI-Powered SEC Filing Analysis",
    "landing.title": "InsiderPulse: Track Insider Trading in Real-Time",
    "landing.description": "Get instant alerts and AI-powered insights from SEC Form 4 filings. Make informed investment decisions based on what corporate insiders are doing.",
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
    "tradeList.showingTrades": "Showing {count} trades",
    // Premium Checkout
    "checkout.title": "Upgrade to Insider",
    "checkout.subtitle": "Get {days} days free trial + real-time insider trading alerts",
    "checkout.monthly": "Monthly",
    "checkout.yearly": "Yearly",
    "checkout.yearlyDiscount": "-33%",
    "checkout.planName": "Insider",
    "checkout.planDescription": "Real-time insider trading data & AI analysis",
    "checkout.priceMonth": "/month",
    "checkout.priceYear": "/year",
    "checkout.billingMonthly": "월간 자동결제",
    "checkout.billingYearly": "연간 자동결제",
    "checkout.feature1": "Real-time insider trade alerts (no 48h delay)",
    "checkout.feature2": "Pure buy/sell signals only (no grants, options, awards)",
    "checkout.feature3": "AI-powered trade analysis & predictions",
    "checkout.feature4": "Advanced pattern detection & signals",
    "checkout.feature5": "Executive trade tracking (CEO, CFO, etc.)",
    "checkout.feature6": "Live data updates & push notifications",
    "checkout.feature7": "Historical insider performance analytics",
    "checkout.feature8": "Exclusive market intelligence reports",
    "checkout.trialTitle": "{days}일 무료체험",
    "checkout.trialDescription": "오늘부터 {days}일간 무료로 모든 Insider 기능을 사용해보세요. 무료체험 기간이 끝나면 자동으로 ${price}/{interval} 결제가 시작됩니다. 언제든지 해지 가능합니다.",
    "checkout.secureTitle": "Secure Payment & Auto-Renewal",
    "checkout.secureDescription": "All transactions are encrypted and processed securely through Stripe. Your subscription will automatically renew every {interval} until you cancel. Cancel anytime with one click - you'll keep access until the end of your billing period.",
    "checkout.realDataTitle": "Real SEC Data",
    "checkout.realDataDescription": "All data sourced directly from SEC filings. No fake data - only real, actionable intelligence.",
    "checkout.startTrial": "Start Free Trial",
    "checkout.subscribeNow": "Subscribe Now",
    "checkout.startTrialButton": "Start {days} days Free Trial",
    "checkout.subscribeButton": "Subscribe Now - ${price}/{interval}",
    "checkout.trialSubtext": "You won't be charged for {days} days. Cancel anytime during the trial.",
    "checkout.cardDescriptionTrial": "{days} days free trial then ${price}{interval}",
    "checkout.cardDescriptionNoTrial": "Start billing ${price}{interval} immediately",
    "checkout.planLabel": "Plan:",
    "checkout.freeTrialLabel": "Free Trial:",
    "checkout.afterTrialLabel": "After Trial:",
    "checkout.priceLabel": "Price:",
    "checkout.billingCycleLabel": "Billing Cycle:",
    "checkout.priceWithTax": "${price}/{interval} (세금별도)",
    "checkout.termsAgreement": "Charges begin automatically after the free trial. If you do not wish to continue, please cancel your subscription before auto-billing occurs. I understand that refunds are not available after automatic billing."
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
    "lockedTrade.startTrial": "무료 체험 시작",
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
    "trial.heading": "InsiderPulse Pro 무료 체험",
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
    "trial.form.description": "무료 체험 후 자동으로 구독이 시작됩니다",
    "trial.form.selectPlan": "구독 플랜 선택",
    "trial.form.monthly": "월간 구독",
    "trial.form.yearly": "연간 구독",
    "trial.form.perMonth": "매월 청구",
    "trial.form.perYear": "연간 청구",
    "trial.form.discount": "(33% 할인)",
    "trial.form.info1": "* 무료 체험 기간 동안 카드에서 청구되지 않습니다.",
    "trial.form.info2": "* 체험 기간 종료 시 선택하신 플랜으로 자동 전환됩니다.",
    "trial.form.info3": "* 언제든지 구독을 취소할 수 있으며, 취소 시 즉시 Pro 기능 사용이 중지됩니다.",
    "trial.success.title": "체험 시작!",
    "trial.success.message": "무료 체험이 활성화되었습니다. 실시간 거래 추적을 바로 이용하세요!",
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
    "trial.form.afterTrialMonthly": "체험 종료 후 자동 결제: 월 $14",
    "trial.form.afterTrialYearly": "체험 종료 후 자동 결제: 연 $112",
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
    // Filters
    "filter.all": "전체",
    "filter.buy": "매수만",
    "filter.sell": "매도만",
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
    "ranking.avgBuyPrice": "평균 매수가",
    "ranking.avgTradeValue": "평균 매수가",
    // Legacy support
    "ranking.currentPrice": "현재가",
    "ranking.simultaneousBuyers": "동시 매수자",
    "ranking.netBuying": "순매수",
    "ranking.totalBuyAmount": "총 매수 금액",
    "ranking.loading": "주식 순위를 불러오는 중...",
    "ranking.noData": "순위 데이터가 없습니다",
    "ranking.refreshData": "데이터 새로고침",
    "ranking.lockedTitle": "프리미엄 기능",
    "ranking.lockedDescription": "Insider Pro로 업그레이드하여 내부자 거래 패턴 기반 최고의 주식 추천을 확인하세요",
    "ranking.unlockButton": "상위 순위 잠금 해제",
    "ranking.recommendationReason": "추천 이유:",
    "ranking.recommendationReasonNetBuying": "추천 이유: 순매수",
    "ranking.recommendationSimple": "{count}명 내부자 매수",
    "ranking.recommendationSimpleSingle": "대량 매수 {amount}",
    "ranking.buySell": "매수 / 매도",
    "ranking.recentTrade": "최근 거래:",
    "ranking.buyPrice": "매수 가격",
    "ranking.shareCount": "주식 수",
    "ranking.totalAmount": "총액",
    "ranking.tradeDate": "거래일:",
    "ranking.lastUpdated": "마지막 업데이트",
    "ranking.alert.noTradeData": "{company}에 대한 최근 거래 정보가 없습니다.",
    "ranking.alert.loadFailed": "거래 데이터를 불러오는데 실패했습니다.",
    // Ranking AI Analysis
    "ranking.aiAnalysis.executiveSummary": "{name} ({title})이(가) {company}의 주식 {shares}주를 ${price}에 매수했습니다. 이는 긍정적인 신호로 해석됩니다.",
    "ranking.aiAnalysis.riskMitigation": "내부자 매수는 일반적으로 긍정적 신호이나, 분산 투자를 권장합니다.",
    "ranking.aiAnalysis.recommendation": "{title}의 매수는 회사 내부 정보에 기반한 결정일 가능성이 높습니다. ${price} 근처에서 진입을 고려하세요.",
    "ranking.aiAnalysis.insiderBuyByTitle": "{title} 직책의 내부자 매수",
    "ranking.aiAnalysis.totalTradeValue": "총 거래액: ${value}K",
    "ranking.aiAnalysis.simultaneousBuyersCount": "동시 매수자 {count}명",
    "ranking.aiAnalysis.executiveBuyActivity": "임원진의 직접 매수 활동",
    "ranking.aiAnalysis.insiderConfidence": "내부자 신뢰도 증가",
    "ranking.aiAnalysis.simultaneousEntry": "{count}명의 동시 진입",
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
    "tradeDetail.tradeDate": "거래일",
    "tradeDetail.priceUpdatedAt": "가격 업데이트 시간",
    // Price Chart Errors
    "priceChart.error.invalidTicker": "유효하지 않은 티커 심볼",
    "priceChart.error.invalidTickerDesc": "티커 형식을 확인해주세요",
    "priceChart.error.invalidDate": "유효하지 않은 거래 날짜",
    "priceChart.error.invalidDateDesc": "이 날짜의 가격 데이터를 불러올 수 없습니다",
    "priceChart.error.noDataTitle": "실시간 주가 데이터를 수집하지 못했습니다",
    "priceChart.error.noDataDescDelisted": "이 종목은 상장폐지되었거나 주요 거래소에서 거래되지 않을 수 있습니다",
    "priceChart.error.noDataDescPending": "주가 데이터를 아직 수집하지 못했습니다",
    "priceChart.error.fallbackTitle": "내부자 거래 가격 기준으로 분석을 제공합니다",
    "priceChart.error.fallbackDesc": "아래에서 내부자의 거래 가격과 관련 정보를 확인하실 수 있습니다",
    "priceChart.error.apiFailed": "가격 데이터를 불러오지 못했습니다",
    "priceChart.error.apiFailedDesc": "일시적인 오류입니다. 잠시 후 다시 시도해주세요",
    "priceChart.error.tradeInfoAvailable": "내부자 거래 정보는 아래에서 확인하실 수 있습니다",
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
    "tradeList.showingTrades": "{count}개 거래 표시 중",
    // Premium Checkout
    "checkout.title": "Insider로 업그레이드",
    "checkout.subtitle": "{days}일 무료체험 + 실시간 insider 거래 알림",
    "checkout.monthly": "월간",
    "checkout.yearly": "연간",
    "checkout.yearlyDiscount": "-33%",
    "checkout.planName": "Insider",
    "checkout.planDescription": "실시간 내부자 거래 데이터 & AI 분석",
    "checkout.priceMonth": "/월",
    "checkout.priceYear": "/년",
    "checkout.billingMonthly": "월간 자동결제",
    "checkout.billingYearly": "연간 자동결제",
    "checkout.feature1": "실시간 내부자 거래 알림 (48시간 지연 없음)",
    "checkout.feature2": "순수 매수/매도 신호만 표시 (보조금, 옵션, 보상 제외)",
    "checkout.feature3": "AI 기반 거래 분석 & 예측",
    "checkout.feature4": "고급 패턴 감지 & 신호",
    "checkout.feature5": "임원 거래 추적 (CEO, CFO 등)",
    "checkout.feature6": "실시간 데이터 업데이트 & 푸시 알림",
    "checkout.feature7": "내부자 거래 성과 분석",
    "checkout.feature8": "독점 시장 인텔리전스 리포트",
    "checkout.trialTitle": "{days}일 무료체험",
    "checkout.trialDescription": "오늘부터 {days}일간 무료로 모든 Insider 기능을 사용해보세요. 무료체험 기간이 끝나면 자동으로 ${price}/{interval} 결제가 시작됩니다. 언제든지 해지 가능합니다.",
    "checkout.secureTitle": "안전한 결제 & 자동 갱신",
    "checkout.secureDescription": "모든 거래는 Stripe를 통해 암호화되고 안전하게 처리됩니다. 구독은 취소하실 때까지 매 {interval}마다 자동으로 갱신됩니다. 언제든지 한 번의 클릭으로 취소 가능하며, 결제 기간이 끝날 때까지 계속 이용하실 수 있습니다.",
    "checkout.realDataTitle": "실제 SEC 데이터",
    "checkout.realDataDescription": "SEC 서류에서 직접 가져온 데이터입니다. 가짜 데이터 없음 - 오직 실제 정보만 제공합니다.",
    "checkout.startTrial": "무료 체험 시작",
    "checkout.subscribeNow": "지금 구독하기",
    "checkout.startTrialButton": "{days}일 무료 체험 시작",
    "checkout.subscribeButton": "지금 구독하기 - ${price}/{interval}",
    "checkout.trialSubtext": "{days}일 동안 요금이 청구되지 않습니다. 무료체험 중 언제든지 취소 가능합니다.",
    "checkout.cardDescriptionTrial": "{days}일 무료체험 후 ${price}{interval}",
    "checkout.cardDescriptionNoTrial": "즉시 ${price}{interval} 결제 시작",
    "checkout.planLabel": "플랜:",
    "checkout.freeTrialLabel": "무료체험:",
    "checkout.afterTrialLabel": "체험 후 가격:",
    "checkout.priceLabel": "가격:",
    "checkout.billingCycleLabel": "결제 주기:",
    "checkout.priceWithTax": "${price}/{interval} (세금별도)",
    "checkout.termsAgreement": "무료체험 종료 후 자동으로 결제가 진행됩니다. 원치 않으시는 경우 자동결제 전에 구독 해지를 해주세요. 자동결제 이후에는 환불이 불가함을 이해했습니다."
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
    "lockedTrade.startTrial": "無料トライアル開始",
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
    "trial.heading": "InsiderPulse Pro 無料トライアル",
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
    "trial.form.description": "無料トライアル後、自動的にサブスクリプションが開始されます",
    "trial.form.selectPlan": "サブスクリプションプランを選択",
    "trial.form.monthly": "月額プラン",
    "trial.form.yearly": "年間プラン",
    "trial.form.perMonth": "毎月請求",
    "trial.form.perYear": "年間請求",
    "trial.form.discount": "(33%オフ)",
    "trial.form.info1": "* 無料トライアル期間中はカードに請求されません。",
    "trial.form.info2": "* トライアル期間終了時に選択したプランに自動的に切り替わります。",
    "trial.form.info3": "* いつでもサブスクリプションをキャンセルでき、キャンセル時は即座にPro機能の使用が停止されます。",
    "trial.success.title": "トライアル開始！",
    "trial.success.message": "無料トライアルが有効になりました。今すぐリアルタイム取引追跡をご利用ください！",
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
    // Filters
    "filter.all": "すべて",
    "filter.buy": "買いのみ",
    "filter.sell": "売りのみ",
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
    "tradeDetail.tradeDate": "取引日",
    "tradeDetail.priceUpdatedAt": "価格更新時刻",
    // Price Chart Errors
    "priceChart.error.invalidTicker": "無効なティッカーシンボル",
    "priceChart.error.invalidTickerDesc": "ティッカー形式を確認してください",
    "priceChart.error.invalidDate": "無効な取引日",
    "priceChart.error.invalidDateDesc": "この日付の価格データを読み込めません",
    "priceChart.error.noDataTitle": "リアルタイム株価データを収集できませんでした",
    "priceChart.error.noDataDescDelisted": "この銘柄は上場廃止されたか、主要取引所で取引されていない可能性があります",
    "priceChart.error.noDataDescPending": "株価データはまだ収集されていません",
    "priceChart.error.fallbackTitle": "インサイダー取引価格に基づいて分析を提供します",
    "priceChart.error.fallbackDesc": "以下でインサイダーの取引価格と関連情報を確認できます",
    "priceChart.error.apiFailed": "価格データの読み込みに失敗しました",
    "priceChart.error.apiFailedDesc": "一時的なエラーです。しばらくしてからもう一度お試しください",
    "priceChart.error.tradeInfoAvailable": "インサイダー取引情報は以下で確認できます",
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
    "ranking.avgBuyPrice": "平均購入価格",
    "ranking.avgTradeValue": "平均購入価格",
    // Legacy support
    "ranking.currentPrice": "現在価格",
    "ranking.simultaneousBuyers": "同時購入者",
    "ranking.netBuying": "ネット買い",
    "ranking.totalBuyAmount": "総購入金額",
    "ranking.loading": "株式ランキングを読み込み中...",
    "ranking.noData": "ランキングデータがありません",
    "ranking.refreshData": "データを更新",
    "ranking.lockedTitle": "プレミアム機能",
    "ranking.lockedDescription": "Insider Proにアップグレードして、インサイダー取引パターンに基づくトップの株式推奨をご覧ください",
    "ranking.unlockButton": "トップランキングのロック解除",
    "ranking.recommendationReason": "推奨理由:",
    "ranking.recommendationReasonNetBuying": "推奨理由: 純買い",
    "ranking.recommendationSimple": "{count}人のインサイダーが購入",
    "ranking.recommendationSimpleSingle": "大量購入 {amount}",
    "ranking.buySell": "買い / 売り",
    "ranking.recentTrade": "最近の取引:",
    "ranking.buyPrice": "購入価格",
    "ranking.shareCount": "株式数",
    "ranking.totalAmount": "総額",
    "ranking.tradeDate": "取引日:",
    "ranking.lastUpdated": "最終更新",
    "ranking.alert.noTradeData": "{company}の最新の取引情報がありません。",
    "ranking.alert.loadFailed": "取引データの読み込みに失敗しました。",
    // Ranking AI Analysis
    "ranking.aiAnalysis.executiveSummary": "{name} ({title})が{company}の株式{shares}株を${price}で購入しました。これは肯定的な信号と解釈されます。",
    "ranking.aiAnalysis.riskMitigation": "インサイダー購入は一般的に肯定的な信号ですが、分散投資をお勧めします。",
    "ranking.aiAnalysis.recommendation": "{title}の購入は社内情報に基づいた決定である可能性が高いです。${price}付近でのエントリーを検討してください。",
    "ranking.aiAnalysis.insiderBuyByTitle": "{title}役職のインサイダー購入",
    "ranking.aiAnalysis.totalTradeValue": "総取引額: ${value}K",
    "ranking.aiAnalysis.simultaneousBuyersCount": "同時購入者 {count}人",
    "ranking.aiAnalysis.executiveBuyActivity": "経営陣の直接購入活動",
    "ranking.aiAnalysis.insiderConfidence": "インサイダー信頼度の向上",
    "ranking.aiAnalysis.simultaneousEntry": "{count}人の同時参入",
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
    "tradeList.showingTrades": "{count}件の取引を表示中",
    // Premium Checkout
    "checkout.title": "Insiderにアップグレード",
    "checkout.subtitle": "{days}日間無料トライアル + リアルタイムインサイダー取引アラート",
    "checkout.monthly": "月次",
    "checkout.yearly": "年次",
    "checkout.yearlyDiscount": "-33%",
    "checkout.planName": "Insider",
    "checkout.planDescription": "リアルタイムインサイダー取引データ & AI分析",
    "checkout.priceMonth": "/月",
    "checkout.priceYear": "/年",
    "checkout.billingMonthly": "月次自動更新",
    "checkout.billingYearly": "年次自動更新",
    "checkout.feature1": "リアルタイムインサイダー取引アラート（48時間遅延なし）",
    "checkout.feature2": "純粋な買い/売りシグナルのみ（助成金、オプション、報酬を除く）",
    "checkout.feature3": "AI駆動の取引分析と予測",
    "checkout.feature4": "高度なパターン検出とシグナル",
    "checkout.feature5": "役員取引追跡（CEO、CFOなど）",
    "checkout.feature6": "ライブデータ更新とプッシュ通知",
    "checkout.feature7": "過去のインサイダーパフォーマンス分析",
    "checkout.feature8": "独占的な市場インテリジェンスレポート",
    "checkout.trialTitle": "{days}日間無料トライアル",
    "checkout.trialDescription": "本日から{days}日間、すべてのInsider機能を無料でお試しいただけます。無料トライアル期間が終了すると、自動的に${price}/{interval}の請求が開始されます。いつでもキャンセルできます。",
    "checkout.secureTitle": "安全な決済と自動更新",
    "checkout.secureDescription": "すべての取引は暗号化され、Stripeを通じて安全に処理されます。サブスクリプションはキャンセルするまで{interval}ごとに自動的に更新されます。いつでもワンクリックでキャンセルでき、請求期間の終了までアクセスを維持できます。",
    "checkout.realDataTitle": "本物のSECデータ",
    "checkout.realDataDescription": "すべてのデータはSECファイリングから直接取得されています。偽のデータはありません - 実際の実用的な情報のみです。",
    "checkout.startTrial": "無料トライアルを開始",
    "checkout.subscribeNow": "今すぐ購読",
    "checkout.startTrialButton": "{days}日間無料トライアルを開始",
    "checkout.subscribeButton": "今すぐ購読 - ${price}/{interval}",
    "checkout.trialSubtext": "{days}日間は課金されません。トライアル期間中いつでもキャンセルできます。",
    "checkout.cardDescriptionTrial": "{days}日間無料トライアル後 ${price}{interval}",
    "checkout.cardDescriptionNoTrial": "即座に${price}{interval}請求開始",
    "checkout.planLabel": "プラン:",
    "checkout.freeTrialLabel": "無料トライアル:",
    "checkout.afterTrialLabel": "トライアル後の価格:",
    "checkout.priceLabel": "価格:",
    "checkout.billingCycleLabel": "請求サイクル:",
    "checkout.priceWithTax": "${price}/{interval} (税別)",
    "checkout.termsAgreement": "無料トライアル終了後、自動的に課金されます。継続を希望されない場合は、自動課金前にサブスクリプションをキャンセルしてください。自動課金後の返金は不可であることを理解しました。"
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
    "lockedTrade.startTrial": "开始免费试用",
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
    "trial.heading": "InsiderPulse Pro 免费试用",
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
    "trial.form.description": "免费试用后自动开始订阅",
    "trial.form.selectPlan": "选择订阅计划",
    "trial.form.monthly": "月度订阅",
    "trial.form.yearly": "年度订阅",
    "trial.form.perMonth": "每月计费",
    "trial.form.perYear": "每年计费",
    "trial.form.discount": "(33%折扣)",
    "trial.form.info1": "* 免费试用期间不会从卡中扣费。",
    "trial.form.info2": "* 试用期结束时自动转换为所选计划。",
    "trial.form.info3": "* 随时可以取消订阅，取消后Pro功能立即停用。",
    "trial.success.title": "试用开始！",
    "trial.success.message": "免费试用已激活。立即开始使用实时交易追踪！",
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
    // Filters
    "filter.all": "全部",
    "filter.buy": "仅买入",
    "filter.sell": "仅卖出",
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
    "tradeDetail.tradeDate": "交易日期",
    "tradeDetail.priceUpdatedAt": "价格更新时间",
    // Price Chart Errors
    "priceChart.error.invalidTicker": "无效的股票代码",
    "priceChart.error.invalidTickerDesc": "请检查股票代码格式",
    "priceChart.error.invalidDate": "无效的交易日期",
    "priceChart.error.invalidDateDesc": "无法加载此日期的价格数据",
    "priceChart.error.noDataTitle": "无法收集实时股价数据",
    "priceChart.error.noDataDescDelisted": "此股票可能已退市或未在主要交易所交易",
    "priceChart.error.noDataDescPending": "股价数据尚未收集",
    "priceChart.error.fallbackTitle": "基于内部人交易价格提供分析",
    "priceChart.error.fallbackDesc": "您可以在下方查看内部人的交易价格和相关信息",
    "priceChart.error.apiFailed": "加载价格数据失败",
    "priceChart.error.apiFailedDesc": "这是暂时性错误。请稍后再试",
    "priceChart.error.tradeInfoAvailable": "内部人交易信息可在下方查看",
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
    "ranking.avgBuyPrice": "平均购买价格",
    "ranking.avgTradeValue": "平均购买价格",
    // Legacy support
    "ranking.currentPrice": "当前价格",
    "ranking.simultaneousBuyers": "同时购买者",
    "ranking.netBuying": "净买入",
    "ranking.totalBuyAmount": "总购买金额",
    "ranking.loading": "正在加载股票排名...",
    "ranking.noData": "没有排名数据",
    "ranking.refreshData": "刷新数据",
    "ranking.lockedTitle": "高级功能",
    "ranking.lockedDescription": "升级到Insider Pro，查看基于内幕交易模式的顶级股票推荐",
    "ranking.unlockButton": "解锁顶级排名",
    "ranking.recommendationReason": "推荐理由:",
    "ranking.recommendationReasonNetBuying": "推荐理由: 净买入",
    "ranking.recommendationSimple": "{count}位内部人士购买",
    "ranking.recommendationSimpleSingle": "大量购买 {amount}",
    "ranking.buySell": "买入 / 卖出",
    "ranking.recentTrade": "最近交易:",
    "ranking.buyPrice": "买入价格",
    "ranking.shareCount": "股数",
    "ranking.totalAmount": "总额",
    "ranking.tradeDate": "交易日期:",
    "ranking.lastUpdated": "最后更新",
    "ranking.alert.noTradeData": "没有{company}的最新交易信息。",
    "ranking.alert.loadFailed": "加载交易数据失败。",
    // Ranking AI Analysis
    "ranking.aiAnalysis.executiveSummary": "{name} ({title})以${price}的价格购买了{company}的{shares}股股票。这被解释为积极信号。",
    "ranking.aiAnalysis.riskMitigation": "内部人买入通常是积极信号，但建议分散投资。",
    "ranking.aiAnalysis.recommendation": "{title}的购买很可能是基于公司内部信息的决定。考虑在${price}附近进入。",
    "ranking.aiAnalysis.insiderBuyByTitle": "{title}职位的内部人买入",
    "ranking.aiAnalysis.totalTradeValue": "总交易额: ${value}K",
    "ranking.aiAnalysis.simultaneousBuyersCount": "{count}位同时买家",
    "ranking.aiAnalysis.executiveBuyActivity": "高管直接购买活动",
    "ranking.aiAnalysis.insiderConfidence": "内部人信心增强",
    "ranking.aiAnalysis.simultaneousEntry": "{count}位同时进入",
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
    "tradeList.showingTrades": "显示{count}笔交易",
    // Premium Checkout
    "checkout.title": "升级到Insider",
    "checkout.subtitle": "获得{days}天免费试用 + 实时内幕交易提醒",
    "checkout.monthly": "月付",
    "checkout.yearly": "年付",
    "checkout.yearlyDiscount": "-33%",
    "checkout.planName": "Insider",
    "checkout.planDescription": "实时内幕交易数据 & AI分析",
    "checkout.priceMonth": "/月",
    "checkout.priceYear": "/年",
    "checkout.billingMonthly": "月度自动续费",
    "checkout.billingYearly": "年度自动续费",
    "checkout.feature1": "实时内幕交易提醒（无48小时延迟）",
    "checkout.feature2": "仅纯粹买卖信号（不包括补助金、期权、奖励）",
    "checkout.feature3": "AI驱动的交易分析和预测",
    "checkout.feature4": "高级模式检测和信号",
    "checkout.feature5": "高管交易追踪（CEO、CFO等）",
    "checkout.feature6": "实时数据更新和推送通知",
    "checkout.feature7": "历史内幕交易绩效分析",
    "checkout.feature8": "独家市场情报报告",
    "checkout.trialTitle": "{days}天免费试用",
    "checkout.trialDescription": "从今天开始{days}天免费使用所有Insider功能。免费试用期结束后，将自动开始${price}/{interval}的收费。随时可以取消。",
    "checkout.secureTitle": "安全支付与自动续费",
    "checkout.secureDescription": "所有交易都经过加密，并通过Stripe安全处理。您的订阅将每{interval}自动续订，直到您取消为止。随时一键取消 - 您将保留访问权限直至计费周期结束。",
    "checkout.realDataTitle": "真实SEC数据",
    "checkout.realDataDescription": "所有数据直接来源于SEC文件。没有虚假数据 - 只有真实、可操作的情报。",
    "checkout.startTrial": "开始免费试用",
    "checkout.subscribeNow": "立即订阅",
    "checkout.startTrialButton": "开始{days}天免费试用",
    "checkout.subscribeButton": "立即订阅 - ${price}/{interval}",
    "checkout.trialSubtext": "{days}天内不会收费。试用期间随时可以取消。",
    "checkout.cardDescriptionTrial": "{days}天免费试用后 ${price}{interval}",
    "checkout.cardDescriptionNoTrial": "立即开始${price}{interval}收费",
    "checkout.planLabel": "计划:",
    "checkout.freeTrialLabel": "免费试用:",
    "checkout.afterTrialLabel": "试用后价格:",
    "checkout.priceLabel": "价格:",
    "checkout.billingCycleLabel": "计费周期:",
    "checkout.priceWithTax": "${price}/{interval} (不含税)",
    "checkout.termsAgreement": "免费试用结束后将自动收费。如果不想续费，请在自动计费前取消订阅。我理解自动计费后不可退款。"
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
function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const { t } = useLanguage();
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
    localStorage.setItem("pwa-prompt-dismissed", "true");
  };
  if (!showPrompt) return null;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const benefits = [
    {
      icon: /* @__PURE__ */ jsx(Bell, { className: "h-4 w-4" }),
      title: t("pwa.benefits.notifications.title"),
      description: t("pwa.benefits.notifications.description")
    },
    {
      icon: /* @__PURE__ */ jsx(Zap, { className: "h-4 w-4" }),
      title: t("pwa.benefits.fast.title"),
      description: t("pwa.benefits.fast.description")
    },
    {
      icon: /* @__PURE__ */ jsx(Smartphone, { className: "h-4 w-4" }),
      title: t("pwa.benefits.access.title"),
      description: t("pwa.benefits.access.description")
    }
  ];
  return /* @__PURE__ */ jsxs(Fragment$1, { children: [
    /* @__PURE__ */ jsx(
      "div",
      {
        className: "fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200",
        onClick: handleDismiss
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "fixed inset-x-0 bottom-0 z-50 animate-in slide-in-from-bottom duration-300", children: /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-md px-4 pb-4", children: /* @__PURE__ */ jsxs("div", { className: "relative overflow-hidden bg-[#080808] border border-neutral-800 shadow-[0_0_50px_rgba(0,0,0,0.9)]", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: handleDismiss,
          className: "absolute right-3 top-3 z-10 p-1.5 text-neutral-500 hover:text-white transition-colors",
          "aria-label": "Close",
          children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "p-6 border-b border-neutral-900 text-center bg-[#0a0a0a]", children: [
        /* @__PURE__ */ jsx("div", { className: "flex justify-center mb-4", children: /* @__PURE__ */ jsxs("div", { className: "w-12 h-12 bg-neutral-900 rounded-full flex items-center justify-center border border-neutral-800 relative", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 rounded-full border border-emerald-900 animate-ping opacity-20" }),
          /* @__PURE__ */ jsx(ShieldCheck, { size: 24, className: "text-emerald-500" })
        ] }) }),
        /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-white tracking-tight uppercase mb-2", children: t("pwa.prompt.title") }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-neutral-500 font-mono", children: t("pwa.prompt.subtitle") })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "p-5", children: [
        /* @__PURE__ */ jsx("div", { className: "mb-5 space-y-2", children: benefits.map((benefit, index) => /* @__PURE__ */ jsxs(
          "div",
          {
            className: "flex items-center gap-3 p-3 bg-neutral-900/50 border border-neutral-800",
            children: [
              /* @__PURE__ */ jsx("div", { className: "flex h-8 w-8 shrink-0 items-center justify-center bg-emerald-900/30 border border-emerald-900/50", children: /* @__PURE__ */ jsx("div", { className: "text-emerald-500", children: benefit.icon }) }),
              /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsx("h4", { className: "text-xs font-bold text-neutral-200 uppercase tracking-wide", children: benefit.title }),
                /* @__PURE__ */ jsx("p", { className: "text-[10px] text-neutral-500 font-mono truncate", children: benefit.description })
              ] })
            ]
          },
          index
        )) }),
        isIOS && /* @__PURE__ */ jsxs("div", { className: "mb-5 p-4 bg-neutral-900/30 border border-neutral-800", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-3", children: [
            /* @__PURE__ */ jsx("div", { className: "flex h-10 w-10 items-center justify-center bg-emerald-900/30 border border-emerald-900/50", children: /* @__PURE__ */ jsx(Share2, { className: "h-5 w-5 text-emerald-500" }) }),
            /* @__PURE__ */ jsx("div", { className: "flex items-center", children: /* @__PURE__ */ jsx("span", { className: "text-neutral-600 mx-2", children: "→" }) }),
            /* @__PURE__ */ jsx("div", { className: "flex h-10 w-10 items-center justify-center bg-emerald-900/30 border border-emerald-900/50", children: /* @__PURE__ */ jsx(Plus, { className: "h-5 w-5 text-emerald-500" }) })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-neutral-300 font-mono leading-relaxed", children: t("pwa.ios.instruction") })
        ] }),
        !isIOS && /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: handleInstall,
            className: "w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-black font-bold uppercase tracking-widest text-xs transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2",
            children: [
              /* @__PURE__ */ jsx(Download, { size: 14 }),
              t("pwa.button.install")
            ]
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleDismiss,
            className: "w-full mt-3 text-center text-[10px] text-neutral-600 hover:text-neutral-400 transition-colors uppercase tracking-wider font-mono",
            children: "나중에 하기"
          }
        )
      ] })
    ] }) }) })
  ] });
}
const defaultRates = {
  USD: 1,
  KRW: 1473.27,
  CNY: 7.09,
  JPY: 156.98
};
const CurrencyContext = createContext(void 0);
const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState(() => {
    if (typeof window === "undefined") {
      return "USD";
    }
    try {
      const savedCurrency = localStorage.getItem("currency");
      if (savedCurrency && ["USD", "KRW", "CNY", "JPY"].includes(savedCurrency)) {
        console.log("💱 Using saved currency preference:", savedCurrency);
        return savedCurrency;
      }
    } catch (error) {
      console.error("Failed to load saved currency:", error);
    }
    return "USD";
  });
  const [exchangeRates, setExchangeRates] = useState(defaultRates);
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("currency", currency);
        console.log("💱 Currency preference saved:", currency);
      } catch (error) {
        console.error("Failed to save currency preference:", error);
      }
    }
  }, [currency]);
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const response = await fetch("/api/exchange-rates");
        if (!response.ok) {
          throw new Error("Failed to fetch exchange rates");
        }
        const result = await response.json();
        if (result.success && result.data) {
          const validRates = {
            USD: Number(result.data.USD) || 1,
            KRW: Number(result.data.KRW) || defaultRates.KRW,
            CNY: Number(result.data.CNY) || defaultRates.CNY,
            JPY: Number(result.data.JPY) || defaultRates.JPY
          };
          setExchangeRates(validRates);
          console.log("💱 Exchange rates updated:", validRates);
        } else {
          console.warn("Invalid exchange rate data, using defaults");
          setExchangeRates(defaultRates);
        }
      } catch (error) {
        console.error("Failed to fetch exchange rates, using defaults:", error);
        setExchangeRates(defaultRates);
      }
    };
    fetchRates();
    const interval = setInterval(fetchRates, 24 * 60 * 60 * 1e3);
    return () => clearInterval(interval);
  }, []);
  const convert = (amountInUSD) => {
    if (!amountInUSD || amountInUSD === 0) return 0;
    const rate = exchangeRates[currency];
    if (!rate || rate === 0) {
      console.warn(`Invalid exchange rate for ${currency}:`, rate);
      return amountInUSD;
    }
    return amountInUSD * rate;
  };
  const formatCurrency2 = (amountInUSD) => {
    if (!amountInUSD || amountInUSD === 0) {
      if (currency === "USD") return "$0";
      if (currency === "KRW") return "₩0";
      if (currency === "CNY") return "¥0";
      if (currency === "JPY") return "¥0";
      return "$0";
    }
    const convertedAmount = convert(amountInUSD);
    const currencySymbols = {
      USD: "$",
      KRW: "₩",
      CNY: "¥",
      JPY: "¥"
    };
    const symbol = currencySymbols[currency];
    if (currency === "KRW") {
      return formatKoreanWon(convertedAmount);
    } else if (currency === "CNY") {
      return formatChineseYuan(convertedAmount);
    } else if (currency === "JPY") {
      return formatJapaneseYen(convertedAmount);
    } else {
      const formatted = new Intl.NumberFormat("en-US", {
        notation: "compact",
        maximumFractionDigits: 1,
        minimumFractionDigits: 0
      }).format(convertedAmount);
      return `${symbol}${formatted}`;
    }
  };
  const formatKoreanWon = (amount) => {
    const absAmount = Math.abs(amount);
    const sign = amount < 0 ? "-" : "";
    if (absAmount >= 1e12) {
      const jo = absAmount / 1e12;
      if (absAmount >= 1e13) {
        return `${sign}₩${Math.round(jo).toLocaleString("ko-KR")}조`;
      }
      return `${sign}₩${jo.toFixed(1)}조`;
    } else if (absAmount >= 1e8) {
      const eok = absAmount / 1e8;
      if (absAmount >= 1e9) {
        return `${sign}₩${Math.round(eok).toLocaleString("ko-KR")}억`;
      }
      return `${sign}₩${eok.toFixed(1)}억`;
    } else if (absAmount >= 1e4) {
      const man = absAmount / 1e4;
      return `${sign}₩${man.toFixed(0)}만`;
    } else {
      return `${sign}₩${Math.round(absAmount).toLocaleString("ko-KR")}`;
    }
  };
  const formatChineseYuan = (amount) => {
    const absAmount = Math.abs(amount);
    const sign = amount < 0 ? "-" : "";
    if (absAmount >= 1e8) {
      const yi = absAmount / 1e8;
      if (absAmount >= 1e9) {
        return `${sign}¥${Math.round(yi).toLocaleString("zh-CN")}亿`;
      }
      return `${sign}¥${yi.toFixed(1)}亿`;
    } else if (absAmount >= 1e4) {
      const wan = absAmount / 1e4;
      return `${sign}¥${wan.toFixed(0)}万`;
    } else {
      return `${sign}¥${Math.round(absAmount).toLocaleString("zh-CN")}`;
    }
  };
  const formatJapaneseYen = (amount) => {
    const absAmount = Math.abs(amount);
    const sign = amount < 0 ? "-" : "";
    if (absAmount >= 1e12) {
      const chou = absAmount / 1e12;
      if (absAmount >= 1e13) {
        return `${sign}¥${Math.round(chou).toLocaleString("ja-JP")}兆`;
      }
      return `${sign}¥${chou.toFixed(1)}兆`;
    } else if (absAmount >= 1e8) {
      const oku = absAmount / 1e8;
      if (absAmount >= 1e9) {
        return `${sign}¥${Math.round(oku).toLocaleString("ja-JP")}億`;
      }
      return `${sign}¥${oku.toFixed(1)}億`;
    } else if (absAmount >= 1e4) {
      const man = absAmount / 1e4;
      return `${sign}¥${man.toFixed(0)}万`;
    } else {
      return `${sign}¥${Math.round(absAmount).toLocaleString("ja-JP")}`;
    }
  };
  return /* @__PURE__ */ jsx(CurrencyContext.Provider, { value: { currency, setCurrency, exchangeRates, convert, formatCurrency: formatCurrency2 }, children });
};
const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === void 0) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
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
function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const currencies = [
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "KRW", symbol: "₩", name: "Korean Won" },
    { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
    { code: "JPY", symbol: "¥", name: "Japanese Yen" }
  ];
  const currentCurrency = currencies.find((c) => c.code === currency) || currencies[0];
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);
  return /* @__PURE__ */ jsxs("div", { className: "relative", ref: dropdownRef, children: [
    /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: () => setIsOpen(!isOpen),
        className: "p-2 px-3 border border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-600 hover:bg-neutral-900/50 transition-all bg-neutral-900/30 flex items-center gap-2 rounded group",
        title: "Change currency",
        children: [
          /* @__PURE__ */ jsx(DollarSign, { size: 14, className: "text-neutral-500 group-hover:text-neutral-300" }),
          /* @__PURE__ */ jsxs("span", { className: "text-xs font-mono font-bold", children: [
            currentCurrency.symbol,
            " ",
            currency
          ] }),
          /* @__PURE__ */ jsx(ChevronDown, { size: 12, className: `text-neutral-600 transition-transform ${isOpen ? "rotate-180" : ""}` })
        ]
      }
    ),
    isOpen && /* @__PURE__ */ jsx("div", { className: "absolute right-0 top-full mt-1 bg-[#0a0a0a] border border-neutral-800 shadow-[0_4px_12px_rgba(0,0,0,0.4)] z-50 min-w-[160px] rounded", children: currencies.map((curr) => /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: () => {
          setCurrency(curr.code);
          setIsOpen(false);
        },
        className: `w-full px-4 py-2.5 text-left text-xs font-mono hover:bg-neutral-900/70 transition-colors flex items-center justify-between gap-3 first:rounded-t last:rounded-b ${currency === curr.code ? "text-emerald-500 bg-neutral-900/50 border-l-2 border-l-emerald-500" : "text-neutral-400"}`,
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "text-base", children: curr.symbol }),
            /* @__PURE__ */ jsx("span", { className: "font-bold", children: curr.code })
          ] }),
          currency === curr.code && /* @__PURE__ */ jsx("span", { className: "text-emerald-500 text-[10px]", children: "✓" })
        ]
      },
      curr.code
    )) })
  ] });
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
const Dialog = DialogPrimitive.Root;
const DialogPortal = DialogPrimitive.Portal;
const DialogOverlay = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  DialogPrimitive.Overlay,
  {
    ref,
    className: cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    ),
    ...props
  }
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;
const DialogContent = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs(DialogPortal, { children: [
  /* @__PURE__ */ jsx(DialogOverlay, {}),
  /* @__PURE__ */ jsxs(
    DialogPrimitive.Content,
    {
      ref,
      className: cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      ),
      ...props,
      children: [
        children,
        /* @__PURE__ */ jsxs(DialogPrimitive.Close, { className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground", children: [
          /* @__PURE__ */ jsx(X, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Close" })
        ] })
      ]
    }
  )
] }));
DialogContent.displayName = DialogPrimitive.Content.displayName;
const DialogTitle = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  DialogPrimitive.Title,
  {
    ref,
    className: cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    ),
    ...props
  }
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;
const DialogDescription = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  DialogPrimitive.Description,
  {
    ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;
const EN = {
  common: {
    tierFree: "OUTSIDER",
    tierPro: "INSIDER",
    systemFree: "RESTRICTED_MODE",
    systemPro: "PRO_ACCESS_GRANTED",
    latencyFree: "DELAYED (48H)",
    latencyPro: "REAL-TIME (12MS)",
    licenseFree: "Upgrade License",
    licenseActive: "License Active"
  },
  sidebar: {
    modules: "Modules",
    live: "Live Trading",
    analysis: "Recommended Stocks",
    config: "Configuration",
    watched: "Watched Assets",
    noData: "NO_DATA_STREAM"
  },
  live: {
    header: "Live Insider Feed",
    delayedBadge: "48H DELAY",
    delayed: "Delayed Feed (48h)",
    realtime: "Real-Time Connection",
    query: "QUERY_TICKER_OR_INSIDER...",
    filter: { all: "All", buy: "Buy", sell: "Sell" },
    table: { ticker: "Ticker", insider: "Insider", relation: "Relation", action: "Action", price: "Price", volume: "Volume", value: "Value", impact: "vs. Market Cap", time: "Time" },
    realtimeZone: "Real-Time Signal Zone",
    encrypted: "OUTSIDER ENCRYPTED",
    encryptedForOutsiders: "ENCRYPTED FOR OUTSIDERS",
    signalEncrypted: "SIGNAL ENCRYPTED",
    encryptedMessage: "OUTSIDER users only see data delayed by 48 hours.",
    upgradeAction: "Unlock Real-Time Data",
    unlockRealtime: "UNLOCK REAL-TIME DATA",
    noRecords: "NO_RECORDS_FOUND"
  },
  top: {
    header: "Top Alpha Signals",
    subHeader: "High-Conviction Institutional Signals",
    interval: "Calculation Interval",
    restricted: "Premium Access Required",
    securityLevel: "INSTITUTIONAL GRADE DATA (Ranks 1-3)",
    desc: "Real-time alpha signals are reserved for INSIDER tier members.",
    clearance: "Institutional Access Required",
    cta: "Upgrade to Reveal Signals",
    aes: "AES-256 ENCRYPTED",
    blind: "BLIND_TRUST_MODE",
    signal: "Signal Strength",
    strongBuy: "Strong Buy",
    insiders: "Insiders",
    institutional: "Insider Purchases",
    avgPrice: "Insider Avg Price",
    curPrice: "Cur Price",
    totalVol: "Total Vol",
    buyPrice: "Buy Price",
    shareCount: "Share Count",
    totalAmount: "Total Amount",
    buyOnly: "Buy Only"
  },
  modal: {
    tradeType: "Trade Type",
    priceShare: "Price per Share",
    sharesTraded: "Shares Traded",
    totalValue: "Total Value",
    insiderName: "Insider Name",
    position: "Position / Relation",
    filingDate: "Filing Date",
    shares: "Shares",
    share: "sh",
    volume: "vol",
    verified: "Verified by SEC",
    priceTrend: "Price Trend",
    basePrice: "Base Price",
    priceAnalysis: "Price Analysis",
    tradePrice: "Trade Price",
    currentPrice: "Current Price",
    relatedNews: "Related News & Sentiment",
    aiAnalysis: "AI Analysis",
    signal: "Signal",
    confidence: "Confidence",
    keyInsight: "Key Insight",
    priceTargets: "Price Targets",
    conservative: "Conservative",
    realistic: "Realistic",
    optimistic: "Optimistic",
    riskLevel: "Risk Level",
    timeHorizon: "Time Horizon",
    sentimentAnalysis: "Sentiment Analysis",
    positive: "Positive",
    neutral: "Neutral",
    negative: "Negative",
    secFiling: "View SEC File",
    footerText: "Certified SEC Data",
    generated: "Report Generated",
    showDetails: "Show Details",
    hideDetails: "Hide Details",
    expandNews: "Expand News",
    // AI Insights
    insightCeoBuy: "CEO-level purchase signals strong confidence in company direction.",
    insightCeoSell: "Executive sale may indicate portfolio rebalancing or personal financial planning.",
    insightCfoBuy: "CFO purchase suggests positive outlook on company financials and valuation.",
    insightCfoSell: "CFO transaction likely routine diversification given insider position.",
    insightDirectorBuy: "Board director accumulation indicates institutional confidence in growth trajectory.",
    insightDirectorSell: "Director sale appears to be scheduled disposition under 10b5-1 plan.",
    insightLargeBuy: "Large-scale insider purchase exceeding $1M demonstrates high conviction.",
    insightLargeSell: "Significant insider sale may reflect profit-taking at current valuations.",
    insightMediumBuy: "Substantial insider buying activity detected in recent filings.",
    insightMediumSell: "Moderate insider selling consistent with typical executive compensation patterns.",
    insightSmallBuy: "Insider accumulation pattern suggests positive internal sentiment.",
    insightSmallSell: "Routine insider transaction within normal trading parameters.",
    // News items
    newsEarnings: "Company reports strong quarterly earnings",
    newsProduct: "New product line announced for Q2",
    newsVolatility: "Market volatility affects sector",
    newsAnalyst: "Analyst upgrades price target",
    // Risk levels & Time horizon
    riskLow: "LOW",
    riskMedium: "MEDIUM",
    riskHigh: "HIGH",
    timeHorizon36: "3-6 MONTHS"
  },
  profile: {
    header: "User Profile",
    subHeader: "Account & Subscription Management",
    account: "Account Details",
    email: "Email Address",
    joined: "Joined Date",
    subStatus: "Subscription Status",
    currentPlan: "Current Plan",
    active: "Active",
    nextBilling: "Next Billing",
    cancel: "Cancel Subscription",
    payment: "Payment Method",
    stripe: "Manage on Stripe"
  },
  settings: {
    header: "Settings",
    subHeader: "Terminal Configuration",
    language: "Interface Language",
    theme: "Theme",
    subManage: "Subscription",
    manage: "Manage",
    refresh: "Refresh",
    notifications: "Notifications",
    push: "Push Notifications Disabled",
    save: "Save Configuration"
  },
  auth: {
    welcome: "Authenticate",
    createAccount: "New Account",
    submit: "Login",
    register: "Register",
    noAccount: "No account? Initialize.",
    hasAccount: "Have account? Login."
  },
  data: {
    Buy: "Buy",
    Sell: "Sell",
    // Executive titles
    CEO: "CEO",
    CFO: "CFO",
    COO: "COO",
    CTO: "CTO",
    CIO: "CIO",
    CMO: "CMO",
    CRO: "CRO",
    CAO: "CAO",
    CHRO: "CHRO",
    CCO: "CCO",
    // Full titles
    "Chief Executive Officer": "CEO",
    "Chief Financial Officer": "CFO",
    "Chief Operating Officer": "COO",
    "Chief Technology Officer": "CTO",
    "Chief Information Officer": "CIO",
    "Chief Marketing Officer": "CMO",
    "Chief Revenue Officer": "CRO",
    "Chief Accounting Officer": "CAO",
    "Chief Medical Officer": "CMO",
    "Chief Product Officer": "CPO",
    "Chief Legal Officer": "CLO",
    "Chief Business Officer": "CBO",
    "Chief Commercial Officer": "CCO",
    "Chief Content Officer": "CCO",
    "Chief Innovation Officer": "CIO",
    // Board positions
    Director: "Director",
    Chairman: "Chairman",
    "Chair": "Chair",
    President: "President",
    "Pres": "President",
    // Combined titles
    "CEO, Pres": "CEO & President",
    "COB, CEO": "Chairman & CEO",
    "CFO, COO": "CFO & COO",
    "CFO, Treasurer": "CFO & Treasurer",
    "CHAIRPERSON, CEO": "Chair & CEO",
    // Vice Presidents
    "VP of Sales": "VP of Sales",
    EVP: "EVP",
    SVP: "SVP",
    // Ownership
    "10%": "10% Owner",
    "10% Owner": "10% Owner",
    "Major Shareholder": "Major Shareholder",
    "Co-Founder": "Co-Founder",
    // General
    Officer: "Officer",
    Insider: "Insider",
    Executive: "Executive",
    // Signals (Buy and Sell already defined above)
    "Strong Buy": "Strong Buy",
    "Hold": "Hold",
    "Strong Sell": "Strong Sell",
    // Risk levels
    "Low": "Low",
    "Medium": "Medium",
    "High": "High",
    // Time horizons
    "1-2 weeks": "1-2 weeks",
    "2-4 weeks": "2-4 weeks",
    "1-3 months": "1-3 months",
    "3-6 months": "3-6 months",
    "6-12 months": "6-12 months"
  },
  upgrade: {
    header: "Upgrade to Insider",
    subHeader: "Get free trial + real-time insider trading alerts",
    monthly: "Monthly",
    yearly: "Yearly",
    save: "Save 33%",
    priceMonthly: "$14",
    priceYearly: "$112",
    periodMonthly: "/month",
    periodYearly: "/year",
    trial: "Free Trial",
    trial3: "START 3-DAY FREE TRIAL",
    trial7: "START 7-DAY FREE TRIAL",
    trial3Badge: "3 Days Free",
    trial7Badge: "7 Days Free",
    afterTrial3: "3 days free, then $14/month",
    afterTrial7: "7 days free, then $112/year",
    features: [
      "Real-time insider trade alerts (no 48h delay)",
      "Pure buy/sell signals only (no grants, options)",
      "AI-powered trade analysis & predictions",
      "Advanced pattern detection & signals",
      "Executive trade tracking (CEO, CFO, etc.)",
      "Live data updates & push notifications",
      "Historical insider performance analytics",
      "Exclusive market intelligence reports"
    ],
    secure: "Secure Payment & Auto-Renewal",
    secData: "Real SEC Data",
    secDesc: "All data sourced directly from SEC filings. No fake data - only real, actionable intelligence.",
    terms: "Charges begin automatically after the free trial. If you do not wish to continue, please cancel your subscription before auto-billing occurs. Cancel anytime with one click."
  },
  ranking: {
    noData: "No ranking data available",
    checkedLastNDays: "Checked insider trades from last {days} days"
  }
};
const KO = {
  common: {
    tierFree: "OUTSIDER",
    tierPro: "INSIDER",
    systemFree: "제한된 모드",
    systemPro: "프로 액세스 승인됨",
    latencyFree: "지연됨 (48시간)",
    latencyPro: "실시간 (12MS)",
    licenseFree: "라이선스 업그레이드",
    licenseActive: "라이선스 활성"
  },
  sidebar: {
    modules: "모듈",
    live: "실시간 거래",
    analysis: "추천 주식",
    config: "설정",
    watched: "관심 종목",
    noData: "데이터 스트림 없음"
  },
  live: {
    header: "내부자 거래 피드",
    delayedBadge: "48시간 지연",
    delayed: "지연된 피드 (48시간)",
    realtime: "실시간 연결됨",
    query: "티커 또는 내부자 검색...",
    filter: { all: "전체", buy: "매수", sell: "매도" },
    table: { ticker: "티커", insider: "내부자", relation: "직위", action: "유형", price: "가격", volume: "거래량", value: "가치", impact: "시총대비", time: "시간" },
    realtimeZone: "실시간 시그널 구역",
    encrypted: "OUTSIDER 암호화됨",
    encryptedForOutsiders: "OUTSIDER 암호화됨",
    signalEncrypted: "시그널 암호화",
    encryptedMessage: "OUTSIDER 사용자에게는 48시간 지연된 데이터만 보입니다.",
    upgradeAction: "실시간 데이터 잠금 해제",
    unlockRealtime: "실시간 데이터 잠금 해제",
    noRecords: "기록 없음"
  },
  top: {
    header: "상위 알파 시그널",
    subHeader: "기관급 고확신 매집 시그널",
    interval: "계산 간격",
    restricted: "프리미엄 액세스 필요",
    securityLevel: "기관급 데이터 (1~3위)",
    desc: "실시간 알파 시그널은 INSIDER 등급 회원 전용입니다.",
    clearance: "기관 액세스 권한 필요",
    cta: "시그널 잠금 해제",
    aes: "AES-256 암호화",
    blind: "블라인드 트러스트 모드",
    signal: "시그널 강도",
    strongBuy: "강력 매수",
    insiders: "내부자",
    institutional: "내부자 매수 내역",
    avgPrice: "내부자 평균 매수가",
    curPrice: "현재가",
    totalVol: "총 매수액",
    buyPrice: "내부자 매수가",
    shareCount: "매수 주식 수",
    totalAmount: "총 매수액",
    buyOnly: "매수"
  },
  modal: {
    tradeType: "거래 유형",
    priceShare: "주당 가격",
    sharesTraded: "거래 주식 수",
    totalValue: "총 거래액",
    insiderName: "내부자 이름",
    position: "직위 / 관계",
    filingDate: "공시 날짜",
    shares: "거래량",
    share: "주",
    volume: "거래량",
    verified: "SEC 검증됨",
    priceTrend: "가격 추세",
    basePrice: "기준 가격",
    priceAnalysis: "가격 분석",
    tradePrice: "거래 가격",
    currentPrice: "현재 가격",
    relatedNews: "관련 뉴스 & 감정",
    aiAnalysis: "AI 분석",
    signal: "시그널",
    confidence: "신뢰도",
    keyInsight: "핵심 인사이트",
    priceTargets: "목표 주가",
    conservative: "보수적",
    realistic: "현실적",
    optimistic: "낙관적",
    riskLevel: "위험 수준",
    timeHorizon: "투자 기간",
    sentimentAnalysis: "감정 분석",
    positive: "긍정",
    neutral: "중립",
    negative: "부정",
    secFiling: "SEC 파일 보기",
    footerText: "인증된 SEC 데이터",
    generated: "보고서 생성됨",
    showDetails: "자세히 보기",
    hideDetails: "접기",
    expandNews: "뉴스 펼쳐보기",
    // AI Insights
    insightCeoBuy: "CEO급 매수로 회사 방향에 대한 강한 확신을 보여줍니다.",
    insightCeoSell: "임원 매도는 포트폴리오 재조정 또는 개인 재무 계획을 나타낼 수 있습니다.",
    insightCfoBuy: "CFO 매수는 회사 재무 및 가치에 대한 긍정적 전망을 시사합니다.",
    insightCfoSell: "CFO 거래는 내부자 포지션에 따른 일상적 분산투자로 보입니다.",
    insightDirectorBuy: "이사회 이사의 매집은 성장 궤도에 대한 기관 신뢰를 나타냅니다.",
    insightDirectorSell: "이사 매도는 10b5-1 계획에 따른 예정된 처분으로 보입니다.",
    insightLargeBuy: "100만 달러를 초과하는 대규모 내부자 매수는 높은 확신을 보여줍니다.",
    insightLargeSell: "대규모 내부자 매도는 현재 가치에서의 차익 실현을 반영할 수 있습니다.",
    insightMediumBuy: "최근 제출 서류에서 상당한 내부자 매수 활동이 감지되었습니다.",
    insightMediumSell: "적당한 내부자 매도는 일반적인 임원 보상 패턴과 일치합니다.",
    insightSmallBuy: "내부자 매집 패턴은 긍정적인 내부 심리를 시사합니다.",
    insightSmallSell: "정상적인 거래 범위 내의 일상적인 내부자 거래입니다.",
    // News items
    newsEarnings: "회사가 강한 분기 실적을 발표했습니다",
    newsProduct: "Q2에 새로운 제품 라인 발표",
    newsVolatility: "시장 변동성이 섹터에 영향",
    newsAnalyst: "애널리스트가 목표가를 상향 조정",
    // Risk levels & Time horizon
    riskLow: "낮음",
    riskMedium: "보통",
    riskHigh: "높음",
    timeHorizon36: "3-6개월"
  },
  profile: {
    header: "사용자 프로필",
    subHeader: "계정 및 구독 관리",
    account: "계정 상세",
    email: "이메일 주소",
    joined: "가입일",
    subStatus: "구독 상태",
    currentPlan: "현재 플랜",
    active: "활성",
    nextBilling: "다음 결제일",
    cancel: "구독 취소",
    payment: "결제 수단",
    stripe: "Stripe에서 관리"
  },
  settings: {
    header: "설정",
    subHeader: "터미널 구성",
    language: "인터페이스 언어",
    theme: "테마",
    subManage: "구독 관리",
    manage: "관리",
    refresh: "새로고침",
    notifications: "알림",
    push: "푸시 알림 꺼짐",
    save: "구성 저장"
  },
  auth: {
    welcome: "인증",
    createAccount: "새 계정",
    submit: "로그인",
    register: "등록",
    noAccount: "계정이 없습니까? 초기화.",
    hasAccount: "계정이 있습니까? 로그인."
  },
  data: {
    Buy: "매수",
    Sell: "매도",
    // Executive titles
    CEO: "대표이사",
    CFO: "재무이사",
    COO: "운영이사",
    CTO: "기술이사",
    CIO: "정보이사",
    CMO: "마케팅이사",
    CRO: "매출이사",
    CAO: "회계이사",
    CHRO: "인사이사",
    CCO: "콘텐츠이사",
    // Full titles
    "Chief Executive Officer": "대표이사",
    "Chief Financial Officer": "재무이사",
    "Chief Operating Officer": "운영이사",
    "Chief Technology Officer": "기술이사",
    "Chief Information Officer": "정보이사",
    "Chief Marketing Officer": "마케팅이사",
    "Chief Revenue Officer": "매출이사",
    "Chief Accounting Officer": "회계이사",
    "Chief Medical Officer": "의료이사",
    "Chief Product Officer": "제품이사",
    "Chief Legal Officer": "법무이사",
    "Chief Business Officer": "사업이사",
    "Chief Commercial Officer": "상업이사",
    "Chief Content Officer": "콘텐츠이사",
    "Chief Innovation Officer": "혁신이사",
    // Board positions
    Director: "이사",
    Chairman: "회장",
    "Chair": "의장",
    President: "사장",
    "Pres": "사장",
    // Combined titles
    "CEO, Pres": "대표이사 겸 사장",
    "COB, CEO": "회장 겸 대표이사",
    "CFO, COO": "재무 겸 운영이사",
    "CFO, Treasurer": "재무이사 겸 회계담당",
    "CHAIRPERSON, CEO": "의장 겸 대표이사",
    // Vice Presidents
    "VP of Sales": "영업 부사장",
    EVP: "부사장",
    SVP: "선임부사장",
    // Ownership
    "10%": "10% 소유주",
    "10% Owner": "10% 소유주",
    "Major Shareholder": "대주주",
    "Co-Founder": "공동 창립자",
    // General
    Officer: "임원",
    Insider: "내부자",
    Executive: "경영진",
    // Signals (Buy and Sell already defined above as 매수/매도)
    "Strong Buy": "강력 매수",
    "Hold": "보유",
    "Strong Sell": "강력 매도",
    // Risk levels
    "Low": "낮음",
    "Medium": "중간",
    "High": "높음",
    // Time horizons
    "1-2 weeks": "1-2주",
    "2-4 weeks": "2-4주",
    "1-3 months": "1-3개월",
    "3-6 months": "3-6개월",
    "6-12 months": "6-12개월"
  },
  upgrade: {
    header: "Insider로 업그레이드",
    subHeader: "무료 체험 및 실시간 내부자 거래 알림 받기",
    monthly: "월간",
    yearly: "연간",
    save: "33% 절약",
    priceMonthly: "$14",
    priceYearly: "$112",
    periodMonthly: "/월",
    periodYearly: "/연",
    trial: "무료 체험",
    trial3: "3일 무료 체험 시작",
    trial7: "7일 무료 체험 시작",
    trial3Badge: "3일 무료",
    trial7Badge: "7일 무료",
    afterTrial3: "3일 무료 체험 후 월 $14",
    afterTrial7: "7일 무료 체험 후 연 $112",
    features: [
      "실시간 내부자 거래 알림 (48시간 지연 없음)",
      "순수 매수/매도 시그널만 제공 (스톡옵션 제외)",
      "AI 기반 거래 분석 및 예측",
      "고급 패턴 감지 및 시그널",
      "임원 거래 추적 (CEO, CFO 등)",
      "실시간 데이터 업데이트 및 푸시 알림",
      "과거 내부자 성과 분석",
      "독점 시장 정보 보고서"
    ],
    secure: "안전 결제 및 자동 갱신",
    secData: "실제 SEC 데이터",
    secDesc: "SEC 공시에서 직접 소싱한 데이터. 가짜 데이터 없음 - 오직 실제 정보만 제공.",
    terms: "무료 체험 종료 후 요금이 자동으로 청구됩니다. 원하지 않을 경우 자동 결제 전에 구독을 취소하세요. 언제든지 클릭 한 번으로 취소할 수 있습니다."
  },
  ranking: {
    noData: "랭킹 데이터가 없습니다",
    checkedLastNDays: "최근 {days}일 이내 내부자 거래 확인함"
  }
};
const JA = {
  ...EN,
  common: {
    ...EN.common,
    encrypted: "OUTSIDER 暗号化",
    signalEncrypted: "シグナル暗号化",
    encryptedMessage: "OUTSIDERユーザーには48時間遅延データのみ表示されます。",
    upgradeAction: "リアルタイムデータのロック解除"
  },
  live: {
    ...EN.live,
    encryptedForOutsiders: "OUTSIDER暗号化済み",
    signalEncrypted: "シグナル暗号化",
    unlockRealtime: "リアルタイムデータのロック解除"
  },
  top: {
    ...EN.top,
    buyPrice: "購入価格",
    shareCount: "株式数",
    totalAmount: "総額",
    buyOnly: "買いのみ"
  },
  modal: {
    ...EN.modal,
    share: "株",
    volume: "出来高"
  },
  sidebar: {
    ...EN.sidebar,
    live: "ライブトレーディング",
    analysis: "おすすめ銘柄",
    config: "設定",
    watched: "ウォッチリスト"
  },
  auth: {
    ...EN.auth,
    welcome: "お帰りなさい",
    createAccount: "アカウント作成",
    submit: "ログイン",
    register: "登録",
    noAccount: "新規登録",
    hasAccount: "ログイン"
  },
  upgrade: {
    ...EN.upgrade,
    header: "INSIDERにアップグレード",
    subHeader: "無料トライアルでリアルタイムのインサイダー取引アラートを受け取る",
    monthly: "月額",
    yearly: "年額",
    save: "33%節約",
    trial: "無料トライアル",
    trial3: "3日間無料トライアル開始",
    trial7: "7日間無料トライアル開始",
    secure: "安全な支払いと自動更新"
  },
  data: {
    Buy: "買い",
    Sell: "売り",
    // Executive titles
    CEO: "最高経営責任者",
    CFO: "最高財務責任者",
    COO: "最高執行責任者",
    CTO: "最高技術責任者",
    CIO: "最高情報責任者",
    CMO: "最高マーケティング責任者",
    CRO: "最高収益責任者",
    CAO: "最高会計責任者",
    CHRO: "最高人事責任者",
    CCO: "最高コンテンツ責任者",
    // Full titles
    "Chief Executive Officer": "最高経営責任者",
    "Chief Financial Officer": "最高財務責任者",
    "Chief Operating Officer": "最高執行責任者",
    "Chief Technology Officer": "最高技術責任者",
    "Chief Information Officer": "最高情報責任者",
    "Chief Marketing Officer": "最高マーケティング責任者",
    "Chief Revenue Officer": "最高収益責任者",
    "Chief Accounting Officer": "最高会計責任者",
    "Chief Medical Officer": "最高医療責任者",
    "Chief Product Officer": "最高製品責任者",
    "Chief Legal Officer": "最高法務責任者",
    "Chief Business Officer": "最高事業責任者",
    "Chief Commercial Officer": "最高商務責任者",
    "Chief Content Officer": "最高コンテンツ責任者",
    "Chief Innovation Officer": "最高イノベーション責任者",
    // Board positions
    Director: "取締役",
    Chairman: "会長",
    "Chair": "議長",
    President: "社長",
    "Pres": "社長",
    // Combined titles
    "CEO, Pres": "最高経営責任者兼社長",
    "COB, CEO": "会長兼最高経営責任者",
    "CFO, COO": "最高財務責任者兼最高執行責任者",
    "CFO, Treasurer": "最高財務責任者兼財務担当",
    "CHAIRPERSON, CEO": "議長兼最高経営責任者",
    // Vice Presidents
    "VP of Sales": "営業担当副社長",
    EVP: "上級副社長",
    SVP: "執行副社長",
    // Ownership
    "10%": "10%所有者",
    "10% Owner": "10%所有者",
    "Major Shareholder": "大株主",
    "Co-Founder": "共同創業者",
    // General
    Officer: "役員",
    Insider: "インサイダー",
    Executive: "経営幹部",
    // Signals
    "Strong Buy": "強い買い",
    "Hold": "保有",
    "Strong Sell": "強い売り",
    // Risk levels
    "Low": "低",
    "Medium": "中",
    "High": "高",
    // Time horizons
    "1-2 weeks": "1-2週間",
    "2-4 weeks": "2-4週間",
    "1-3 months": "1-3ヶ月",
    "3-6 months": "3-6ヶ月",
    "6-12 months": "6-12ヶ月"
  },
  ranking: {
    noData: "ランキングデータがありません",
    checkedLastNDays: "過去{days}日以内のインサイダー取引を確認"
  }
};
const ZH = {
  ...EN,
  common: {
    ...EN.common,
    encrypted: "OUTSIDER 加密",
    signalEncrypted: "信号加密",
    encryptedMessage: "OUTSIDER 用户仅能查看延迟 48 小时的数据。",
    upgradeAction: "解锁实时数据"
  },
  live: {
    ...EN.live,
    encryptedForOutsiders: "OUTSIDER 加密",
    signalEncrypted: "信号加密",
    unlockRealtime: "解锁实时数据"
  },
  top: {
    ...EN.top,
    buyPrice: "购买价格",
    shareCount: "股数",
    totalAmount: "总额",
    buyOnly: "仅买入"
  },
  modal: {
    ...EN.modal,
    share: "股",
    volume: "成交量"
  },
  sidebar: {
    ...EN.sidebar,
    live: "实时交易",
    analysis: "推荐股票",
    config: "配置",
    watched: "关注列表"
  },
  auth: {
    ...EN.auth,
    welcome: "欢迎回来",
    createAccount: "创建账户",
    submit: "登录",
    register: "注册",
    noAccount: "新用户注册",
    hasAccount: "已有账户"
  },
  upgrade: {
    ...EN.upgrade,
    header: "升级到 INSIDER",
    subHeader: "免费试用并获取实时内部交易警报",
    monthly: "月付",
    yearly: "年付",
    save: "节省 33%",
    trial: "免费试用",
    trial3: "开始 3 天免费试用",
    trial7: "开始 7 天免费试用",
    secure: "安全支付和自动续订"
  },
  data: {
    Buy: "买入",
    Sell: "卖出",
    // Executive titles
    CEO: "首席执行官",
    CFO: "首席财务官",
    COO: "首席运营官",
    CTO: "首席技术官",
    CIO: "首席信息官",
    CMO: "首席营销官",
    CRO: "首席收入官",
    CAO: "首席会计官",
    CHRO: "首席人力资源官",
    CCO: "首席内容官",
    // Full titles
    "Chief Executive Officer": "首席执行官",
    "Chief Financial Officer": "首席财务官",
    "Chief Operating Officer": "首席运营官",
    "Chief Technology Officer": "首席技术官",
    "Chief Information Officer": "首席信息官",
    "Chief Marketing Officer": "首席营销官",
    "Chief Revenue Officer": "首席收入官",
    "Chief Accounting Officer": "首席会计官",
    "Chief Medical Officer": "首席医疗官",
    "Chief Product Officer": "首席产品官",
    "Chief Legal Officer": "首席法务官",
    "Chief Business Officer": "首席商务官",
    "Chief Commercial Officer": "首席商业官",
    "Chief Content Officer": "首席内容官",
    "Chief Innovation Officer": "首席创新官",
    // Board positions
    Director: "董事",
    Chairman: "董事长",
    "Chair": "主席",
    President: "总裁",
    "Pres": "总裁",
    // Combined titles
    "CEO, Pres": "首席执行官兼总裁",
    "COB, CEO": "董事长兼首席执行官",
    "CFO, COO": "首席财务官兼首席运营官",
    "CFO, Treasurer": "首席财务官兼财务主管",
    "CHAIRPERSON, CEO": "主席兼首席执行官",
    // Vice Presidents
    "VP of Sales": "销售副总裁",
    EVP: "执行副总裁",
    SVP: "高级副总裁",
    // Ownership
    "10%": "10%持股人",
    "10% Owner": "10%持股人",
    "Major Shareholder": "大股东",
    "Co-Founder": "联合创始人",
    // General
    Officer: "高管",
    Insider: "内部人",
    Executive: "管理层",
    // Signals
    "Strong Buy": "强烈买入",
    "Hold": "持有",
    "Strong Sell": "强烈卖出",
    // Risk levels
    "Low": "低",
    "Medium": "中",
    "High": "高",
    // Time horizons
    "1-2 weeks": "1-2周",
    "2-4 weeks": "2-4周",
    "1-3 months": "1-3个月",
    "3-6 months": "3-6个月",
    "6-12 months": "6-12个月"
  },
  ranking: {
    noData: "无排名数据",
    checkedLastNDays: "检查了过去{days}天的内部交易"
  }
};
const TRANSLATIONS = {
  en: EN,
  ko: KO,
  ja: JA,
  zh: ZH
};
function formatCurrency(val, showDecimals = true) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: showDecimals ? 2 : 0,
    minimumFractionDigits: showDecimals ? 2 : 0
  }).format(val);
}
function formatNumber(val) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(val);
}
function TradeDetailModal({ isOpen, onClose, trade }) {
  var _a, _b, _c;
  const { language } = useLanguage();
  const { formatCurrency: formatCurrency2 } = useCurrency();
  const [newsExpanded, setNewsExpanded] = useState(true);
  const gradientId = useId();
  const [stockPrice, setStockPrice] = useState(null);
  useEffect(() => {
    if (!isOpen || !(trade == null ? void 0 : trade.ticker)) {
      setStockPrice(null);
      return;
    }
    const fetchStockPrice = async () => {
      try {
        const response = await fetch(`/api/stocks/${trade.ticker}`);
        if (response.ok) {
          const data = await response.json();
          setStockPrice(data);
        }
      } catch (error) {
        console.error("Failed to fetch stock price:", error);
      }
    };
    fetchStockPrice();
  }, [isOpen, trade == null ? void 0 : trade.ticker]);
  const langKey = language.toLowerCase();
  const t = TRANSLATIONS[langKey].modal;
  const aiAnalysis = useMemo(() => {
    var _a2, _b2, _c2, _d, _e;
    if (!trade) return null;
    if (trade.aiAnalysis && typeof trade.aiAnalysis === "object" && "signal" in trade.aiAnalysis) {
      const ai = trade.aiAnalysis;
      const conservativePct = ((_a2 = ai.priceTargets) == null ? void 0 : _a2.conservative) || 3;
      const realisticPct = ((_b2 = ai.priceTargets) == null ? void 0 : _b2.realistic) || 7;
      const optimisticPct = ((_c2 = ai.priceTargets) == null ? void 0 : _c2.optimistic) || 15;
      return {
        signal: ai.signal || "BUY",
        confidence: ai.significanceScore || 75,
        insight: ((_d = ai.keyInsights) == null ? void 0 : _d[0]) || t.insightSmallBuy,
        priceTargets: {
          conservative: trade.pricePerShare * (1 + conservativePct / 100),
          realistic: trade.pricePerShare * (1 + realisticPct / 100),
          optimistic: trade.pricePerShare * (1 + optimisticPct / 100)
        },
        riskLevel: ai.riskLevel === "LOW" ? t.riskLow : ai.riskLevel === "MEDIUM" ? t.riskMedium : t.riskHigh,
        timeHorizon: ai.timeHorizon || "2-4 weeks"
      };
    }
    const isBuy2 = trade.tradeType === "BUY" || trade.tradeType === "Buy";
    const traderTitle = ((_e = trade.traderTitle) == null ? void 0 : _e.toLowerCase()) || "";
    const totalValue = trade.totalValue || trade.shares * trade.pricePerShare;
    let insight = "";
    if (traderTitle.includes("ceo") || traderTitle.includes("president")) {
      insight = isBuy2 ? t.insightCeoBuy : t.insightCeoSell;
    } else if (traderTitle.includes("cfo")) {
      insight = isBuy2 ? t.insightCfoBuy : t.insightCfoSell;
    } else if (traderTitle.includes("director")) {
      insight = isBuy2 ? t.insightDirectorBuy : t.insightDirectorSell;
    } else if (totalValue > 1e6) {
      insight = isBuy2 ? t.insightLargeBuy : t.insightLargeSell;
    } else if (totalValue > 1e5) {
      insight = isBuy2 ? t.insightMediumBuy : t.insightMediumSell;
    } else {
      insight = isBuy2 ? t.insightSmallBuy : t.insightSmallSell;
    }
    const isExecutive = traderTitle.includes("ceo") || traderTitle.includes("cfo") || traderTitle.includes("president") || traderTitle.includes("director");
    const isLargeTrade = totalValue > 1e6;
    const isMediumTrade = totalValue > 1e5;
    let priceTargets;
    let timeHorizon;
    if (isBuy2) {
      if (isExecutive && isLargeTrade) {
        priceTargets = {
          conservative: trade.pricePerShare * 1.05,
          realistic: trade.pricePerShare * 1.12,
          optimistic: trade.pricePerShare * 1.25
        };
        timeHorizon = "1-2 weeks";
      } else if (isExecutive || isLargeTrade) {
        priceTargets = {
          conservative: trade.pricePerShare * 1.03,
          realistic: trade.pricePerShare * 1.08,
          optimistic: trade.pricePerShare * 1.18
        };
        timeHorizon = "2-3 weeks";
      } else if (isMediumTrade) {
        priceTargets = {
          conservative: trade.pricePerShare * 1.02,
          realistic: trade.pricePerShare * 1.05,
          optimistic: trade.pricePerShare * 1.12
        };
        timeHorizon = "2-4 weeks";
      } else {
        priceTargets = {
          conservative: trade.pricePerShare * 1.01,
          realistic: trade.pricePerShare * 1.03,
          optimistic: trade.pricePerShare * 1.08
        };
        timeHorizon = "3-4 weeks";
      }
    } else {
      if (isLargeTrade) {
        priceTargets = {
          conservative: trade.pricePerShare * 0.97,
          realistic: trade.pricePerShare * 0.92,
          optimistic: trade.pricePerShare * 0.85
        };
        timeHorizon = "1-2 weeks";
      } else {
        priceTargets = {
          conservative: trade.pricePerShare * 0.99,
          realistic: trade.pricePerShare * 0.97,
          optimistic: trade.pricePerShare * 0.93
        };
        timeHorizon = "2-3 weeks";
      }
    }
    let confidence = 50;
    if (isExecutive) confidence += 20;
    if (isLargeTrade) confidence += 15;
    else if (isMediumTrade) confidence += 8;
    return {
      signal: isBuy2 ? "BUY" : "SELL",
      confidence: Math.min(95, confidence),
      insight,
      priceTargets,
      riskLevel: isLargeTrade && !isBuy2 ? t.riskHigh : isExecutive && isBuy2 ? t.riskLow : t.riskMedium,
      timeHorizon
    };
  }, [trade, t]);
  const priceHistory = useMemo(() => {
    if (!trade) return [];
    const filingDate = new Date(trade.filedDate);
    const insiderPrice = trade.pricePerShare;
    const data = [];
    for (let i = -7; i <= 6; i++) {
      const date = new Date(filingDate);
      date.setDate(date.getDate() + i);
      const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
      let marketPrice;
      if (i < 0) {
        marketPrice = insiderPrice * (0.95 + Math.random() * 0.03);
      } else if (i === 0) {
        marketPrice = insiderPrice;
      } else {
        const trend = i * 5e-3;
        marketPrice = insiderPrice * (1 + trend + (Math.random() * 0.02 - 0.01));
      }
      data.push({
        date: dateStr,
        marketPrice,
        insiderPrice,
        isInsiderTrade: i === 0
      });
    }
    return data;
  }, [trade]);
  const news = useMemo(() => [
    { title: t.newsEarnings, sentiment: "POSITIVE" },
    { title: t.newsProduct, sentiment: "POSITIVE" },
    { title: t.newsVolatility, sentiment: "NEUTRAL" },
    { title: t.newsAnalyst, sentiment: "POSITIVE" }
  ], [t]);
  if (!trade) return null;
  const isBuy = trade.tradeType === "BUY" || trade.tradeType === "Buy";
  const getSecFilingUrl = () => {
    if (trade.secFilingUrl) {
      return trade.secFilingUrl;
    }
    if (trade.accessionNumber) {
      const parts = trade.accessionNumber.split("-");
      if (parts.length >= 3) {
        const cikPadded = parts[0];
        const cik = Number(cikPadded);
        const accessionNoDashes = trade.accessionNumber.replace(/-/g, "");
        return `https://www.sec.gov/Archives/edgar/data/${cik}/${accessionNoDashes}/xslF345X05/primarydocument.xml`;
      }
    }
    return `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${trade.ticker}&type=4&dateb=&owner=only&count=100`;
  };
  const secFilingUrl = getSecFilingUrl();
  const currentPrice = (stockPrice == null ? void 0 : stockPrice.currentPrice) || trade.pricePerShare;
  const priceChange = stockPrice ? (stockPrice.currentPrice - trade.pricePerShare) / trade.pricePerShare * 100 : 0;
  news.filter((n) => n.sentiment === "POSITIVE").length;
  news.filter((n) => n.sentiment === "NEUTRAL").length;
  return /* @__PURE__ */ jsx(Dialog, { open: isOpen, onOpenChange: onClose, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-[90vw] lg:max-w-[1200px] w-full h-[90vh] max-h-[900px] bg-[#0a0a0a] border-neutral-800 p-0 flex flex-col [&>button]:hidden", children: [
    /* @__PURE__ */ jsx(VisuallyHidden, { children: /* @__PURE__ */ jsx(DialogTitle, { children: (trade == null ? void 0 : trade.companyName) || "Trade Details" }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full overflow-hidden", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-4 py-2.5 border-b border-neutral-800", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5", children: [
          /* @__PURE__ */ jsx("div", { className: "w-9 h-9 bg-neutral-900 border border-neutral-700 flex items-center justify-center", children: /* @__PURE__ */ jsx("span", { className: "text-neutral-400 font-mono text-[10px] font-bold", children: ((_a = trade.ticker) == null ? void 0 : _a.slice(0, 2)) || "TS" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h2", { className: "text-base text-neutral-200 font-light tracking-tight", children: trade.companyName }),
            /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 mt-0", children: /* @__PURE__ */ jsx("span", { className: "text-[10px] text-neutral-600 font-mono", children: trade.ticker }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(CurrencySelector, {}),
          /* @__PURE__ */ jsx("button", { onClick: onClose, className: "p-1.5 hover:bg-neutral-900 transition-colors", "data-testid": "button-close-modal", children: /* @__PURE__ */ jsx(X, { size: 16, className: "text-neutral-500" }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-4 border-b border-neutral-800", children: [
        /* @__PURE__ */ jsxs("div", { className: "px-4 py-2.5 border-r border-neutral-800", children: [
          /* @__PURE__ */ jsx("div", { className: "text-[7px] text-neutral-600 uppercase tracking-[0.15em] font-mono mb-1", children: t.tradeType.toUpperCase() }),
          /* @__PURE__ */ jsx("div", { className: `text-lg font-light ${isBuy ? "text-emerald-500" : "text-rose-500"}`, children: trade.tradeType })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "px-4 py-2.5 border-r border-neutral-800", children: [
          /* @__PURE__ */ jsx("div", { className: "text-[7px] text-neutral-600 uppercase tracking-[0.15em] font-mono mb-1", children: t.priceShare.toUpperCase() }),
          /* @__PURE__ */ jsx("div", { className: "text-lg font-light text-neutral-200", children: formatCurrency2(trade.pricePerShare) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "px-4 py-2.5 border-r border-neutral-800", children: [
          /* @__PURE__ */ jsx("div", { className: "text-[7px] text-neutral-600 uppercase tracking-[0.15em] font-mono mb-1", children: t.sharesTraded.toUpperCase() }),
          /* @__PURE__ */ jsxs("div", { className: "text-lg font-light text-neutral-200", children: [
            formatNumber(trade.shares / 1e3),
            "K"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "px-4 py-2.5", children: [
          /* @__PURE__ */ jsx("div", { className: "text-[7px] text-neutral-600 uppercase tracking-[0.15em] font-mono mb-1", children: t.totalValue.toUpperCase() }),
          /* @__PURE__ */ jsx("div", { className: "text-lg font-light text-neutral-200", children: formatCurrency2(trade.totalValue, false) }),
          (stockPrice == null ? void 0 : stockPrice.marketCap) && stockPrice.marketCap > 0 && /* @__PURE__ */ jsx("div", { className: "text-[10px] text-neutral-500 font-mono mt-1", children: (() => {
            const ratio = trade.totalValue / stockPrice.marketCap * 100;
            let percentStr;
            if (ratio >= 10) percentStr = Math.round(ratio) + "%";
            else if (ratio >= 1) percentStr = ratio.toFixed(1) + "%";
            else if (ratio >= 0.01) percentStr = ratio.toFixed(2) + "%";
            else if (ratio >= 1e-3) percentStr = ratio.toFixed(3) + "%";
            else if (ratio >= 1e-4) percentStr = ratio.toFixed(4) + "%";
            else if (ratio >= 1e-5) percentStr = ratio.toFixed(5) + "%";
            else if (ratio >= 1e-6) percentStr = ratio.toFixed(6) + "%";
            else if (ratio > 0) percentStr = ratio.toExponential(2) + "%";
            else percentStr = "0%";
            const prefix = language === "ko" ? "시총대비 " : language === "ja" ? "時価総額比 " : language === "zh" ? "市值比 " : "Market cap ratio: ";
            return prefix + percentStr;
          })() })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 grid grid-cols-1 lg:grid-cols-[1fr_360px] overflow-auto", children: [
        /* @__PURE__ */ jsxs("div", { className: "border-r border-neutral-800 flex flex-col", children: [
          /* @__PURE__ */ jsxs("div", { className: "px-3 py-2 border-b border-neutral-800 grid grid-cols-3 gap-x-4 text-xs bg-neutral-950/10", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("div", { className: "text-[7px] text-neutral-600 uppercase tracking-[0.15em] font-mono mb-0.5", children: t.insiderName.toUpperCase() }),
              /* @__PURE__ */ jsx("div", { className: "text-neutral-300 text-[10px] truncate", children: trade.traderName })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("div", { className: "text-[7px] text-neutral-600 uppercase tracking-[0.15em] font-mono mb-0.5", children: t.position.toUpperCase() }),
              /* @__PURE__ */ jsx("div", { className: "text-neutral-300 text-[10px] truncate", children: trade.traderTitle || "Insider" })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("div", { className: "text-[7px] text-neutral-600 uppercase tracking-[0.15em] font-mono mb-0.5", children: t.filingDate.toUpperCase() }),
              /* @__PURE__ */ jsx("div", { className: "text-neutral-300 text-[10px]", children: new Date(trade.filedDate).toLocaleDateString() })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1 p-3 flex flex-col", children: [
            /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: 220, children: /* @__PURE__ */ jsxs(ComposedChart, { data: priceHistory, margin: { left: 10, right: 20, top: 10, bottom: 5 }, children: [
              /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("linearGradient", { id: gradientId, x1: "0", y1: "0", x2: "0", y2: "1", children: [
                /* @__PURE__ */ jsx("stop", { offset: "0%", stopColor: "#10b981", stopOpacity: 0.6 }),
                /* @__PURE__ */ jsx("stop", { offset: "50%", stopColor: "#059669", stopOpacity: 0.3 }),
                /* @__PURE__ */ jsx("stop", { offset: "100%", stopColor: "#064e3b", stopOpacity: 0.05 })
              ] }) }),
              /* @__PURE__ */ jsx(CartesianGrid, { stroke: "#999999", strokeDasharray: "3 3", strokeOpacity: 0.3 }),
              /* @__PURE__ */ jsx(
                XAxis,
                {
                  dataKey: "date",
                  stroke: "#666666",
                  style: { fontSize: "9px", fontFamily: "monospace" },
                  tick: { fill: "#525252" },
                  axisLine: { strokeWidth: 1 }
                }
              ),
              /* @__PURE__ */ jsx(
                YAxis,
                {
                  stroke: "#666666",
                  style: { fontSize: "9px", fontFamily: "monospace" },
                  tick: { fill: "#525252" },
                  axisLine: { strokeWidth: 1 },
                  domain: ["auto", "auto"],
                  width: 50
                }
              ),
              /* @__PURE__ */ jsx(
                Tooltip,
                {
                  contentStyle: {
                    background: "#0a0a0a",
                    border: "1px solid #262626",
                    borderRadius: "0px",
                    fontSize: "10px",
                    fontFamily: "monospace",
                    padding: "8px"
                  },
                  labelStyle: { color: "#737373", fontSize: "9px" },
                  formatter: (value, name) => {
                    if (name === "marketPrice") {
                      const delta = value - trade.pricePerShare;
                      const deltaPercent = (delta / trade.pricePerShare * 100).toFixed(2);
                      return [`$${value.toFixed(2)} (${delta >= 0 ? "+" : ""}${deltaPercent}%)`, "Market"];
                    }
                    if (name === "insiderPrice") {
                      return [`$${value.toFixed(2)}`, "Insider"];
                    }
                    return [value, name];
                  }
                }
              ),
              /* @__PURE__ */ jsx(
                ReferenceLine,
                {
                  y: trade.pricePerShare,
                  stroke: "#404040",
                  strokeDasharray: "3 3",
                  strokeWidth: 1,
                  label: {
                    value: `Insider Entry: $${trade.pricePerShare.toFixed(2)}`,
                    position: "insideTopLeft",
                    fill: "#737373",
                    fontSize: 9,
                    fontFamily: "monospace"
                  }
                }
              ),
              /* @__PURE__ */ jsx(
                Area,
                {
                  type: "monotone",
                  dataKey: "marketPrice",
                  fill: `url(#${gradientId})`,
                  fillOpacity: 1,
                  stroke: "none",
                  isAnimationActive: true,
                  animationDuration: 4e3,
                  animationEasing: "ease-out",
                  baseLine: 0
                }
              ),
              /* @__PURE__ */ jsx(
                Line,
                {
                  type: "monotone",
                  dataKey: "marketPrice",
                  stroke: "#10b981",
                  strokeWidth: 2.5,
                  dot: false,
                  isAnimationActive: true,
                  animationDuration: 4e3,
                  animationEasing: "ease-in-out"
                }
              ),
              /* @__PURE__ */ jsx(
                ReferenceDot,
                {
                  x: (_b = priceHistory.find((p) => p.isInsiderTrade)) == null ? void 0 : _b.date,
                  y: trade.pricePerShare,
                  r: 4,
                  fill: isBuy ? "#10b981" : "#ef4444",
                  stroke: "#0a0a0a",
                  strokeWidth: 1.5
                }
              )
            ] }) }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 pt-2.5 border-t border-neutral-800 mt-2.5", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("div", { className: "text-[7px] text-neutral-600 uppercase tracking-[0.15em] font-mono mb-0.5", children: t.basePrice.toUpperCase() }),
                /* @__PURE__ */ jsx("div", { className: "text-sm text-neutral-300 font-mono", children: formatCurrency2(trade.pricePerShare) })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("div", { className: "text-[7px] text-neutral-600 uppercase tracking-[0.15em] font-mono mb-0.5", children: t.currentPrice.toUpperCase() }),
                /* @__PURE__ */ jsxs("div", { className: `text-sm font-mono flex items-center gap-1.5 ${priceChange >= 0 ? "text-emerald-500" : "text-rose-500"}`, children: [
                  formatCurrency2(currentPrice),
                  /* @__PURE__ */ jsxs("span", { className: "text-[10px]", children: [
                    priceChange >= 0 ? "+" : "",
                    priceChange.toFixed(2),
                    "%"
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "border-t border-neutral-800 pt-2.5 mt-2.5", children: [
              /* @__PURE__ */ jsxs(
                "div",
                {
                  className: "flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity",
                  onClick: () => setNewsExpanded(!newsExpanded),
                  children: [
                    /* @__PURE__ */ jsx(Newspaper, { size: 11, className: "text-amber-500" }),
                    /* @__PURE__ */ jsxs("span", { className: "text-[9px] text-amber-500 uppercase tracking-widest font-mono font-bold", children: [
                      ((_c = t.expandNews) == null ? void 0 : _c.toUpperCase()) || t.relatedNews.toUpperCase(),
                      " (",
                      news.length,
                      ")"
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "ml-auto flex items-center gap-1 text-neutral-500", children: [
                      /* @__PURE__ */ jsx("span", { className: "text-[8px] font-mono uppercase tracking-wider", children: newsExpanded ? t.hideDetails : t.showDetails }),
                      newsExpanded ? /* @__PURE__ */ jsx(ChevronUp, { size: 10 }) : /* @__PURE__ */ jsx(ChevronDown, { size: 10 })
                    ] })
                  ]
                }
              ),
              newsExpanded && /* @__PURE__ */ jsx("div", { className: "space-y-1 mt-2 max-h-[100px] overflow-y-auto", children: news.length > 0 ? news.map((item, idx) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-2 py-1.5 border border-neutral-800 bg-neutral-950/20 hover:bg-neutral-900/30 transition-colors", children: [
                /* @__PURE__ */ jsx("span", { className: "text-[10px] text-neutral-300 truncate flex-1 mr-2", children: item.title }),
                /* @__PURE__ */ jsx("span", { className: `text-[7px] px-1.5 py-0.5 border font-mono uppercase tracking-wider shrink-0 ${item.sentiment === "POSITIVE" ? "text-emerald-500 border-emerald-900/30 bg-emerald-950/20" : "text-neutral-500 border-neutral-800 bg-neutral-950/20"}`, children: item.sentiment })
              ] }, idx)) : /* @__PURE__ */ jsx("div", { className: "text-center py-2 text-neutral-600 text-[10px]", children: "Loading news..." }) })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 p-4 bg-neutral-950/20", children: [
          /* @__PURE__ */ jsxs(
            "a",
            {
              href: secFilingUrl,
              target: "_blank",
              rel: "noopener noreferrer",
              className: "px-3 py-2 bg-emerald-950/20 border border-emerald-900/30 flex items-center justify-between hover:bg-emerald-950/30 transition-colors group",
              "data-testid": "link-sec-filing",
              children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(CheckCircle, { size: 12, className: "text-emerald-500" }),
                  /* @__PURE__ */ jsx("span", { className: "text-[9px] text-emerald-500 uppercase tracking-widest font-mono", children: t.secFiling.toUpperCase() })
                ] }),
                /* @__PURE__ */ jsx(ExternalLink, { size: 10, className: "text-emerald-500/50 group-hover:text-emerald-500" })
              ]
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "border border-neutral-800 bg-neutral-950/30", children: [
            /* @__PURE__ */ jsxs("div", { className: "px-3 py-2 border-b border-neutral-800 flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Brain, { size: 11, className: "text-neutral-500" }),
              /* @__PURE__ */ jsx("span", { className: "text-[9px] text-neutral-500 uppercase tracking-widest font-mono", children: t.aiAnalysis.toUpperCase() })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-3 space-y-3", children: [
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("div", { className: "text-[8px] text-neutral-600 uppercase tracking-widest font-mono mb-1.5", children: t.signal.toUpperCase() }),
                  /* @__PURE__ */ jsx("div", { className: `text-xl font-light ${(aiAnalysis == null ? void 0 : aiAnalysis.signal) === "BUY" ? "text-emerald-500" : (aiAnalysis == null ? void 0 : aiAnalysis.signal) === "SELL" ? "text-rose-500" : "text-neutral-400"}`, children: (aiAnalysis == null ? void 0 : aiAnalysis.signal) || (isBuy ? "BUY" : "SELL") })
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("div", { className: "text-[8px] text-neutral-600 uppercase tracking-widest font-mono mb-1.5", children: t.confidence.toUpperCase() }),
                  /* @__PURE__ */ jsxs("div", { className: "text-xl font-light text-neutral-200", children: [
                    (aiAnalysis == null ? void 0 : aiAnalysis.confidence) || 97,
                    "%"
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-[11px] text-neutral-300 leading-relaxed italic border-l-2 border-neutral-700 pl-2", children: (aiAnalysis == null ? void 0 : aiAnalysis.insight) || "Merger discussions rumored in industry reports." })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "border border-neutral-800 bg-neutral-950/30", children: [
            /* @__PURE__ */ jsxs("div", { className: "px-3 py-2 border-b border-neutral-800 flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Target, { size: 11, className: "text-neutral-500" }),
              /* @__PURE__ */ jsx("span", { className: "text-[9px] text-neutral-500 uppercase tracking-widest font-mono", children: t.priceTargets.toUpperCase() })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-3 space-y-2.5", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3", children: [
                /* @__PURE__ */ jsx("span", { className: "text-[8px] text-neutral-600 uppercase tracking-widest font-mono w-24", children: t.conservative.toUpperCase() }),
                /* @__PURE__ */ jsx("div", { className: "flex-1 h-2 bg-neutral-800 rounded-sm overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "h-full bg-neutral-600 rounded-sm", style: { width: "60%" } }) }),
                /* @__PURE__ */ jsx("span", { className: "text-xs text-neutral-300 font-mono w-14 text-right", children: formatCurrency2((aiAnalysis == null ? void 0 : aiAnalysis.priceTargets.conservative) || trade.pricePerShare * 1.05) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3", children: [
                /* @__PURE__ */ jsx("span", { className: "text-[8px] text-neutral-600 uppercase tracking-widest font-mono w-24", children: t.realistic.toUpperCase() }),
                /* @__PURE__ */ jsx("div", { className: "flex-1 h-2 bg-neutral-800 rounded-sm overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "h-full bg-emerald-500 rounded-sm", style: { width: "80%" } }) }),
                /* @__PURE__ */ jsx("span", { className: "text-xs text-neutral-300 font-mono w-14 text-right", children: formatCurrency2((aiAnalysis == null ? void 0 : aiAnalysis.priceTargets.realistic) || trade.pricePerShare * 1.19) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3", children: [
                /* @__PURE__ */ jsx("span", { className: "text-[8px] text-neutral-600 uppercase tracking-widest font-mono w-24", children: t.optimistic.toUpperCase() }),
                /* @__PURE__ */ jsx("div", { className: "flex-1 h-2 bg-neutral-800 rounded-sm overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "h-full bg-amber-500 rounded-sm", style: { width: "100%" } }) }),
                /* @__PURE__ */ jsx("span", { className: "text-xs text-neutral-300 font-mono w-14 text-right", children: formatCurrency2((aiAnalysis == null ? void 0 : aiAnalysis.priceTargets.optimistic) || trade.pricePerShare * 1.43) })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "border border-neutral-800 bg-neutral-950/30 p-3", children: [
              /* @__PURE__ */ jsx("div", { className: "text-[8px] text-neutral-600 uppercase tracking-widest font-mono mb-1.5", children: t.riskLevel.toUpperCase() }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-amber-500", children: [
                /* @__PURE__ */ jsx(AlertTriangle, { size: 12 }),
                /* @__PURE__ */ jsx("span", { className: "text-xs font-bold", children: (aiAnalysis == null ? void 0 : aiAnalysis.riskLevel) || t.riskLow })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "border border-neutral-800 bg-neutral-950/30 p-3", children: [
              /* @__PURE__ */ jsx("div", { className: "text-[8px] text-neutral-600 uppercase tracking-widest font-mono mb-1.5", children: t.timeHorizon.toUpperCase() }),
              /* @__PURE__ */ jsx("div", { className: "text-xs text-neutral-300 font-mono", children: (aiAnalysis == null ? void 0 : aiAnalysis.timeHorizon) || t.timeHorizon36 })
            ] })
          ] })
        ] })
      ] })
    ] })
  ] }) });
}
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
memo(function PriceComparisonChart2({
  tradePrice,
  currentPrice,
  filedDate
}) {
  const { t } = useLanguage();
  const formatCurrency2 = (value) => {
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
        /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-primary", children: formatCurrency2(data2.price) })
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
        /* @__PURE__ */ jsx(Tooltip, { content: /* @__PURE__ */ jsx(CustomTooltip, {}) }),
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
          /* @__PURE__ */ jsx("p", { className: "text-lg font-bold", "data-testid": "chart-trade-price", children: formatCurrency2(tradePrice) }),
          /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "mt-1", children: t("priceChart.insiderTrade") })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mb-1", children: t("priceChart.currentPrice") }),
          /* @__PURE__ */ jsx("p", { className: "text-lg font-bold", "data-testid": "chart-current-price", children: formatCurrency2(currentPrice) }),
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
          formatCurrency2(tradePrice),
          " → ",
          t("priceChart.currentLabel"),
          " ",
          formatCurrency2(currentPrice)
        ] })
      ] }) })
    ] })
  ] });
});
memo(function StockHistoryChart2({
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
  const formatCurrency2 = (value) => {
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
          /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-primary", children: formatCurrency2(data.close) })
        ] }) : /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Close Price" }),
          /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-primary", children: formatCurrency2(data.close) }),
          /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground space-y-1", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              "Open: ",
              formatCurrency2(data.open)
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              "High: ",
              formatCurrency2(data.high)
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              "Low: ",
              formatCurrency2(data.low)
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
            formatCurrency2(tradePrice)
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("div", { className: "w-3 h-3 rounded-full bg-primary" }),
          /* @__PURE__ */ jsxs("span", { children: [
            "Current: ",
            formatCurrency2(currentPrice)
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: `flex items-center gap-2 ${isGain ? "text-green-600" : "text-red-600"}`, children: [
          /* @__PURE__ */ jsx(TrendingUp, { className: `w-4 h-4 ${isGain ? "" : "rotate-180"}` }),
          /* @__PURE__ */ jsxs("span", { children: [
            isGain ? "+" : "",
            formatCurrency2(priceChange),
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
        /* @__PURE__ */ jsx(Tooltip, { content: /* @__PURE__ */ jsx(CustomTooltip, {}) }),
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
function mapInsiderTradeToTerminal(trade) {
  return {
    id: trade.id,
    ticker: trade.ticker || "N/A",
    companyName: trade.companyName,
    insider: trade.traderName,
    relation: trade.traderTitle || "Unknown",
    type: trade.tradeType === "BUY" ? "Buy" : "Sell",
    shares: trade.shares,
    price: trade.pricePerShare,
    value: trade.totalValue,
    date: new Date(trade.filedDate).toISOString(),
    priceChange: trade.priceVariance || 0,
    marketCap: trade.marketCap || 0,
    isVerified: trade.isVerified || false
  };
}
function LiveTradingTerminal() {
  const { language } = useLanguage();
  useCurrency();
  const { accessLevel, setAccessLevel } = useAccess();
  const { isAuthenticated } = useAuth();
  const [, navigate2] = useLocation();
  useQueryClient();
  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadedCount, setLoadedCount] = useState(100);
  const langKey = language.toLowerCase();
  const t = TRANSLATIONS[langKey].live;
  const tData = TRANSLATIONS[langKey].data;
  TRANSLATIONS[langKey].common;
  const isPro = (accessLevel == null ? void 0 : accessLevel.hasRealtimeAccess) || false;
  const { data: tradesResponse, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.trades.list({
      limit: loadedCount,
      offset: 0,
      sortBy: "createdAt"
    }),
    queryFn: async () => {
      const response = await apiClient.getInsiderTradesWithAccess(loadedCount, 0, void 0, void 0, "createdAt");
      if (response.accessLevel) {
        setAccessLevel(response.accessLevel);
      }
      return response;
    },
    staleTime: 5 * 60 * 1e3,
    refetchInterval: 5 * 60 * 1e3,
    refetchOnWindowFocus: true
  });
  const allTrades = useMemo(() => (tradesResponse == null ? void 0 : tradesResponse.trades) || [], [tradesResponse == null ? void 0 : tradesResponse.trades]);
  const wsUrl = getWebSocketUrl();
  const { isConnected } = useWebSocket(wsUrl);
  const terminalTrades = useMemo(() => {
    return allTrades.map(mapInsiderTradeToTerminal).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allTrades]);
  const filteredData = useMemo(() => {
    let result = terminalTrades;
    if (filter !== "All") {
      result = result.filter((t2) => t2.type === filter);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t2) => t2.ticker.toLowerCase().includes(query) || t2.companyName.toLowerCase().includes(query) || t2.insider.toLowerCase().includes(query)
      );
    }
    return result;
  }, [terminalTrades, filter, searchQuery]);
  const realTimeItems = isPro ? filteredData.slice(0, 3) : [];
  const historicalItems = isPro ? filteredData.slice(3) : filteredData;
  const handleSelectTrade = (trade) => {
    const original = allTrades.find((t2) => t2.id === trade.id);
    if (original) {
      setSelectedTrade(original);
      setIsModalOpen(true);
    }
  };
  const handleUpgrade = () => {
    if (!isAuthenticated) {
      navigate2("/signup");
    } else {
      navigate2("/premium-checkout");
    }
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTrade(null);
  };
  return /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col h-full overflow-hidden bg-[#050505]", children: [
    /* @__PURE__ */ jsx("style", { children: `
        @keyframes stripe-scroll {
          0% { background-position: 0 0; }
          100% { background-position: 40px 40px; }
        }
        .animate-stripe-scroll {
          animation: stripe-scroll 20s linear infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0a0a0a;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #262626;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #404040;
        }
      ` }),
    /* @__PURE__ */ jsxs("div", { className: "p-6 border-b border-neutral-900", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-light text-neutral-200 tracking-tight flex items-center gap-3", children: [
            t.header,
            !isPro && /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 rounded text-[10px] font-bold bg-amber-900/20 text-amber-500 border border-amber-900/30 uppercase tracking-wider shadow-[0_0_10px_rgba(245,158,11,0.2)] whitespace-nowrap", children: t.delayedBadge })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-neutral-600 mt-1 mono uppercase tracking-widest flex items-center gap-2", children: isPro ? /* @__PURE__ */ jsxs(Fragment$1, { children: [
            /* @__PURE__ */ jsx(Zap, { size: 10, className: "text-emerald-500" }),
            " ",
            t.realtime,
            isConnected && /* @__PURE__ */ jsx("span", { className: "text-emerald-500", children: "● CONNECTED" })
          ] }) : /* @__PURE__ */ jsxs(Fragment$1, { children: [
            /* @__PURE__ */ jsx(Clock, { size: 10, className: "text-amber-600" }),
            " ",
            t.delayed
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-3 items-center self-end", children: [
          /* @__PURE__ */ jsxs("span", { className: "text-[10px] text-neutral-600 font-mono uppercase tracking-wider", children: [
            language === "ko" ? "업데이트됨" : language === "ja" ? "更新" : language === "zh" ? "更新时间" : "UPDATED",
            ": ",
            (/* @__PURE__ */ new Date()).toLocaleTimeString(language === "ko" ? "ko-KR" : language === "ja" ? "ja-JP" : language === "zh" ? "zh-CN" : "en-US", { hour: "2-digit", minute: "2-digit" })
          ] }),
          /* @__PURE__ */ jsx(CurrencySelector, {}),
          /* @__PURE__ */ jsx(
            "button",
            {
              className: "p-2 border border-neutral-800 text-neutral-500 hover:text-neutral-300 hover:border-neutral-600 transition-colors bg-neutral-900/30",
              onClick: () => refetch(),
              "data-testid": "button-refresh",
              children: /* @__PURE__ */ jsx(Download, { size: 14 })
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row gap-4 items-start md:items-center", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative flex-1 w-full md:max-w-md group", children: [
          /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-neutral-700 group-focus-within:text-neutral-500 transition-colors", size: 14 }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              placeholder: t.query,
              value: searchQuery,
              onChange: (e) => setSearchQuery(e.target.value),
              className: "w-full bg-[#0a0a0a] text-xs text-neutral-300 border border-neutral-800 pl-10 pr-4 py-2.5 focus:outline-none focus:border-neutral-600 font-mono placeholder:text-neutral-800 transition-colors",
              "data-testid": "input-search"
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex bg-[#0a0a0a] border border-neutral-800 p-1 gap-1 w-full md:w-auto overflow-x-auto", children: [
          { key: "All", label: t.filter.all },
          { key: "Buy", label: t.filter.buy },
          { key: "Sell", label: t.filter.sell }
        ].map((f) => /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setFilter(f.key),
            className: `px-4 py-1.5 text-[10px] uppercase tracking-wider font-medium transition-all whitespace-nowrap flex-1 md:flex-none ${filter === f.key && f.key === "All" ? "bg-neutral-800 text-white" : filter === f.key && f.key === "Buy" ? "bg-emerald-900/20 text-emerald-500 border border-emerald-900/30" : filter === f.key && f.key === "Sell" ? "bg-rose-900/20 text-rose-500 border border-rose-900/30" : "text-neutral-600 hover:text-neutral-400"}`,
            "data-testid": `button-filter-${f.key.toLowerCase()}`,
            children: f.label
          },
          f.key
        )) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-y-auto relative custom-scrollbar", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 min-h-full pointer-events-none bg-[linear-gradient(to_right,#121212_1px,transparent_1px),linear-gradient(to_bottom,#121212_1px,transparent_1px)] bg-[size:24px_24px] opacity-20 z-0" }),
      /* @__PURE__ */ jsxs("div", { className: "sticky top-0 bg-[#050505] border-b border-neutral-800 z-30 grid grid-cols-5 md:grid-cols-9 gap-x-3 md:gap-x-6 text-[10px] text-neutral-400 uppercase tracking-widest font-mono px-4 py-3", children: [
        /* @__PURE__ */ jsx("div", { className: "pl-2", children: t.table.ticker }),
        /* @__PURE__ */ jsx("div", { className: "hidden md:block", children: t.table.insider }),
        /* @__PURE__ */ jsx("div", { className: "hidden md:block", children: t.table.relation }),
        /* @__PURE__ */ jsx("div", { className: "text-right", children: t.table.action }),
        /* @__PURE__ */ jsx("div", { className: "text-right hidden md:block", children: t.table.price }),
        /* @__PURE__ */ jsx("div", { className: "text-right hidden md:block", children: t.table.volume }),
        /* @__PURE__ */ jsx("div", { className: "text-right", children: t.table.value }),
        /* @__PURE__ */ jsx("div", { className: "text-right", children: t.table.impact }),
        /* @__PURE__ */ jsx("div", { className: "text-right pr-2", children: t.table.time })
      ] }),
      isLoading && /* @__PURE__ */ jsx("div", { className: "p-8 text-center text-neutral-600 text-sm font-mono", children: "LOADING_TRADE_DATA..." }),
      error && /* @__PURE__ */ jsxs("div", { className: "p-8 text-center", children: [
        /* @__PURE__ */ jsx(AlertTriangle, { className: "mx-auto mb-2 text-red-500", size: 24 }),
        /* @__PURE__ */ jsxs("p", { className: "text-neutral-400 text-sm", children: [
          "ERROR: ",
          error instanceof Error ? error.message : "Unknown error"
        ] })
      ] }),
      !isLoading && !error && isPro && realTimeItems.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "sticky top-[45px] bg-[#050505] border-b border-neutral-800 z-20 px-4 py-2 bg-emerald-900/10 border-b-emerald-900/20 flex justify-between items-center", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Zap, { size: 12, className: "text-emerald-500" }),
            /* @__PURE__ */ jsx("span", { className: "text-[10px] font-mono uppercase tracking-widest text-emerald-500", children: t.realtimeZone })
          ] }),
          /* @__PURE__ */ jsx("span", { className: "text-[8px] text-neutral-600 font-mono", children: "LIVE_STREAM_ACTIVE" })
        ] }),
        realTimeItems.map((trade) => /* @__PURE__ */ jsx(
          TradeRow,
          {
            trade,
            onClick: () => handleSelectTrade(trade),
            tData
          },
          trade.id
        ))
      ] }),
      !isLoading && !error && !isPro && filteredData.length > 0 && /* @__PURE__ */ jsxs("div", { className: "relative border-b border-neutral-800 overflow-hidden", children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            className: "absolute inset-0 pointer-events-none animate-stripe-scroll z-10",
            style: {
              backgroundImage: "repeating-linear-gradient(45deg, transparent 0px, transparent 4px, rgba(245,158,11,0.04) 4px, rgba(245,158,11,0.04) 8px)"
            }
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "sticky top-[45px] h-8 bg-[#050505]/80 backdrop-blur-sm border-b border-amber-900/20 z-30 px-4 flex justify-between items-center", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsx(AlertTriangle, { size: 9, className: "text-amber-600" }),
            /* @__PURE__ */ jsx("span", { className: "text-[8px] font-mono uppercase tracking-[0.2em] text-amber-600", children: t.realtimeZone })
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "text-[7px] text-amber-600/50 font-mono uppercase tracking-[0.25em] flex items-center gap-1", children: [
            /* @__PURE__ */ jsx("span", { className: "text-amber-600/50", children: "●" }),
            t.encryptedForOutsiders
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx("div", { className: "blur-[2px] opacity-25 pointer-events-none select-none", children: filteredData.slice(0, 3).map((trade, idx) => /* @__PURE__ */ jsx("div", { className: "relative h-[52px] border-b border-neutral-800", children: /* @__PURE__ */ jsx(
            TradeRow,
            {
              trade,
              onClick: () => {
              },
              tData
            }
          ) }, trade.id)) }),
          [0, 1, 2].map((idx) => /* @__PURE__ */ jsx(
            "div",
            {
              className: "absolute left-0 right-0 h-[52px] flex items-center justify-center pointer-events-none z-20",
              style: { top: `${idx * 52}px` },
              children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-amber-600/60 px-3 py-1.5 border border-amber-600/20 bg-black/40", children: [
                /* @__PURE__ */ jsx(Lock, { size: 10 }),
                /* @__PURE__ */ jsx("span", { className: "text-[9px] font-mono uppercase tracking-[0.2em]", children: "SIGNAL ENCRYPTED" })
              ] })
            },
            idx
          )),
          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-b from-amber-900/5 via-transparent to-black/30 pointer-events-none z-15" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "h-14 flex items-center justify-center bg-gradient-to-b from-black/20 to-transparent relative z-20", children: /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: handleUpgrade,
            className: "relative px-5 h-8 bg-amber-600 text-black text-[9px] font-bold uppercase tracking-[0.2em] hover:bg-amber-500 transition-all flex items-center gap-1.5 font-mono shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)]",
            "data-testid": "button-upgrade",
            children: [
              /* @__PURE__ */ jsx(Zap, { size: 10, className: "text-black fill-black" }),
              /* @__PURE__ */ jsx("span", { children: t.unlockRealtime })
            ]
          }
        ) })
      ] }),
      !isLoading && !error && historicalItems.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
        isPro && /* @__PURE__ */ jsx("div", { className: "sticky top-[45px] bg-[#050505] border-b border-neutral-800 z-20 px-4 py-2", children: /* @__PURE__ */ jsx("span", { className: "text-[10px] font-mono uppercase tracking-widest text-neutral-600", children: "Historical Records" }) }),
        historicalItems.map((trade) => /* @__PURE__ */ jsx(
          TradeRow,
          {
            trade,
            onClick: () => handleSelectTrade(trade),
            tData
          },
          trade.id
        ))
      ] }),
      !isLoading && !error && filteredData.length === 0 && /* @__PURE__ */ jsx("div", { className: "p-8 text-center text-neutral-600 text-sm font-mono", children: t.noRecords })
    ] }),
    selectedTrade && /* @__PURE__ */ jsx(
      TradeDetailModal,
      {
        trade: selectedTrade,
        isOpen: isModalOpen,
        onClose: handleCloseModal
      }
    )
  ] });
}
function TradeRow({ trade, onClick, tData }) {
  const { language } = useLanguage();
  const { formatCurrency: formatCurrency2 } = useCurrency();
  const isBuy = trade.type === "Buy";
  const typeClass = isBuy ? "text-emerald-500" : "text-rose-500";
  const typeBg = "bg-transparent";
  const typeBorder = isBuy ? "border-emerald-500" : "border-rose-500";
  const dateLocale = language === "ko" ? ko : language === "ja" ? ja : language === "zh" ? zhCN : enUS;
  const timeAgo = formatDistanceToNow(new Date(trade.date), {
    addSuffix: true,
    locale: dateLocale
  });
  const ActionIcon = isBuy ? ArrowUpRight : ArrowDownLeft;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      onClick,
      className: "grid grid-cols-5 md:grid-cols-9 gap-x-3 md:gap-x-6 text-xs border-b border-neutral-900 hover:bg-neutral-900/30 transition-colors cursor-pointer px-4 py-3",
      "data-testid": `trade-row-${trade.ticker}`,
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-0.5", children: [
          /* @__PURE__ */ jsx("span", { className: "font-mono font-semibold text-neutral-200 text-[13px] leading-[18px]", children: trade.ticker }),
          /* @__PURE__ */ jsx("span", { className: "text-neutral-500 text-[11px] leading-none", children: trade.companyName })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "hidden md:flex items-center", children: /* @__PURE__ */ jsx("span", { className: "text-neutral-300 font-mono text-[12px] font-medium truncate", children: trade.insider }) }),
        /* @__PURE__ */ jsx("div", { className: "hidden md:flex items-center", children: /* @__PURE__ */ jsx("span", { className: "text-neutral-400 font-mono text-[12px] font-medium uppercase tracking-wider truncate", children: trade.relation }) }),
        /* @__PURE__ */ jsx("div", { className: "flex items-center justify-end", children: /* @__PURE__ */ jsxs("span", { className: `px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${typeBorder} ${typeClass} ${typeBg} rounded-sm inline-flex items-center gap-1`, children: [
          /* @__PURE__ */ jsx(ActionIcon, { size: 10, className: typeClass }),
          /* @__PURE__ */ jsx("span", { className: "hidden md:inline", children: tData[trade.type] || trade.type })
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "hidden md:flex items-center justify-end", children: /* @__PURE__ */ jsx("span", { className: "text-neutral-400 font-mono", children: formatCurrency2(trade.price) }) }),
        /* @__PURE__ */ jsx("div", { className: "hidden md:flex items-center justify-end", children: /* @__PURE__ */ jsx("span", { className: "text-neutral-400 font-mono", children: formatNumber(trade.shares) }) }),
        /* @__PURE__ */ jsx("div", { className: "flex items-center justify-end", children: /* @__PURE__ */ jsx("span", { className: "text-neutral-300 font-mono", children: formatCurrency2(trade.value) }) }),
        /* @__PURE__ */ jsx("div", { className: "flex items-center justify-end", children: trade.marketCap && trade.marketCap > 0 ? /* @__PURE__ */ jsx("span", { className: "text-neutral-300 font-mono text-[11px]", children: (() => {
          const ratio = trade.value / trade.marketCap * 100;
          if (ratio >= 10) return Math.round(ratio) + "%";
          else if (ratio >= 1) return ratio.toFixed(1) + "%";
          else if (ratio >= 0.01) return ratio.toFixed(2) + "%";
          else if (ratio >= 1e-3) return ratio.toFixed(3) + "%";
          else if (ratio >= 1e-4) return ratio.toFixed(4) + "%";
          else if (ratio >= 1e-5) return ratio.toFixed(5) + "%";
          else if (ratio >= 1e-6) return ratio.toFixed(6) + "%";
          else if (ratio > 0) return ratio.toExponential(2) + "%";
          else return "0%";
        })() }) : /* @__PURE__ */ jsx("span", { className: "text-neutral-600 text-[10px]", children: "-" }) }),
        /* @__PURE__ */ jsx("div", { className: "flex items-center justify-end pr-2", children: /* @__PURE__ */ jsx("span", { className: "text-neutral-500 text-[10px] font-mono", children: timeAgo }) })
      ]
    }
  );
}
function PremiumCheckout() {
  const [selectedPlan, setSelectedPlan] = useState("monthly");
  const [isProcessing, setIsProcessing] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const isSubmittingRef = useRef(false);
  const { toast: toast2 } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { language } = useLanguage();
  const langKey = language.toLowerCase();
  const t = TRANSLATIONS[langKey].upgrade;
  const common = TRANSLATIONS[langKey].common;
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
      price: 14,
      priceId: "price_1SPBb1Q9br8aQ595KTOAcBfO",
      trialDays: 3
    },
    yearly: {
      price: 112,
      priceId: "price_1SPBdLQ9br8aQ595n0dKEOLv",
      trialDays: 7
    }
  };
  const currentPlan = plans[selectedPlan];
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
      return;
    }
    if (!user) {
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
    try {
      const response = await apiRequest("POST", "/api/create-subscription", {
        priceId: currentPlan.priceId
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `서버 오류: ${response.status}`);
      }
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error) {
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
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-[#030303] flex items-center justify-center p-4", children: /* @__PURE__ */ jsxs("div", { className: "bg-[#080808] border border-neutral-800 p-8 max-w-md w-full text-center", children: [
      /* @__PURE__ */ jsx(ShieldCheck, { size: 48, className: "text-neutral-600 mx-auto mb-4" }),
      /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-white mb-2", children: "로그인 필요" }),
      /* @__PURE__ */ jsx("p", { className: "text-neutral-500 text-sm mb-6", children: "구독하려면 먼저 로그인해주세요" }),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setLocation("/login?redirect=/premium-checkout"),
          className: "w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-black font-bold uppercase tracking-widest text-xs transition-all",
          children: "로그인 페이지로 이동"
        }
      )
    ] }) });
  }
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-[60] overflow-y-auto bg-black/95 backdrop-blur-sm", children: /* @__PURE__ */ jsx("div", { className: "flex min-h-screen items-center justify-center p-4 md:p-6 py-10", children: /* @__PURE__ */ jsxs("div", { className: "relative w-full max-w-4xl bg-[#080808] border border-neutral-800 shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden rounded-sm my-auto", children: [
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: () => setLocation("/trades"),
        className: "absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors z-30 p-2 bg-black/50 rounded-full",
        children: /* @__PURE__ */ jsx(X, { size: 20 })
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "p-8 border-b border-neutral-900 text-center bg-[#0a0a0a]", children: [
      /* @__PURE__ */ jsx("div", { className: "flex justify-center mb-4", children: /* @__PURE__ */ jsxs("div", { className: "w-12 h-12 bg-neutral-900 rounded-full flex items-center justify-center border border-neutral-800 relative", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 rounded-full border border-emerald-900 animate-ping opacity-20" }),
        /* @__PURE__ */ jsx(ShieldCheck, { size: 24, className: "text-emerald-500" })
      ] }) }),
      /* @__PURE__ */ jsx("h2", { className: "text-3xl md:text-4xl font-bold text-white tracking-tight uppercase mb-2", children: t.header }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-neutral-500 font-mono", children: t.subHeader })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-center py-6 bg-[#080808]", children: /* @__PURE__ */ jsxs("div", { className: "bg-neutral-900 p-1 flex border border-neutral-800 relative", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setSelectedPlan("monthly"),
          className: `px-8 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${selectedPlan === "monthly" ? "bg-neutral-700 text-white" : "text-neutral-500 hover:text-neutral-300"}`,
          children: t.monthly
        }
      ),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setSelectedPlan("yearly"),
          className: `px-8 py-2.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${selectedPlan === "yearly" ? "bg-emerald-900 text-emerald-100" : "text-neutral-500 hover:text-neutral-300"}`,
          children: [
            t.yearly,
            /* @__PURE__ */ jsx("span", { className: "text-[9px] bg-emerald-500 text-black px-1.5 py-0.5 font-bold uppercase", children: t.save })
          ]
        }
      )
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row border-t border-neutral-900", children: [
      /* @__PURE__ */ jsxs("div", { className: "w-full md:w-1/2 p-8 border-r-0 md:border-r border-b md:border-b-0 border-neutral-900 bg-[#080808]", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-8", children: [
          /* @__PURE__ */ jsxs("div", { className: "text-xs text-neutral-500 uppercase tracking-wider mb-2 font-bold flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Zap, { size: 12, className: "text-emerald-500" }),
            common.tierPro,
            " ",
            t.secData
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-end gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "text-5xl font-black tracking-tighter text-emerald-500", children: selectedPlan === "monthly" ? t.priceMonthly : t.priceYearly }),
            /* @__PURE__ */ jsx("span", { className: "text-neutral-500 text-sm font-mono mb-1", children: selectedPlan === "monthly" ? t.periodMonthly : t.periodYearly })
          ] }),
          selectedPlan === "yearly" && /* @__PURE__ */ jsx("div", { className: "text-[10px] text-neutral-500 mt-2 font-mono border-l-2 border-neutral-800 pl-2", children: "≈ $9/month (Save $56 annually)" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "space-y-4", children: t.features.map((feat, i) => /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 text-sm text-neutral-300 group", children: [
          /* @__PURE__ */ jsx("div", { className: "mt-0.5 w-4 h-4 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center group-hover:border-emerald-800 transition-colors", children: /* @__PURE__ */ jsx(Check, { size: 10, className: "text-emerald-500" }) }),
          /* @__PURE__ */ jsx("span", { className: "text-neutral-400 group-hover:text-neutral-200 transition-colors text-xs leading-relaxed", children: feat })
        ] }, i)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "w-full md:w-1/2 p-8 bg-[#050505] flex flex-col", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-6", children: [
          /* @__PURE__ */ jsx(CreditCard, { size: 16, className: "text-neutral-500" }),
          /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-neutral-300 uppercase tracking-wide", children: showTrialInfo ? t.trial : "즉시 결제" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-neutral-900/30 border border-neutral-800 p-6 rounded-sm mb-6 space-y-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xs", children: [
            /* @__PURE__ */ jsx("span", { className: "text-neutral-500", children: t.secData }),
            /* @__PURE__ */ jsxs("span", { className: "text-white font-bold", children: [
              common.tierPro,
              " (",
              selectedPlan === "monthly" ? t.monthly : t.yearly,
              ")"
            ] })
          ] }),
          showTrialInfo ? /* @__PURE__ */ jsxs(Fragment$1, { children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xs", children: [
              /* @__PURE__ */ jsx("span", { className: "text-neutral-500", children: "Free Trial" }),
              /* @__PURE__ */ jsx("span", { className: "text-emerald-500 font-bold", children: selectedPlan === "monthly" ? t.trial3Badge : t.trial7Badge })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "h-[1px] bg-neutral-800 my-2" }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xs", children: [
              /* @__PURE__ */ jsx("span", { className: "text-neutral-500", children: "After Trial" }),
              /* @__PURE__ */ jsx("span", { className: "text-white font-mono", children: selectedPlan === "monthly" ? t.afterTrial3 : t.afterTrial7 })
            ] })
          ] }) : /* @__PURE__ */ jsxs(Fragment$1, { children: [
            /* @__PURE__ */ jsx("div", { className: "h-[1px] bg-neutral-800 my-2" }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xs", children: [
              /* @__PURE__ */ jsx("span", { className: "text-neutral-500", children: "결제 금액" }),
              /* @__PURE__ */ jsxs("span", { className: "text-white font-mono", children: [
                "$",
                currentPlan.price,
                selectedPlan === "monthly" ? "/월" : "/년"
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "text-[10px] text-amber-500 mt-2", children: "* 무료체험 이미 사용됨 - 즉시 결제가 시작됩니다" })
          ] })
        ] }),
        showTrialInfo && /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 mb-6 p-3 bg-neutral-900/20 border border-neutral-900 rounded", children: [
          /* @__PURE__ */ jsx("div", { className: "mt-0.5", children: /* @__PURE__ */ jsx(
            "input",
            {
              type: "checkbox",
              checked: agreedToTerms,
              onChange: (e) => setAgreedToTerms(e.target.checked),
              className: "accent-emerald-600 bg-neutral-900 border-neutral-700"
            }
          ) }),
          /* @__PURE__ */ jsx("p", { className: "text-[10px] text-neutral-500 leading-relaxed", children: t.terms })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleCheckout,
            disabled: isProcessing || showTrialInfo && !agreedToTerms,
            className: "w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-800 disabled:text-neutral-600 text-black font-bold uppercase tracking-widest text-xs transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] disabled:shadow-none flex items-center justify-center gap-2 mt-auto",
            children: isProcessing ? /* @__PURE__ */ jsxs(Fragment$1, { children: [
              /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }),
              "Processing..."
            ] }) : showTrialInfo ? selectedPlan === "monthly" ? t.trial3 : t.trial7 : "지금 구독하기"
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 flex items-center justify-center gap-2 text-[10px] text-neutral-600", children: [
          /* @__PURE__ */ jsx(Lock, { size: 10 }),
          t.secure
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "bg-[#050505] border-t border-neutral-900 p-3 flex justify-center md:justify-between items-center text-[9px] text-neutral-600 uppercase tracking-wider px-8", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(TrendingUp, { size: 10 }),
      t.secDesc
    ] }) })
  ] }) }) });
}
function SignupPage() {
  const [, navigate2] = useLocation();
  const { login } = useAuth();
  const { language } = useLanguage();
  const langKey = language.toLowerCase();
  const t = TRANSLATIONS[langKey].auth;
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
  const [logs, setLogs] = useState([]);
  const [targets, setTargets] = useState([]);
  const scrollRef = useRef(null);
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
  useEffect(() => {
    const bootSequence = [
      "ESTABLISHING_SEC_UPLINK...",
      "HANDSHAKE_EDGAR_DB: [OK]",
      "LOADING_INSTITUTIONAL_LEDGERS...",
      "FILTERING_10B5-1_PLANS (NOISE_REDUCTION)...",
      "LOADING_INSIDER_PROFILES_V2.4...",
      "QUANT_MODEL_INIT: ALPHA_SCORE",
      "CROSS_REFERENCING_DARK_POOLS...",
      "ENCRYPTING_SESSION_KEYS...",
      "TERMINAL_READY."
    ];
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < bootSequence.length) {
        setLogs((prev) => [...prev, `> ${bootSequence[currentIndex]}`]);
        currentIndex++;
      } else {
        if (Math.random() > 0.7) {
          const commands = [
            "SCANNING_FORM_4: NVDA [CEO_BUY]",
            "DETECTING_CLUSTER_BUYING: BIOTECH_SECTOR",
            "ANALYZING_FILING: 0001193125-24-123456",
            "SENTIMENT_ANALYSIS: BULLISH_DIVERGENCE",
            "WHALE_ALERT: $5.2M PURCHASE DETECTED",
            "UPDATING_REAL_TIME_PRICE_TARGETS..."
          ];
          const cmd = commands[Math.floor(Math.random() * commands.length)];
          setLogs((prev) => {
            const newLogs = [...prev, `> ${cmd}`];
            return newLogs.slice(-8);
          });
        }
      }
    }, 250);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);
  useEffect(() => {
    const spawnInterval = setInterval(() => {
      if (document.hidden) return;
      const id = Date.now();
      const angle = Math.random() * 2 * Math.PI;
      const r = Math.sqrt(Math.random()) * 40;
      const x = 50 + r * Math.cos(angle);
      const y = 50 + r * Math.sin(angle);
      const typeRand = Math.random();
      let type = "neutral";
      let label = "";
      if (typeRand > 0.85) {
        type = "buy";
        label = `CEO BUY +$${(Math.random() * 10).toFixed(1)}M`;
      } else if (typeRand > 0.75) {
        type = "sell";
        label = "WHALE DUMP";
      }
      const newTarget = { id, x, y, type, label };
      setTargets((prev) => [...prev, newTarget]);
      setTimeout(() => {
        setTargets((prev) => prev.filter((t2) => t2.id !== id));
      }, 3e3);
    }, 800);
    return () => clearInterval(spawnInterval);
  }, []);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password || !confirmPassword) {
      setError("All fields are required");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Invalid email address");
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
      setError(err.message || "Signup failed");
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
      if (index < 6) newCode[index] = digit;
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
      setError("Please enter all 6 digits");
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
        setError(data.message || "Verification failed");
      }
    } catch (err) {
      setError(err.message || "Verification failed");
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
        setError(data.message || "Failed to resend code");
      }
    } catch (err) {
      setError(err.message || "Failed to resend code");
    } finally {
      setIsResending(false);
    }
  };
  if (mode === "success") {
    return /* @__PURE__ */ jsx("div", { className: "w-screen h-screen flex items-center justify-center bg-[#030303] text-neutral-300 font-mono", children: /* @__PURE__ */ jsx("div", { className: "bg-[#080808] border border-neutral-800 rounded-sm shadow-[0_0_50px_rgba(0,0,0,0.8)] w-full max-w-md p-6", children: /* @__PURE__ */ jsxs("div", { className: "space-y-6 py-12 text-center", children: [
      /* @__PURE__ */ jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-full bg-emerald-900/50 border border-emerald-900 flex items-center justify-center", children: /* @__PURE__ */ jsx(CheckCircle, { className: "h-8 w-8 text-emerald-500" }) }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-neutral-200 mb-2 uppercase tracking-wide", children: "Verification Complete" }),
        /* @__PURE__ */ jsx("p", { className: "text-neutral-500 text-sm font-mono", children: "Logging you in..." })
      ] })
    ] }) }) });
  }
  if (mode === "verify") {
    return /* @__PURE__ */ jsx("div", { className: "w-screen h-screen flex items-center justify-center bg-[#030303] text-neutral-300 font-mono", children: /* @__PURE__ */ jsxs("div", { className: "bg-[#080808] border border-neutral-800 rounded-sm shadow-[0_0_50px_rgba(0,0,0,0.8)] w-full max-w-md p-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-8", children: [
        /* @__PURE__ */ jsx("div", { className: "inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-900 border border-neutral-800 mb-4", children: /* @__PURE__ */ jsx(Mail, { className: "h-8 w-8 text-emerald-600" }) }),
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold mb-2 text-neutral-200 uppercase tracking-wide", children: "Verify Email" }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-neutral-500 font-mono", children: [
          "Check ",
          /* @__PURE__ */ jsx("strong", { className: "text-neutral-300", children: email }),
          /* @__PURE__ */ jsx("br", {}),
          "Enter 6-digit verification code"
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
            className: "w-12 h-14 text-center text-2xl font-bold font-mono border border-neutral-800 rounded focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-[#0a0a0a] text-neutral-200",
            autoFocus: index === 0
          },
          index
        )) }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "submit",
            className: "w-full bg-emerald-900/20 hover:bg-emerald-900/30 border border-emerald-900/50 text-emerald-500 font-bold uppercase tracking-widest py-3 text-xs transition-all flex items-center justify-center gap-2",
            disabled: isLoading || code.join("").length !== 6,
            children: isLoading ? /* @__PURE__ */ jsxs(Fragment$1, { children: [
              /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }),
              "Verifying..."
            ] }) : "Verify Code"
          }
        ),
        /* @__PURE__ */ jsx("div", { className: "text-center", children: /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: handleResendCode,
            disabled: resendCooldown > 0 || isResending,
            className: "text-sm text-emerald-600 hover:text-emerald-500 font-medium disabled:text-neutral-600 disabled:cursor-not-allowed font-mono",
            children: isResending ? /* @__PURE__ */ jsxs(Fragment$1, { children: [
              /* @__PURE__ */ jsx(Loader2, { className: "inline h-3 w-3 animate-spin mr-1" }),
              "Resending..."
            ] }) : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"
          }
        ) }),
        /* @__PURE__ */ jsx("div", { className: "text-center pt-4 border-t border-neutral-800", children: /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => setMode("signup"),
            className: "text-sm text-neutral-500 hover:text-neutral-300 inline-flex items-center gap-1 font-mono",
            children: [
              /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
              "Back to Signup"
            ]
          }
        ) })
      ] })
    ] }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "w-screen h-screen flex bg-[#030303] text-neutral-300 overflow-hidden font-mono selection:bg-emerald-900 selection:text-emerald-50", children: [
    /* @__PURE__ */ jsx("style", { children: `
        @keyframes radar-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        @keyframes blip {
            0% { transform: scale(0); opacity: 0; }
            50% { transform: scale(1.5); opacity: 1; }
            100% { transform: scale(1); opacity: 0; }
        }
        @keyframes lock-on {
            0% { width: 40px; height: 40px; opacity: 0; transform: scale(1.5); }
            20% { opacity: 1; }
            100% { width: 24px; height: 24px; opacity: 1; transform: scale(1); }
        }
        @keyframes scan-bar {
            0% { left: -50%; }
            100% { left: 150%; }
        }
        @keyframes fade-in {
            0% { opacity: 0; transform: translateY(5px); }
            100% { opacity: 1; transform: translateY(0); }
        }
      ` }),
    /* @__PURE__ */ jsxs("div", { className: "hidden lg:flex w-2/3 relative flex-col justify-between p-16 bg-[#020202] border-r border-neutral-900 overflow-hidden", children: [
      /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 pointer-events-none z-0", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[linear-gradient(to_right,#121212_1px,transparent_1px),linear-gradient(to_bottom,#121212_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" }),
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-radial-gradient(circle at 30% 50%, #05966908 0%, transparent 50%)" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "relative z-10", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex gap-1", children: [
            /* @__PURE__ */ jsx("div", { className: "w-1 h-4 bg-emerald-600" }),
            /* @__PURE__ */ jsx("div", { className: "w-1 h-4 bg-emerald-800/50" }),
            /* @__PURE__ */ jsx("div", { className: "w-1 h-4 bg-emerald-900/30" })
          ] }),
          /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold tracking-[0.3em] text-emerald-500 uppercase animate-pulse", children: "DETECTING_SMART_MONEY_FLOW" })
        ] }),
        /* @__PURE__ */ jsxs("h1", { className: "text-6xl font-black tracking-tighter text-white mb-2 uppercase leading-none", children: [
          "Insider",
          /* @__PURE__ */ jsx("span", { className: "text-neutral-700", children: "Pulse" })
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-neutral-500 text-xs tracking-widest uppercase mt-2 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Database, { size: 12 }),
          "SEC Form 4 Intelligence Platform"
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "relative z-10 flex-1 flex items-center justify-center", children: /* @__PURE__ */ jsxs("div", { className: "relative w-[500px] h-[500px] flex items-center justify-center", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 border border-neutral-800/30 rounded-full" }),
        /* @__PURE__ */ jsx("div", { className: "absolute inset-[15%] border border-neutral-800/50 rounded-full border-dashed opacity-50" }),
        /* @__PURE__ */ jsx("div", { className: "absolute inset-[35%] border border-neutral-800 rounded-full" }),
        /* @__PURE__ */ jsx("div", { className: "absolute inset-[48%] border border-emerald-900/30 rounded-full" }),
        /* @__PURE__ */ jsx("div", { className: "absolute w-full h-[1px] bg-neutral-900" }),
        /* @__PURE__ */ jsx("div", { className: "absolute h-full w-[1px] bg-neutral-900" }),
        /* @__PURE__ */ jsx("div", { className: "absolute w-full h-full rounded-full animate-[radar-spin_4s_linear_infinite] origin-center bg-[conic-gradient(from_0deg,transparent_0deg,transparent_270deg,rgba(16,185,129,0.1)_360deg)]" }),
        /* @__PURE__ */ jsx("div", { className: "absolute w-12 h-12 bg-[#050505] border border-emerald-900/50 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.2)] z-20", children: /* @__PURE__ */ jsx(Target, { size: 20, className: "text-emerald-600 animate-pulse" }) }),
        targets.map((target) => /* @__PURE__ */ jsxs(
          "div",
          {
            className: "absolute w-0 h-0 flex items-center justify-center",
            style: { left: `${target.x}%`, top: `${target.y}%` },
            children: [
              target.type === "buy" && /* @__PURE__ */ jsxs(Fragment$1, { children: [
                /* @__PURE__ */ jsx("div", { className: "absolute border-2 border-emerald-500/50 rounded-sm animate-[lock-on_0.5s_forwards]" }),
                /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_10px_#10b981] animate-[pulse_1s_infinite]" }),
                target.label && /* @__PURE__ */ jsx("div", { className: "absolute left-4 top-0 bg-emerald-900/90 text-[9px] text-emerald-100 px-2 py-0.5 rounded backdrop-blur-md whitespace-nowrap border border-emerald-500/30 animate-[fade-in_0.3s_ease-out]", children: target.label }),
                /* @__PURE__ */ jsx("div", { className: "absolute h-[1px] w-16 bg-emerald-800/50 rotate-45 origin-top-left top-0 left-0 -z-10 opacity-50" })
              ] }),
              target.type === "sell" && /* @__PURE__ */ jsxs(Fragment$1, { children: [
                /* @__PURE__ */ jsx("div", { className: "w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_15px_#f43f5e]" }),
                /* @__PURE__ */ jsx("div", { className: "absolute w-8 h-8 border border-rose-900/50 rounded-full animate-[ping_1.5s_infinite]" }),
                target.label && /* @__PURE__ */ jsx("div", { className: "absolute right-4 top-0 bg-rose-900/90 text-[9px] text-rose-100 px-2 py-0.5 rounded backdrop-blur-md whitespace-nowrap border border-rose-500/30 animate-[fade-in_0.3s_ease-out]", children: target.label })
              ] }),
              target.type === "neutral" && /* @__PURE__ */ jsx("div", { className: "w-1 h-1 bg-neutral-600 rounded-full animate-pulse opacity-50" })
            ]
          },
          target.id
        )),
        /* @__PURE__ */ jsxs("div", { className: "absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 w-full", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-[9px] text-emerald-500 tracking-[0.2em] uppercase font-bold", children: [
            /* @__PURE__ */ jsx(Activity, { size: 12, className: "animate-bounce" }),
            "Tracking Signals"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "w-32 h-0.5 bg-neutral-800 overflow-hidden rounded-full relative", children: /* @__PURE__ */ jsx("div", { className: "absolute top-0 h-full bg-emerald-500 w-16 animate-[scan-bar_2s_linear_infinite] shadow-[0_0_8px_#10b981] opacity-80" }) })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "relative z-10 bg-black/50 border-t border-neutral-900 backdrop-blur-sm pt-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-[10px] text-neutral-500 uppercase tracking-wider", children: [
            /* @__PURE__ */ jsx(Scan, { size: 12 }),
            /* @__PURE__ */ jsx("span", { children: "System Log" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-[10px] text-emerald-700 animate-pulse", children: [
            /* @__PURE__ */ jsx(Crosshair, { size: 12 }),
            /* @__PURE__ */ jsx("span", { children: "LIVE FEED" })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { ref: scrollRef, className: "h-24 overflow-hidden font-mono text-[10px] space-y-1.5 opacity-80", children: logs.map((log, i) => /* @__PURE__ */ jsxs("div", { className: "text-neutral-400 truncate border-l border-neutral-800 pl-2", children: [
          /* @__PURE__ */ jsx("span", { className: "text-neutral-600 mr-2", children: ((/* @__PURE__ */ new Date()).getTime() + i).toString().slice(-6) }),
          log
        ] }, i)) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "w-full lg:w-1/3 flex items-center justify-center bg-[#050505] relative z-20 border-l border-neutral-900", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute top-8 left-8 lg:hidden", children: /* @__PURE__ */ jsx("span", { className: "font-bold text-white tracking-tight text-lg", children: "INSIDERPULSE" }) }),
      /* @__PURE__ */ jsxs("div", { className: "w-full max-w-sm px-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-10 text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "w-16 h-16 mx-auto bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(0,0,0,0.5)]", children: /* @__PURE__ */ jsx(Lock, { size: 24, className: "text-emerald-600" }) }),
          /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-white mb-2 tracking-tight uppercase", children: t.createAccount }),
          /* @__PURE__ */ jsx("p", { className: "text-neutral-500 text-xs font-mono leading-relaxed max-w-[240px] mx-auto", children: "Initialize new institutional account." })
        ] }),
        error && /* @__PURE__ */ jsxs(Alert, { variant: "destructive", className: "mb-4", children: [
          /* @__PURE__ */ jsx(AlertCircle, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsx(AlertDescription, { children: error })
        ] }),
        /* @__PURE__ */ jsxs("form", { className: "space-y-6", onSubmit: handleSubmit, children: [
          /* @__PURE__ */ jsx("div", { className: "group", children: /* @__PURE__ */ jsxs("div", { className: "relative flex items-center", children: [
            /* @__PURE__ */ jsx(Globe, { size: 14, className: "absolute left-3 text-neutral-600 group-focus-within:text-emerald-500 transition-colors" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "email",
                className: "block w-full bg-[#0a0a0a] border border-neutral-800 rounded text-sm text-neutral-200 pl-10 pr-4 py-3 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20 transition-all placeholder-neutral-700 font-mono",
                placeholder: "ENTER_EMAIL_ADDRESS",
                id: "email",
                value: email,
                onChange: (e) => setEmail(e.target.value),
                disabled: isLoading,
                "data-testid": "input-email"
              }
            )
          ] }) }),
          /* @__PURE__ */ jsx("div", { className: "group", children: /* @__PURE__ */ jsxs("div", { className: "relative flex items-center", children: [
            /* @__PURE__ */ jsx(Lock, { size: 14, className: "absolute left-3 text-neutral-600 group-focus-within:text-emerald-500 transition-colors" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "password",
                className: "block w-full bg-[#0a0a0a] border border-neutral-800 rounded text-sm text-neutral-200 pl-10 pr-4 py-3 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20 transition-all placeholder-neutral-700 font-mono",
                placeholder: "ENTER_PASSWORD",
                id: "password",
                value: password,
                onChange: (e) => setPassword(e.target.value),
                disabled: isLoading,
                "data-testid": "input-password"
              }
            )
          ] }) }),
          /* @__PURE__ */ jsx("div", { className: "group", children: /* @__PURE__ */ jsxs("div", { className: "relative flex items-center", children: [
            /* @__PURE__ */ jsx(Fingerprint, { size: 14, className: "absolute left-3 text-neutral-600 group-focus-within:text-emerald-500 transition-colors" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "password",
                className: "block w-full bg-[#0a0a0a] border border-neutral-800 rounded text-sm text-neutral-200 pl-10 pr-4 py-3 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20 transition-all placeholder-neutral-700 font-mono",
                placeholder: "CONFIRM_CREDENTIALS",
                id: "confirm",
                value: confirmPassword,
                onChange: (e) => setConfirmPassword(e.target.value),
                disabled: isLoading,
                "data-testid": "input-confirm-password"
              }
            )
          ] }) }),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "submit",
              className: "w-full bg-emerald-900/20 hover:bg-emerald-900/30 border border-emerald-900/50 text-emerald-500 font-bold uppercase tracking-widest py-4 text-xs transition-all flex items-center justify-center gap-2 mt-4 group shadow-[0_0_15px_rgba(16,185,129,0.1)]",
              disabled: isLoading,
              "data-testid": "button-signup",
              children: isLoading ? /* @__PURE__ */ jsxs(Fragment$1, { children: [
                /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }),
                "CREATING..."
              ] }) : /* @__PURE__ */ jsxs(Fragment$1, { children: [
                /* @__PURE__ */ jsx("span", { children: t.register }),
                /* @__PURE__ */ jsx(ArrowRight, { size: 14, className: "group-hover:translate-x-1 transition-transform" })
              ] })
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-10 flex justify-between items-center border-t border-neutral-900 pt-6", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => navigate2("/login"),
              className: "text-[10px] text-neutral-500 hover:text-neutral-300 transition-colors uppercase tracking-wider font-bold",
              "data-testid": "button-login",
              children: t.hasAccount
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-neutral-700", children: [
            /* @__PURE__ */ jsx(ShieldCheck, { size: 12 }),
            /* @__PURE__ */ jsx("span", { className: "text-[9px] font-mono", children: "AES-256 ENCRYPTION" })
          ] })
        ] })
      ] })
    ] })
  ] });
}
function LoginPage() {
  const [, navigate2] = useLocation();
  const { login } = useAuth();
  const { language } = useLanguage();
  const langKey = language.toLowerCase();
  const t = TRANSLATIONS[langKey].auth;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [logs, setLogs] = useState([]);
  const [targets, setTargets] = useState([]);
  const scrollRef = useRef(null);
  useEffect(() => {
    const bootSequence = [
      "ESTABLISHING_SEC_UPLINK...",
      "HANDSHAKE_EDGAR_DB: [OK]",
      "LOADING_INSTITUTIONAL_LEDGERS...",
      "FILTERING_10B5-1_PLANS (NOISE_REDUCTION)...",
      "LOADING_INSIDER_PROFILES_V2.4...",
      "QUANT_MODEL_INIT: ALPHA_SCORE",
      "CROSS_REFERENCING_DARK_POOLS...",
      "ENCRYPTING_SESSION_KEYS...",
      "TERMINAL_READY."
    ];
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < bootSequence.length) {
        setLogs((prev) => [...prev, `> ${bootSequence[currentIndex]}`]);
        currentIndex++;
      } else {
        if (Math.random() > 0.7) {
          const commands = [
            "SCANNING_FORM_4: NVDA [CEO_BUY]",
            "DETECTING_CLUSTER_BUYING: BIOTECH_SECTOR",
            "ANALYZING_FILING: 0001193125-24-123456",
            "SENTIMENT_ANALYSIS: BULLISH_DIVERGENCE",
            "WHALE_ALERT: $5.2M PURCHASE DETECTED",
            "UPDATING_REAL_TIME_PRICE_TARGETS..."
          ];
          const cmd = commands[Math.floor(Math.random() * commands.length)];
          setLogs((prev) => {
            const newLogs = [...prev, `> ${cmd}`];
            return newLogs.slice(-8);
          });
        }
      }
    }, 250);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);
  useEffect(() => {
    const spawnInterval = setInterval(() => {
      if (document.hidden) return;
      const id = Date.now();
      const angle = Math.random() * 2 * Math.PI;
      const r = Math.sqrt(Math.random()) * 40;
      const x = 50 + r * Math.cos(angle);
      const y = 50 + r * Math.sin(angle);
      const typeRand = Math.random();
      let type = "neutral";
      let label = "";
      if (typeRand > 0.85) {
        type = "buy";
        label = `CEO BUY +$${(Math.random() * 10).toFixed(1)}M`;
      } else if (typeRand > 0.75) {
        type = "sell";
        label = "WHALE DUMP";
      }
      const newTarget = { id, x, y, type, label };
      setTargets((prev) => [...prev, newTarget]);
      setTimeout(() => {
        setTargets((prev) => prev.filter((t2) => t2.id !== id));
      }, 3e3);
    }, 800);
    return () => clearInterval(spawnInterval);
  }, []);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }
    setIsLoading(true);
    try {
      const response = await apiClient.login(email, password);
      if (response.success && response.user && response.token) {
        login(response.user, response.token);
        navigate2("/trades");
      } else {
        setError(response.message || "Login failed");
      }
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "w-screen h-screen flex bg-[#030303] text-neutral-300 overflow-hidden font-mono selection:bg-emerald-900 selection:text-emerald-50", children: [
    /* @__PURE__ */ jsx("style", { children: `
        @keyframes radar-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        @keyframes blip {
            0% { transform: scale(0); opacity: 0; }
            50% { transform: scale(1.5); opacity: 1; }
            100% { transform: scale(1); opacity: 0; }
        }
        @keyframes lock-on {
            0% { width: 40px; height: 40px; opacity: 0; transform: scale(1.5); }
            20% { opacity: 1; }
            100% { width: 24px; height: 24px; opacity: 1; transform: scale(1); }
        }
        @keyframes scan-bar {
            0% { left: -50%; }
            100% { left: 150%; }
        }
        @keyframes fade-in {
            0% { opacity: 0; transform: translateY(5px); }
            100% { opacity: 1; transform: translateY(0); }
        }
      ` }),
    /* @__PURE__ */ jsxs("div", { className: "hidden lg:flex w-2/3 relative flex-col justify-between p-16 bg-[#020202] border-r border-neutral-900 overflow-hidden", children: [
      /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 pointer-events-none z-0", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[linear-gradient(to_right,#121212_1px,transparent_1px),linear-gradient(to_bottom,#121212_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" }),
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-radial-gradient(circle at 30% 50%, #05966908 0%, transparent 50%)" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "relative z-10", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex gap-1", children: [
            /* @__PURE__ */ jsx("div", { className: "w-1 h-4 bg-emerald-600" }),
            /* @__PURE__ */ jsx("div", { className: "w-1 h-4 bg-emerald-800/50" }),
            /* @__PURE__ */ jsx("div", { className: "w-1 h-4 bg-emerald-900/30" })
          ] }),
          /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold tracking-[0.3em] text-emerald-500 uppercase animate-pulse", children: "DETECTING_SMART_MONEY_FLOW" })
        ] }),
        /* @__PURE__ */ jsxs("h1", { className: "text-6xl font-black tracking-tighter text-white mb-2 uppercase leading-none", children: [
          "Insider",
          /* @__PURE__ */ jsx("span", { className: "text-neutral-700", children: "Pulse" })
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-neutral-500 text-xs tracking-widest uppercase mt-2 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Database, { size: 12 }),
          "SEC Form 4 Intelligence Platform"
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "relative z-10 flex-1 flex items-center justify-center", children: /* @__PURE__ */ jsxs("div", { className: "relative w-[500px] h-[500px] flex items-center justify-center", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 border border-neutral-800/30 rounded-full" }),
        /* @__PURE__ */ jsx("div", { className: "absolute inset-[15%] border border-neutral-800/50 rounded-full border-dashed opacity-50" }),
        /* @__PURE__ */ jsx("div", { className: "absolute inset-[35%] border border-neutral-800 rounded-full" }),
        /* @__PURE__ */ jsx("div", { className: "absolute inset-[48%] border border-emerald-900/30 rounded-full" }),
        /* @__PURE__ */ jsx("div", { className: "absolute w-full h-[1px] bg-neutral-900" }),
        /* @__PURE__ */ jsx("div", { className: "absolute h-full w-[1px] bg-neutral-900" }),
        /* @__PURE__ */ jsx("div", { className: "absolute w-full h-full rounded-full animate-[radar-spin_4s_linear_infinite] origin-center bg-[conic-gradient(from_0deg,transparent_0deg,transparent_270deg,rgba(16,185,129,0.1)_360deg)]" }),
        /* @__PURE__ */ jsx("div", { className: "absolute w-12 h-12 bg-[#050505] border border-emerald-900/50 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.2)] z-20", children: /* @__PURE__ */ jsx(Target, { size: 20, className: "text-emerald-600 animate-pulse" }) }),
        targets.map((target) => /* @__PURE__ */ jsxs(
          "div",
          {
            className: "absolute w-0 h-0 flex items-center justify-center",
            style: { left: `${target.x}%`, top: `${target.y}%` },
            children: [
              target.type === "buy" && /* @__PURE__ */ jsxs(Fragment$1, { children: [
                /* @__PURE__ */ jsx("div", { className: "absolute border-2 border-emerald-500/50 rounded-sm animate-[lock-on_0.5s_forwards]" }),
                /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_10px_#10b981] animate-[pulse_1s_infinite]" }),
                target.label && /* @__PURE__ */ jsx("div", { className: "absolute left-4 top-0 bg-emerald-900/90 text-[9px] text-emerald-100 px-2 py-0.5 rounded backdrop-blur-md whitespace-nowrap border border-emerald-500/30 animate-[fade-in_0.3s_ease-out]", children: target.label }),
                /* @__PURE__ */ jsx("div", { className: "absolute h-[1px] w-16 bg-emerald-800/50 rotate-45 origin-top-left top-0 left-0 -z-10 opacity-50" })
              ] }),
              target.type === "sell" && /* @__PURE__ */ jsxs(Fragment$1, { children: [
                /* @__PURE__ */ jsx("div", { className: "w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_15px_#f43f5e]" }),
                /* @__PURE__ */ jsx("div", { className: "absolute w-8 h-8 border border-rose-900/50 rounded-full animate-[ping_1.5s_infinite]" }),
                target.label && /* @__PURE__ */ jsx("div", { className: "absolute right-4 top-0 bg-rose-900/90 text-[9px] text-rose-100 px-2 py-0.5 rounded backdrop-blur-md whitespace-nowrap border border-rose-500/30 animate-[fade-in_0.3s_ease-out]", children: target.label })
              ] }),
              target.type === "neutral" && /* @__PURE__ */ jsx("div", { className: "w-1 h-1 bg-neutral-600 rounded-full animate-pulse opacity-50" })
            ]
          },
          target.id
        )),
        /* @__PURE__ */ jsxs("div", { className: "absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 w-full", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-[9px] text-emerald-500 tracking-[0.2em] uppercase font-bold", children: [
            /* @__PURE__ */ jsx(Activity, { size: 12, className: "animate-bounce" }),
            "Tracking Signals"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "w-32 h-0.5 bg-neutral-800 overflow-hidden rounded-full relative", children: /* @__PURE__ */ jsx("div", { className: "absolute top-0 h-full bg-emerald-500 w-16 animate-[scan-bar_2s_linear_infinite] shadow-[0_0_8px_#10b981] opacity-80" }) })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "relative z-10 bg-black/50 border-t border-neutral-900 backdrop-blur-sm pt-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-[10px] text-neutral-500 uppercase tracking-wider", children: [
            /* @__PURE__ */ jsx(Scan, { size: 12 }),
            /* @__PURE__ */ jsx("span", { children: "System Log" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-[10px] text-emerald-700 animate-pulse", children: [
            /* @__PURE__ */ jsx(Crosshair, { size: 12 }),
            /* @__PURE__ */ jsx("span", { children: "LIVE FEED" })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { ref: scrollRef, className: "h-24 overflow-hidden font-mono text-[10px] space-y-1.5 opacity-80", children: logs.map((log, i) => /* @__PURE__ */ jsxs("div", { className: "text-neutral-400 truncate border-l border-neutral-800 pl-2", children: [
          /* @__PURE__ */ jsx("span", { className: "text-neutral-600 mr-2", children: ((/* @__PURE__ */ new Date()).getTime() + i).toString().slice(-6) }),
          log
        ] }, i)) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "w-full lg:w-1/3 flex items-center justify-center bg-[#050505] relative z-20 border-l border-neutral-900", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute top-8 left-8 lg:hidden", children: /* @__PURE__ */ jsx("span", { className: "font-bold text-white tracking-tight text-lg", children: "INSIDERPULSE" }) }),
      /* @__PURE__ */ jsxs("div", { className: "w-full max-w-sm px-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-10 text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "w-16 h-16 mx-auto bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(0,0,0,0.5)]", children: /* @__PURE__ */ jsx(Lock, { size: 24, className: "text-emerald-600" }) }),
          /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-white mb-2 tracking-tight uppercase", children: t.welcome }),
          /* @__PURE__ */ jsx("p", { className: "text-neutral-500 text-xs font-mono leading-relaxed max-w-[240px] mx-auto", children: "Please authenticate to access real-time insider trading data streams." })
        ] }),
        error && /* @__PURE__ */ jsxs(Alert, { variant: "destructive", className: "mb-4", children: [
          /* @__PURE__ */ jsx(AlertCircle, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsx(AlertDescription, { children: error })
        ] }),
        /* @__PURE__ */ jsxs("form", { className: "space-y-6", onSubmit: handleSubmit, children: [
          /* @__PURE__ */ jsx("div", { className: "group", children: /* @__PURE__ */ jsxs("div", { className: "relative flex items-center", children: [
            /* @__PURE__ */ jsx(Globe, { size: 14, className: "absolute left-3 text-neutral-600 group-focus-within:text-emerald-500 transition-colors" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "email",
                className: "block w-full bg-[#0a0a0a] border border-neutral-800 rounded text-sm text-neutral-200 pl-10 pr-4 py-3 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20 transition-all placeholder-neutral-700 font-mono",
                placeholder: "ENTER_EMAIL_ADDRESS",
                id: "email",
                value: email,
                onChange: (e) => setEmail(e.target.value),
                disabled: isLoading,
                "data-testid": "input-email"
              }
            )
          ] }) }),
          /* @__PURE__ */ jsx("div", { className: "group", children: /* @__PURE__ */ jsxs("div", { className: "relative flex items-center", children: [
            /* @__PURE__ */ jsx(Lock, { size: 14, className: "absolute left-3 text-neutral-600 group-focus-within:text-emerald-500 transition-colors" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "password",
                className: "block w-full bg-[#0a0a0a] border border-neutral-800 rounded text-sm text-neutral-200 pl-10 pr-4 py-3 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20 transition-all placeholder-neutral-700 font-mono",
                placeholder: "ENTER_PASSWORD",
                id: "password",
                value: password,
                onChange: (e) => setPassword(e.target.value),
                disabled: isLoading,
                "data-testid": "input-password"
              }
            )
          ] }) }),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "submit",
              className: "w-full bg-emerald-900/20 hover:bg-emerald-900/30 border border-emerald-900/50 text-emerald-500 font-bold uppercase tracking-widest py-4 text-xs transition-all flex items-center justify-center gap-2 mt-4 group shadow-[0_0_15px_rgba(16,185,129,0.1)]",
              disabled: isLoading,
              "data-testid": "button-login",
              children: isLoading ? /* @__PURE__ */ jsxs(Fragment$1, { children: [
                /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }),
                "LOGGING IN..."
              ] }) : /* @__PURE__ */ jsxs(Fragment$1, { children: [
                /* @__PURE__ */ jsx("span", { children: t.submit }),
                /* @__PURE__ */ jsx(ArrowRight, { size: 14, className: "group-hover:translate-x-1 transition-transform" })
              ] })
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-10 flex justify-between items-center border-t border-neutral-900 pt-6", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => navigate2("/signup"),
              className: "text-[10px] text-neutral-500 hover:text-neutral-300 transition-colors uppercase tracking-wider font-bold",
              "data-testid": "button-signup",
              children: t.noAccount
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-neutral-700", children: [
            /* @__PURE__ */ jsx(ShieldCheck, { size: 12 }),
            /* @__PURE__ */ jsx("span", { className: "text-[9px] font-mono", children: "AES-256 ENCRYPTION" })
          ] })
        ] })
      ] })
    ] })
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
const TradeLogBackground = () => {
  const trades = [
    { id: 1, ticker: "NVDA", insider: "Jensen Huang", relation: "CEO", type: "Buy", shares: 125e3, value: 154e5 },
    { id: 2, ticker: "TSLA", insider: "Elon Musk", relation: "CEO", type: "Sell", shares: 5e4, value: 875e4 },
    { id: 3, ticker: "PLTR", insider: "Peter Thiel", relation: "10% Owner", type: "Buy", shares: 25e4, value: 103e5 },
    { id: 4, ticker: "AMD", insider: "Lisa Su", relation: "CEO", type: "Buy", shares: 3e4, value: 42e5 },
    { id: 5, ticker: "CRM", insider: "Marc Benioff", relation: "CEO", type: "Buy", shares: 15e3, value: 4477500 },
    { id: 6, ticker: "COIN", insider: "Brian Armstrong", relation: "CEO", type: "Buy", shares: 1e4, value: 2465e3 },
    { id: 7, ticker: "AAPL", insider: "Tim Cook", relation: "CEO", type: "Sell", shares: 75e3, value: 135e5 },
    { id: 8, ticker: "MSFT", insider: "Satya Nadella", relation: "CEO", type: "Buy", shares: 2e4, value: 84e5 },
    { id: 9, ticker: "GOOGL", insider: "Sundar Pichai", relation: "CEO", type: "Buy", shares: 5e3, value: 875e3 },
    { id: 10, ticker: "META", insider: "Mark Zuckerberg", relation: "CEO", type: "Sell", shares: 1e5, value: 5e7 }
  ];
  return /* @__PURE__ */ jsxs("div", { className: "w-full h-full p-8 flex flex-col bg-neutral-950", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-6 flex justify-between items-end border-b border-neutral-800 pb-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-light tracking-wide text-neutral-200 uppercase", children: "Live Insider Feed" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-neutral-500 mt-1 tracking-widest uppercase", children: "Securities & Exchange Commission / Form 4 Stream" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex space-x-4 text-xs text-neutral-600 font-mono", children: [
        /* @__PURE__ */ jsx("span", { children: "LATENCY: 12ms" }),
        /* @__PURE__ */ jsx("span", { children: "BUFFER: 98%" }),
        /* @__PURE__ */ jsx("span", { className: "text-emerald-900 animate-pulse", children: "● LIVE" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-hidden relative", children: [
      /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "text-xs text-neutral-600 uppercase tracking-wider border-b border-neutral-900", children: [
          /* @__PURE__ */ jsx("th", { className: "pb-3 font-medium pl-2", children: "Ticker" }),
          /* @__PURE__ */ jsx("th", { className: "pb-3 font-medium", children: "Insider" }),
          /* @__PURE__ */ jsx("th", { className: "pb-3 font-medium", children: "Relation" }),
          /* @__PURE__ */ jsx("th", { className: "pb-3 font-medium text-right", children: "Type" }),
          /* @__PURE__ */ jsx("th", { className: "pb-3 font-medium text-right", children: "Shares" }),
          /* @__PURE__ */ jsx("th", { className: "pb-3 font-medium text-right", children: "Value" }),
          /* @__PURE__ */ jsx("th", { className: "pb-3 font-medium text-right pr-2", children: "Time" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "font-mono text-sm", children: trades.map((trade, idx) => /* @__PURE__ */ jsxs("tr", { className: `${idx % 2 === 0 ? "bg-neutral-950" : "bg-neutral-900/30"} border-b border-neutral-900/50 hover:bg-neutral-900 transition-colors`, children: [
          /* @__PURE__ */ jsx("td", { className: "py-3 pl-2 font-bold text-neutral-300", children: trade.ticker }),
          /* @__PURE__ */ jsx("td", { className: "py-3 text-neutral-400", children: trade.insider }),
          /* @__PURE__ */ jsx("td", { className: "py-3 text-neutral-500 text-xs", children: trade.relation }),
          /* @__PURE__ */ jsx("td", { className: "py-3 text-right", children: /* @__PURE__ */ jsx("span", { className: `px-2 py-1 rounded text-xs ${trade.type === "Buy" ? "bg-emerald-900/20 text-emerald-500" : "bg-rose-900/20 text-rose-500"}`, children: trade.type }) }),
          /* @__PURE__ */ jsxs("td", { className: "py-3 text-right text-neutral-400", children: [
            (trade.shares / 1e3).toFixed(0),
            "K"
          ] }),
          /* @__PURE__ */ jsxs("td", { className: "py-3 text-right text-neutral-300", children: [
            "$",
            (trade.value / 1e6).toFixed(1),
            "M"
          ] }),
          /* @__PURE__ */ jsx("td", { className: "py-3 text-right text-neutral-600 pr-2 text-xs", children: (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", { hour12: false }) })
        ] }, trade.id)) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-neutral-900/5 to-transparent opacity-20", style: { backgroundSize: "100% 3px" } })
    ] })
  ] });
};
const Form4SummaryBackground = () => {
  const filings = [
    { id: 1, company: "NVIDIA Corp", filer: "Jensen Huang", formType: "4", ownership: "Direct", summary: "Purchase of common stock at market price" },
    { id: 2, company: "Tesla Inc", filer: "Elon Musk", formType: "4", ownership: "Indirect", summary: "Sale of shares through trust" },
    { id: 3, company: "Palantir", filer: "Peter Thiel", formType: "4", ownership: "Direct", summary: "Open market purchase" },
    { id: 4, company: "AMD", filer: "Lisa Su", formType: "4", ownership: "Direct", summary: "Exercise of stock options" },
    { id: 5, company: "Salesforce", filer: "Marc Benioff", formType: "4", ownership: "Direct", summary: "Planned purchase under 10b5-1" },
    { id: 6, company: "Coinbase", filer: "Brian Armstrong", formType: "4", ownership: "Direct", summary: "Acquisition of restricted stock" },
    { id: 7, company: "Apple Inc", filer: "Tim Cook", formType: "4", ownership: "Direct", summary: "Disposition to cover taxes" },
    { id: 8, company: "Microsoft", filer: "Satya Nadella", formType: "4", ownership: "Direct", summary: "Open market acquisition" },
    { id: 9, company: "Alphabet", filer: "Sundar Pichai", formType: "4", ownership: "Indirect", summary: "Gift to family trust" }
  ];
  return /* @__PURE__ */ jsxs("div", { className: "w-full h-full bg-neutral-950 p-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-8 border-b border-neutral-800 pb-4", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold text-neutral-100 tracking-tight", children: "FILING STREAM" }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsx("div", { className: "h-2 w-2 bg-neutral-700 rounded-full" }),
        /* @__PURE__ */ jsx("div", { className: "h-2 w-2 bg-neutral-700 rounded-full" }),
        /* @__PURE__ */ jsx("div", { className: "h-2 w-2 bg-neutral-500 rounded-full animate-pulse" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-[80vh] content-start", children: filings.map((filing) => /* @__PURE__ */ jsxs("div", { className: "bg-neutral-900 border border-neutral-800 p-5 rounded-sm hover:border-neutral-600 transition-colors group", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-4", children: [
        /* @__PURE__ */ jsx("div", { className: "bg-neutral-800 p-2 rounded-md text-neutral-400 group-hover:text-white transition-colors", children: /* @__PURE__ */ jsx(FileText, { size: 18 }) }),
        /* @__PURE__ */ jsx("span", { className: "font-mono text-xs text-neutral-600", children: "12:34:56" })
      ] }),
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-medium text-neutral-200 mb-1", children: filing.company }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-neutral-500 mb-4 uppercase tracking-wide text-xs font-bold", children: filing.filer }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-y-2 text-xs text-neutral-400 border-t border-neutral-800 pt-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
          /* @__PURE__ */ jsx(Hash, { size: 12, className: "text-neutral-600" }),
          /* @__PURE__ */ jsxs("span", { children: [
            "Form ",
            filing.formType
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 justify-end", children: [
          /* @__PURE__ */ jsx(ShieldCheck, { size: 12, className: "text-neutral-600" }),
          /* @__PURE__ */ jsx("span", { children: filing.ownership })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-3 pt-2 border-t border-neutral-800/50", children: /* @__PURE__ */ jsx("p", { className: "text-[10px] text-neutral-600 leading-relaxed", children: filing.summary }) })
    ] }, filing.id)) })
  ] });
};
const EquityChartBackground = () => {
  var _a;
  const data = useMemo(() => {
    let price = 150;
    return Array.from({ length: 100 }).map((_, i) => {
      const volatility = Math.random() * 8 - 4;
      const trend = Math.sin(i * 0.15) * 20;
      const spike = i % 20 === 0 ? (Math.random() - 0.5) * 30 : 0;
      price = Math.max(100, Math.min(220, price + volatility + trend * 0.1 + spike));
      const ma50 = 150 + Math.sin(i * 0.08) * 15 + i * 0.15;
      return {
        time: i,
        price,
        ma50
      };
    });
  }, []);
  const lastPrice = ((_a = data[data.length - 1]) == null ? void 0 : _a.price) || 0;
  return /* @__PURE__ */ jsxs("div", { className: "w-full h-full bg-neutral-950 p-6 flex flex-col relative", children: [
    /* @__PURE__ */ jsx("h2", { className: "text-6xl font-black text-neutral-800 tracking-tighter absolute select-none opacity-20 pointer-events-none left-4 top-4", children: "MARKET" }),
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-2 relative z-10", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-neutral-200", children: "MARKET_AGGREGATE / USD" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-neutral-500 font-mono", children: "1M INTERVAL • REAL-TIME • CROSS-EXCHANGE" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
        /* @__PURE__ */ jsx("div", { className: "text-3xl font-medium text-neutral-200 font-mono", children: lastPrice.toFixed(2) }),
        /* @__PURE__ */ jsx("div", { className: "text-xs text-emerald-500 bg-emerald-900/20 px-2 py-0.5 rounded inline-block font-mono", children: "+0.42%" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 w-full relative mt-6 border border-neutral-800 bg-neutral-900/20 rounded-lg p-4", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 pointer-events-none border-b border-r border-neutral-800/30", style: { backgroundImage: "linear-gradient(to right, #262626 1px, transparent 1px), linear-gradient(to bottom, #262626 1px, transparent 1px)", backgroundSize: "40px 40px", opacity: 0.1 } }),
      /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(ComposedChart, { data, children: [
        /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("linearGradient", { id: "colorPrice", x1: "0", y1: "0", x2: "0", y2: "1", children: [
          /* @__PURE__ */ jsx("stop", { offset: "5%", stopColor: "#525252", stopOpacity: 0.3 }),
          /* @__PURE__ */ jsx("stop", { offset: "95%", stopColor: "#525252", stopOpacity: 0 })
        ] }) }),
        /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#333", vertical: false }),
        /* @__PURE__ */ jsx(XAxis, { dataKey: "time", hide: true }),
        /* @__PURE__ */ jsx(
          YAxis,
          {
            domain: ["auto", "auto"],
            orientation: "right",
            tick: { fill: "#525252", fontSize: 10, fontFamily: "monospace" },
            axisLine: false,
            tickLine: false
          }
        ),
        /* @__PURE__ */ jsx(
          Area,
          {
            type: "monotone",
            dataKey: "price",
            stroke: "#737373",
            fillOpacity: 1,
            fill: "url(#colorPrice)",
            strokeWidth: 2,
            isAnimationActive: false
          }
        ),
        /* @__PURE__ */ jsx(
          Line,
          {
            type: "monotone",
            dataKey: "ma50",
            stroke: "#404040",
            dot: false,
            strokeWidth: 1,
            strokeDasharray: "5 5",
            isAnimationActive: false
          }
        )
      ] }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "h-16 flex mt-4 gap-1", children: Array.from({ length: 40 }).map((_, i) => /* @__PURE__ */ jsx("div", { className: "flex-1 bg-neutral-800/50 rounded-sm h-full flex items-end", children: /* @__PURE__ */ jsx("div", { className: "w-full bg-neutral-600 opacity-40", style: { height: `${Math.random() * 100}%` } }) }, i)) })
  ] });
};
const InstitutionalActivityBackground = () => {
  const holdings = [
    { institution: "Vanguard Group Inc", value: 1562e7, change: 2.4, sentiment: "Bullish" },
    { institution: "BlackRock Inc", value: 1428e7, change: 1.8, sentiment: "Bullish" },
    { institution: "State Street Corp", value: 894e7, change: -0.5, sentiment: "Bearish" },
    { institution: "FMR LLC", value: 672e7, change: 3.1, sentiment: "Bullish" },
    { institution: "Geode Capital", value: 348e7, change: 0.8, sentiment: "Neutral" },
    { institution: "Northern Trust", value: 281e7, change: -0.2, sentiment: "Bearish" }
  ];
  const formatCurrency2 = (value) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    return `$${value.toLocaleString()}`;
  };
  return /* @__PURE__ */ jsxs("div", { className: "w-full h-full bg-neutral-950 p-8 grid grid-rows-[auto_1fr_auto] gap-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "border-b border-neutral-800 pb-4 flex justify-between items-center", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx(Building2, { className: "text-neutral-500", size: 24 }),
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-medium text-neutral-300 uppercase tracking-wider", children: "Dark Pool & Institutional Flow" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
        /* @__PURE__ */ jsx("div", { className: "text-xs text-neutral-600 uppercase", children: "Net Flow (24h)" }),
        /* @__PURE__ */ jsx("div", { className: "text-lg font-mono text-neutral-400", children: "-$142.5M" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-8", children: [
      /* @__PURE__ */ jsx("div", { className: "space-y-2", children: holdings.map((item, idx) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-4 bg-neutral-900/40 border-l-2 border-neutral-800 hover:border-neutral-500 hover:bg-neutral-900 transition-all", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "text-sm font-bold text-neutral-300", children: item.institution }),
          /* @__PURE__ */ jsxs("div", { className: "text-xs text-neutral-500 font-mono mt-1", children: [
            "Pos: ",
            formatCurrency2(item.value)
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
          /* @__PURE__ */ jsxs("div", { className: `flex items-center justify-end gap-1 text-sm font-mono ${item.change > 0 ? "text-neutral-400" : "text-neutral-600"}`, children: [
            item.change > 0 ? /* @__PURE__ */ jsx(TrendingUp, { size: 12 }) : /* @__PURE__ */ jsx(TrendingDown, { size: 12 }),
            Math.abs(item.change).toFixed(2),
            "%"
          ] }),
          /* @__PURE__ */ jsx("div", { className: `text-[10px] uppercase tracking-widest font-bold mt-1 ${item.sentiment === "Bullish" ? "text-emerald-900" : item.sentiment === "Bearish" ? "text-rose-900" : "text-neutral-700"}`, children: item.sentiment })
        ] })
      ] }, idx)) }),
      /* @__PURE__ */ jsxs("div", { className: "bg-neutral-900/20 border border-neutral-900 p-4 flex flex-col", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-xs text-neutral-500 uppercase mb-4", children: "Volume Distribution" }),
        /* @__PURE__ */ jsx("div", { className: "flex-1 min-h-[200px]", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(
          BarChart,
          {
            data: holdings,
            layout: "vertical",
            margin: { left: 80, right: 20, top: 10, bottom: 10 },
            children: [
              /* @__PURE__ */ jsx(XAxis, { type: "number", hide: true, domain: [-3, 4] }),
              /* @__PURE__ */ jsx(
                YAxis,
                {
                  type: "category",
                  dataKey: "institution",
                  tick: { fill: "#525252", fontSize: 9 },
                  axisLine: false,
                  tickLine: false,
                  width: 75
                }
              ),
              /* @__PURE__ */ jsx(ReferenceLine, { x: 0, stroke: "#404040" }),
              /* @__PURE__ */ jsx(Bar, { dataKey: "change", fill: "#525252", radius: [0, 2, 2, 0], children: holdings.map((entry, index) => /* @__PURE__ */ jsx(Cell, { fill: entry.change > 0 ? "#525252" : "#262626" }, `cell-${index}`)) })
            ]
          }
        ) }) })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-4 gap-4 pt-4 border-t border-neutral-800", children: ["BlackRock", "Vanguard", "State Street", "Fidelity"].map((name) => /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsx("div", { className: "text-[10px] text-neutral-600 uppercase", children: name }),
      /* @__PURE__ */ jsx("div", { className: "h-1 w-full bg-neutral-800 mt-2 overflow-hidden rounded-full", children: /* @__PURE__ */ jsx("div", { className: "h-full bg-neutral-600", style: { width: `${Math.random() * 100}%` } }) })
    ] }, name)) })
  ] });
};
function LandingPage() {
  const [, navigate2] = useLocation();
  const { isAuthenticated } = useAuth();
  const [activeIndex, setActiveIndex] = useState(0);
  useEffect(() => {
    if (isAuthenticated) {
      navigate2("/trades");
    }
  }, [isAuthenticated, navigate2]);
  const components = [
    /* @__PURE__ */ jsx(TradeLogBackground, {}, "trade"),
    /* @__PURE__ */ jsx(Form4SummaryBackground, {}, "form4"),
    /* @__PURE__ */ jsx(EquityChartBackground, {}, "chart"),
    /* @__PURE__ */ jsx(InstitutionalActivityBackground, {}, "inst")
  ];
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % components.length);
    }, 1200);
    return () => clearInterval(interval);
  }, [components.length]);
  const handleEnter = () => {
    navigate2("/trades");
  };
  return /* @__PURE__ */ jsxs("div", { className: "relative h-screen w-screen overflow-hidden bg-[#050505] flex items-center justify-center", children: [
    /* @__PURE__ */ jsx("style", { children: `
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        @keyframes noise {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-5%, -5%); }
          20% { transform: translate(-10%, 5%); }
          30% { transform: translate(5%, -10%); }
          40% { transform: translate(-5%, 15%); }
          50% { transform: translate(-10%, 5%); }
          60% { transform: translate(15%, 0); }
          70% { transform: translate(0, 10%); }
          80% { transform: translate(-15%, 0); }
          90% { transform: translate(10%, 5%); }
        }
      ` }),
    /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 z-0 opacity-30 grayscale contrast-125 pointer-events-none overflow-hidden", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 z-20" }),
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 z-30 bg-gradient-to-b from-transparent via-white/5 to-transparent h-1/4 w-full animate-[scanline_4s_linear_infinite]" }),
      components.map((comp, idx) => /* @__PURE__ */ jsx(
        "div",
        {
          className: `absolute inset-0 transition-opacity duration-0 ${activeIndex === idx ? "opacity-100" : "opacity-0"}`,
          children: /* @__PURE__ */ jsx("div", { className: "w-full h-full scale-105", children: comp })
        },
        idx
      ))
    ] }),
    /* @__PURE__ */ jsx("div", { className: "absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,transparent_0%,#050505_90%)]" }),
    /* @__PURE__ */ jsx("div", { className: "absolute inset-0 z-10 bg-black/20" }),
    /* @__PURE__ */ jsxs("div", { className: "relative z-50 flex flex-col items-center", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-[#080808] border border-neutral-800 px-8 py-6 shadow-2xl flex flex-col items-center relative group", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute top-0 left-0 w-full h-[1px] bg-neutral-700/50" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-1 opacity-60", children: [
          /* @__PURE__ */ jsx(Terminal, { size: 14, className: "text-neutral-500" }),
          /* @__PURE__ */ jsx("span", { className: "text-[10px] tracking-[0.4em] text-neutral-500 font-mono uppercase", children: "System Ready" })
        ] }),
        /* @__PURE__ */ jsxs("h1", { className: "text-4xl md:text-6xl font-black text-neutral-200 tracking-tighter uppercase m-0 leading-none select-none", children: [
          "Insider",
          /* @__PURE__ */ jsx("span", { className: "text-neutral-600", children: "Pulse" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "absolute -top-1 -left-1 w-2 h-2 border-t border-l border-neutral-600" }),
        /* @__PURE__ */ jsx("div", { className: "absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-neutral-600" })
      ] }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: handleEnter,
          className: "mt-12 group flex items-center gap-3 text-neutral-500 hover:text-emerald-500 transition-all duration-300",
          children: [
            /* @__PURE__ */ jsx("span", { className: "text-xs font-mono tracking-[0.2em] uppercase border-b border-transparent group-hover:border-emerald-500/50 pb-1", children: "Initialize_System" }),
            /* @__PURE__ */ jsx(ArrowRight, { size: 14, className: "group-hover:translate-x-1 transition-transform duration-300" })
          ]
        }
      )
    ] })
  ] });
}
const AlertDialogPortal = AlertDialogPrimitive.Portal;
const AlertDialogOverlay = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  AlertDialogPrimitive.Overlay,
  {
    className: cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    ),
    ...props,
    ref
  }
));
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName;
const AlertDialogContent = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxs(AlertDialogPortal, { children: [
  /* @__PURE__ */ jsx(AlertDialogOverlay, {}),
  /* @__PURE__ */ jsx(
    AlertDialogPrimitive.Content,
    {
      ref,
      className: cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      ),
      ...props
    }
  )
] }));
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName;
const AlertDialogTitle = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  AlertDialogPrimitive.Title,
  {
    ref,
    className: cn("text-lg font-semibold", className),
    ...props
  }
));
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName;
const AlertDialogDescription = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  AlertDialogPrimitive.Description,
  {
    ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
AlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName;
const AlertDialogAction = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  AlertDialogPrimitive.Action,
  {
    ref,
    className: cn(buttonVariants(), className),
    ...props
  }
));
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName;
const AlertDialogCancel = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  AlertDialogPrimitive.Cancel,
  {
    ref,
    className: cn(
      buttonVariants({ variant: "outline" }),
      "mt-2 sm:mt-0",
      className
    ),
    ...props
  }
));
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName;
var View = /* @__PURE__ */ ((View2) => {
  View2["LIVE_TRADING"] = "LIVE_TRADING";
  View2["TOP_STOCKS"] = "TOP_STOCKS";
  View2["PROFILE"] = "PROFILE";
  View2["SETTINGS"] = "SETTINGS";
  return View2;
})(View || {});
const Sidebar = ({ activeView, onChangeView, lang, isPro, isAuthenticated, onLoginClick, onLogout, onCloseMobile }) => {
  const t = TRANSLATIONS[lang].sidebar;
  const common = TRANSLATIONS[lang].common;
  return /* @__PURE__ */ jsxs("div", { className: "w-64 h-full bg-[#050505] border-r border-neutral-900 flex flex-col", children: [
    /* @__PURE__ */ jsxs("div", { className: "p-6 border-b border-neutral-900 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-xl font-black text-neutral-200 tracking-tighter uppercase", children: [
          "Insider",
          /* @__PURE__ */ jsx("span", { className: "text-neutral-600", children: "Pulse" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 mt-1", children: /* @__PURE__ */ jsx("span", { className: "text-[9px] bg-neutral-900 text-neutral-500 px-1 py-0.5", children: "SIGNAL_PRO_V2.4" }) })
      ] }),
      onCloseMobile && /* @__PURE__ */ jsx("button", { onClick: onCloseMobile, className: "md:hidden text-neutral-600 hover:text-white transition-colors", children: /* @__PURE__ */ jsx(X, { size: 20 }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 px-2 py-6 space-y-1", children: [
      /* @__PURE__ */ jsx("div", { className: "text-[9px] font-bold text-neutral-700 uppercase px-4 mb-2 tracking-widest", children: t.modules }),
      /* @__PURE__ */ jsx(
        NavButton,
        {
          active: activeView === View.LIVE_TRADING,
          onClick: () => onChangeView(View.LIVE_TRADING),
          icon: /* @__PURE__ */ jsx(Activity, { size: 14 }),
          label: t.live
        }
      ),
      /* @__PURE__ */ jsx(
        NavButton,
        {
          active: activeView === View.TOP_STOCKS,
          onClick: () => onChangeView(View.TOP_STOCKS),
          icon: /* @__PURE__ */ jsx(LayoutDashboard, { size: 14 }),
          label: t.analysis
        }
      ),
      /* @__PURE__ */ jsx(
        NavButton,
        {
          active: activeView === View.PROFILE,
          onClick: () => onChangeView(View.PROFILE),
          icon: /* @__PURE__ */ jsx(User, { size: 14 }),
          label: t.config
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "mt-8 text-[9px] font-bold text-neutral-700 uppercase px-4 mb-2 tracking-widest", children: t.watched }),
      /* @__PURE__ */ jsx("div", { className: "px-4 py-4 border border-neutral-900/50 mx-2 bg-neutral-900/20", children: /* @__PURE__ */ jsx("p", { className: "text-[10px] text-neutral-600 mono text-center", children: t.noData }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "p-4 border-t border-neutral-900 bg-[#080808]", children: isAuthenticated ? /* @__PURE__ */ jsxs(Fragment$1, { children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 px-3 py-2 mb-2 border border-neutral-900 bg-[#050505]", children: [
        /* @__PURE__ */ jsx("div", { className: `w-2 h-2 rounded-full ${isPro ? "bg-emerald-900" : "bg-amber-900"}` }),
        /* @__PURE__ */ jsxs("div", { className: "overflow-hidden", children: [
          /* @__PURE__ */ jsx("div", { className: "text-[10px] font-medium text-neutral-400 truncate mono", children: "USER_ID: 7777" }),
          /* @__PURE__ */ jsx("div", { className: `text-[9px] uppercase font-bold ${isPro ? "text-emerald-700" : "text-amber-700"}`, children: isPro ? common.tierPro : common.tierFree })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-2 text-neutral-600 mt-3", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => onChangeView(View.SETTINGS),
            className: `hover:text-neutral-300 transition-colors ${activeView === View.SETTINGS ? "text-white" : ""}`,
            children: /* @__PURE__ */ jsx(Settings, { size: 14 })
          }
        ),
        /* @__PURE__ */ jsx("button", { onClick: onLogout, className: "hover:text-rose-900 transition-colors", children: /* @__PURE__ */ jsx(Power, { size: 14 }) })
      ] })
    ] }) : /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-2", children: [
      /* @__PURE__ */ jsx("div", { className: "text-[10px] font-medium text-neutral-500 mono uppercase", children: "Guest Access" }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: onLoginClick,
          className: "flex items-center gap-2 text-[10px] font-bold text-emerald-500 hover:text-emerald-400 uppercase tracking-wide border border-emerald-900/30 bg-emerald-900/10 px-3 py-1.5 rounded hover:bg-emerald-900/20 transition-colors",
          children: [
            /* @__PURE__ */ jsx(LogIn, { size: 12 }),
            "Login"
          ]
        }
      )
    ] }) })
  ] });
};
const NavButton = ({ active, onClick, icon, label }) => /* @__PURE__ */ jsxs(
  "button",
  {
    onClick,
    className: `w-full flex items-center gap-3 px-4 py-2 text-xs font-medium transition-all border-l-2 ${active ? "bg-neutral-900/50 text-neutral-200 border-neutral-500" : "text-neutral-600 hover:text-neutral-400 border-transparent hover:bg-neutral-900/20"}`,
    children: [
      icon,
      /* @__PURE__ */ jsx("span", { className: "uppercase tracking-wide", children: label })
    ]
  }
);
const ProfileView = ({ lang, onRedeemCoupon }) => {
  const t = TRANSLATIONS[lang].profile;
  const common = TRANSLATIONS[lang].common;
  const { user } = useAuth();
  const [couponCode, setCouponCode] = useState("");
  const [couponStatus, setCouponStatus] = useState("idle");
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const isPro = (user == null ? void 0 : user.subscriptionTier) === "insider_pro" || (user == null ? void 0 : user.subscriptionTier) === "insider";
  const isTrialing = (user == null ? void 0 : user.subscriptionStatus) === "trialing";
  const isActive = (user == null ? void 0 : user.subscriptionStatus) === "active" || (user == null ? void 0 : user.subscriptionStatus) === "trialing";
  const trialEndDate = (user == null ? void 0 : user.trialExpiresAt) ? new Date(user.trialExpiresAt) : null;
  const subscriptionEndDate = (user == null ? void 0 : user.subscriptionEndDate) ? new Date(user.subscriptionEndDate) : null;
  const nextBillingDate = isTrialing ? trialEndDate : subscriptionEndDate;
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0 });
  useEffect(() => {
    if (!nextBillingDate) return;
    const timer = setInterval(() => {
      const now = /* @__PURE__ */ new Date();
      const diffMs = nextBillingDate.getTime() - now.getTime();
      if (diffMs > 0) {
        const hours = Math.floor(diffMs / (1e3 * 60 * 60));
        const minutes = Math.floor(diffMs % (1e3 * 60 * 60) / (1e3 * 60));
        setTimeLeft({ hours, minutes });
      } else {
        setTimeLeft({ hours: 0, minutes: 0 });
      }
    }, 1e3 * 60);
    return () => clearInterval(timer);
  }, [nextBillingDate]);
  const handleRedeem = () => {
    if (!couponCode.trim()) {
      setCouponStatus("error");
      return;
    }
    setCouponStatus("success");
    setCouponCode("");
    if (onRedeemCoupon) onRedeemCoupon();
    setTimeout(() => setCouponStatus("idle"), 3e3);
  };
  const handleManageStripe = async () => {
    if (!(user == null ? void 0 : user.stripeCustomerId)) {
      setCouponStatus("error");
      return;
    }
    setIsLoadingPortal(true);
    try {
      const response = await apiRequest("POST", "/api/create-portal-session", {});
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Failed to create portal session:", error);
      setCouponStatus("error");
    } finally {
      setIsLoadingPortal(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col h-full overflow-hidden bg-[#050505]", children: [
    /* @__PURE__ */ jsxs("div", { className: "p-6 border-b border-neutral-900", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-3xl font-light text-neutral-200 tracking-tight uppercase", children: t.header }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-neutral-600 mt-1 mono uppercase tracking-widest", children: t.subHeader })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-6 custom-scrollbar", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-[#0a0a0a] border border-neutral-900 p-6 rounded-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-6 border-b border-neutral-800 pb-4", children: [
          /* @__PURE__ */ jsx(User, { className: "text-neutral-500", size: 20 }),
          /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold text-neutral-300", children: t.account })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-8", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs text-neutral-600 uppercase tracking-wider mb-1", children: t.email }),
            /* @__PURE__ */ jsx("div", { className: "text-neutral-300 mono font-medium", children: (user == null ? void 0 : user.email) || "N/A" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs text-neutral-600 uppercase tracking-wider mb-1", children: t.joined }),
            /* @__PURE__ */ jsx("div", { className: "text-neutral-300 mono font-medium", children: (user == null ? void 0 : user.createdAt) ? new Date(user.createdAt).toLocaleDateString() : "N/A" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-[#0a0a0a] border border-neutral-900 p-6 rounded-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-6 border-b border-neutral-800 pb-4", children: [
          /* @__PURE__ */ jsx(Crown, { className: "text-neutral-500", size: 20 }),
          /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold text-neutral-300", children: t.subStatus })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-neutral-900/30 border border-neutral-800 p-4 flex justify-between items-center mb-6", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs text-neutral-600 uppercase tracking-wider mb-1", children: t.currentPlan }),
            /* @__PURE__ */ jsxs("div", { className: "text-xl font-bold text-white flex items-center gap-2", children: [
              isPro ? common.tierPro : common.tierFree,
              /* @__PURE__ */ jsx("span", { className: isPro ? "text-emerald-500" : "text-amber-500", children: isPro ? "♛" : "♙" })
            ] })
          ] }),
          /* @__PURE__ */ jsx("span", { className: `px-3 py-1 text-xs font-bold uppercase tracking-wider border rounded-full ${isActive ? "bg-emerald-900/30 text-emerald-500 border-emerald-900/50" : "bg-neutral-800 text-neutral-400 border-neutral-700"}`, children: isActive ? isTrialing ? "TRIALING" : "ACTIVE" : "INACTIVE" })
        ] }),
        isPro && isActive && /* @__PURE__ */ jsxs(Fragment$1, { children: [
          isTrialing && /* @__PURE__ */ jsx("div", { className: "flex justify-end mb-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs text-emerald-500", children: [
            /* @__PURE__ */ jsx(CheckCircle2, { size: 12 }),
            /* @__PURE__ */ jsx("span", { children: "Using free trial" })
          ] }) }),
          nextBillingDate && /* @__PURE__ */ jsxs("div", { className: "bg-neutral-900/50 p-6 rounded text-center border border-neutral-800 relative overflow-hidden group", children: [
            /* @__PURE__ */ jsxs("div", { className: "relative z-10", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-2 text-neutral-500 mb-2", children: [
                /* @__PURE__ */ jsx(Clock, { size: 14 }),
                /* @__PURE__ */ jsx("span", { className: "text-xs uppercase tracking-wider", children: t.nextBilling })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-4xl md:text-5xl font-mono font-bold text-neutral-200 mb-2 transition-all duration-500", children: [
                timeLeft.hours,
                /* @__PURE__ */ jsx("span", { className: "text-neutral-600", children: ":" }),
                timeLeft.minutes.toString().padStart(2, "0"),
                /* @__PURE__ */ jsx("span", { className: "text-sm text-neutral-600 ml-2 self-end mb-2", children: "hours" })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "text-xs text-neutral-600 mono", children: nextBillingDate.toLocaleString() })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 h-1 bg-emerald-900/50 w-full", children: /* @__PURE__ */ jsx("div", { className: "h-full bg-emerald-500/50 w-[80%]" }) })
          ] })
        ] }),
        !isPro && /* @__PURE__ */ jsxs("div", { className: "mt-4 flex justify-center text-[10px] text-neutral-600 items-center gap-1.5", children: [
          /* @__PURE__ */ jsx(AlertCircle, { size: 10, className: "text-amber-600" }),
          /* @__PURE__ */ jsx("span", { children: "Upgrade to activate real-time signals" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-[#0a0a0a] border border-neutral-900 p-6 rounded-sm relative overflow-hidden", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-6 border-b border-neutral-800 pb-4", children: [
          /* @__PURE__ */ jsx(Ticket, { className: "text-neutral-500", size: 20 }),
          /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold text-neutral-300", children: "Redeem Code" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row gap-4", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: couponCode,
              onChange: (e) => setCouponCode(e.target.value.toUpperCase()),
              placeholder: "ENTER COUPON CODE",
              className: "flex-1 bg-[#050505] border border-neutral-800 p-4 text-sm text-neutral-200 focus:outline-none focus:border-emerald-700 font-mono tracking-widest uppercase"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: handleRedeem,
              className: "bg-neutral-100 hover:bg-white text-black px-8 py-4 text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
              disabled: couponStatus === "success",
              children: couponStatus === "success" ? "APPLIED" : "REDEEM"
            }
          )
        ] }),
        couponStatus === "success" && /* @__PURE__ */ jsxs("div", { className: "mt-4 p-3 bg-emerald-900/20 border border-emerald-900/50 text-emerald-500 text-xs font-mono flex items-center gap-2 animate-in fade-in slide-in-from-top-2", children: [
          /* @__PURE__ */ jsx(CheckCircle2, { size: 14 }),
          "SUCCESS: TRIAL EXTENDED BY +72 HOURS"
        ] }),
        couponStatus === "error" && /* @__PURE__ */ jsxs("div", { className: "mt-4 p-3 bg-rose-900/20 border border-rose-900/50 text-rose-500 text-xs font-mono flex items-center gap-2 animate-in fade-in", children: [
          /* @__PURE__ */ jsx(AlertCircle, { size: 14 }),
          "ERROR: INVALID CODE OR INPUT EMPTY"
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-neutral-600 mt-4 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Ticket, { size: 10 }),
          "Enter promotional code to extend your free trial duration."
        ] })
      ] }),
      (user == null ? void 0 : user.stripeCustomerId) && /* @__PURE__ */ jsxs("div", { className: "bg-[#0a0a0a] border border-neutral-900 p-6 rounded-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4 border-b border-neutral-800 pb-4", children: [
          /* @__PURE__ */ jsx(CreditCard, { className: "text-neutral-500", size: 20 }),
          /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold text-neutral-300", children: t.payment })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-neutral-500 mb-6", children: "Secure payment management via Stripe" }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleManageStripe,
            disabled: isLoadingPortal,
            className: "w-full py-3 border border-neutral-800 text-neutral-300 hover:bg-neutral-900 transition-colors text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",
            children: isLoadingPortal ? /* @__PURE__ */ jsxs(Fragment$1, { children: [
              /* @__PURE__ */ jsx("div", { className: "w-3 h-3 border-2 border-neutral-300 border-t-transparent rounded-full animate-spin" }),
              /* @__PURE__ */ jsx("span", { children: "LOADING..." })
            ] }) : /* @__PURE__ */ jsxs(Fragment$1, { children: [
              /* @__PURE__ */ jsx(ExternalLink, { size: 14 }),
              t.stripe
            ] })
          }
        )
      ] })
    ] })
  ] });
};
const SettingsView = ({ lang, setLang }) => {
  const t = TRANSLATIONS[lang].settings;
  const { currency, setCurrency } = useCurrency();
  const languages = [
    { code: "en", label: "English" },
    { code: "ko", label: "한국어" },
    { code: "ja", label: "日本語" },
    { code: "zh", label: "中文" }
  ];
  const currencies = [
    { code: "USD", label: "US Dollar", symbol: "$" },
    { code: "KRW", label: "Korean Won", symbol: "₩" },
    { code: "CNY", label: "Chinese Yuan", symbol: "¥" },
    { code: "JPY", label: "Japanese Yen", symbol: "¥" }
  ];
  return /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col h-full overflow-hidden bg-[#050505]", children: [
    /* @__PURE__ */ jsxs("div", { className: "p-6 border-b border-neutral-900", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-3xl font-light text-neutral-200 tracking-tight uppercase", children: t.header }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-neutral-600 mt-1 mono uppercase tracking-widest", children: t.subHeader })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-[#0a0a0a] border border-neutral-900 p-6 rounded-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
          /* @__PURE__ */ jsx(Globe, { className: "text-neutral-500", size: 18 }),
          /* @__PURE__ */ jsx("h2", { className: "text-base font-bold text-neutral-300", children: t.language })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(
            "select",
            {
              value: lang,
              onChange: (e) => setLang(e.target.value),
              className: "w-full bg-[#050505] border border-neutral-800 text-neutral-300 p-3 text-sm focus:outline-none focus:border-neutral-600 appearance-none",
              children: languages.map((l) => /* @__PURE__ */ jsx("option", { value: l.code, children: l.label }, l.code))
            }
          ),
          /* @__PURE__ */ jsx("div", { className: "absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-600 text-xs", children: "▼" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-[#0a0a0a] border border-neutral-900 p-6 rounded-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
          /* @__PURE__ */ jsx(DollarSign, { className: "text-neutral-500", size: 18 }),
          /* @__PURE__ */ jsx("h2", { className: "text-base font-bold text-neutral-300", children: "Currency" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(
            "select",
            {
              value: currency,
              onChange: (e) => setCurrency(e.target.value),
              className: "w-full bg-[#050505] border border-neutral-800 text-neutral-300 p-3 text-sm focus:outline-none focus:border-neutral-600 appearance-none",
              children: currencies.map((c) => /* @__PURE__ */ jsxs("option", { value: c.code, children: [
                c.symbol,
                " ",
                c.label,
                " (",
                c.code,
                ")"
              ] }, c.code))
            }
          ),
          /* @__PURE__ */ jsx("div", { className: "absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-600 text-xs", children: "▼" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-[#0a0a0a] border border-neutral-900 p-6 rounded-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
          /* @__PURE__ */ jsx(Monitor, { className: "text-neutral-500", size: 18 }),
          /* @__PURE__ */ jsx("h2", { className: "text-base font-bold text-neutral-300", children: t.theme })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(
            "select",
            {
              className: "w-full bg-[#050505] border border-neutral-800 text-neutral-300 p-3 text-sm focus:outline-none focus:border-neutral-600 appearance-none",
              disabled: true,
              children: /* @__PURE__ */ jsx("option", { children: "System Default (Dark)" })
            }
          ),
          /* @__PURE__ */ jsx("div", { className: "absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-600 text-xs", children: "▼" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-[#0a0a0a] border border-neutral-900 p-6 rounded-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-2", children: [
          /* @__PURE__ */ jsx(CreditCard, { className: "text-neutral-500", size: 18 }),
          /* @__PURE__ */ jsx("h2", { className: "text-base font-bold text-neutral-300", children: t.subManage })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-6 text-xs border-b border-neutral-900 pb-4", children: [
          /* @__PURE__ */ jsxs("span", { className: "text-neutral-500", children: [
            "Current Plan: ",
            /* @__PURE__ */ jsx("span", { className: "text-white", children: "Insider Pro" })
          ] }),
          /* @__PURE__ */ jsx("span", { className: "text-emerald-600", children: "● Active" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("button", { className: "flex items-center justify-center gap-2 p-3 border border-neutral-800 hover:bg-neutral-900 text-neutral-300 text-xs uppercase tracking-wide transition-colors", children: [
            /* @__PURE__ */ jsx(CreditCard, { size: 14 }),
            " ",
            t.manage
          ] }),
          /* @__PURE__ */ jsxs("button", { className: "flex items-center justify-center gap-2 p-3 border border-neutral-800 hover:bg-neutral-900 text-neutral-300 text-xs uppercase tracking-wide transition-colors", children: [
            /* @__PURE__ */ jsx(Settings, { size: 14 }),
            " ",
            t.refresh
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 bg-indigo-900/20 border border-indigo-900/50 p-3 flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "w-1 h-1 bg-indigo-400 rounded-full animate-pulse" }),
          /* @__PURE__ */ jsx("p", { className: "text-[10px] text-indigo-200", children: "Tip: If you cancel your subscription, you'll keep access until the end of your billing period." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-[#0a0a0a] border border-neutral-900 p-6 rounded-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
          /* @__PURE__ */ jsx(Bell, { className: "text-neutral-500", size: 18 }),
          /* @__PURE__ */ jsx("h2", { className: "text-base font-bold text-neutral-300", children: t.notifications })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 text-neutral-600 p-4 bg-neutral-900/30 border border-neutral-900/50 border-dashed", children: [
          /* @__PURE__ */ jsx(BellOff, { size: 16 }),
          /* @__PURE__ */ jsx("span", { className: "text-xs", children: t.push })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx("button", { className: "bg-white text-black px-6 py-2 text-xs font-bold uppercase hover:bg-neutral-200 transition-colors", children: t.save }) })
    ] })
  ] });
};
const TopStocks = ({ data, lang, isPro, onUpgrade, onSelectTrade, onViewDetails }) => {
  const { formatCurrency: formatCurrency2 } = useCurrency();
  const t = TRANSLATIONS[lang].top;
  const tData = TRANSLATIONS[lang].data;
  const topTier = data.slice(0, 3);
  const lowerTier = data.slice(3);
  const handleBuyerClick = (stock, buyer) => {
    if (!onSelectTrade) return;
    const trade = {
      id: `generated-${stock.ticker}-${Math.random()}`,
      ticker: stock.ticker,
      companyName: stock.companyName,
      insider: buyer.name,
      relation: buyer.relation,
      type: "Buy",
      // Top stocks usually imply buying/positive signal
      shares: buyer.shares,
      price: buyer.price,
      value: buyer.amount,
      date: buyer.date || (/* @__PURE__ */ new Date()).toISOString(),
      filingDate: buyer.date || (/* @__PURE__ */ new Date()).toISOString(),
      priceChange: buyer.priceChange,
      currentPrice: stock.currentPrice,
      isVerified: true,
      secFilingUrl: buyer.secFilingUrl,
      accessionNumber: buyer.accessionNumber,
      aiScore: 92,
      aiConfidence: 95,
      aiRecommendation: "Strong Buy",
      riskLevel: "Low",
      sentiment: "Bullish",
      summary: "High conviction insider purchase detected aligning with institutional order flow.",
      catalysts: ["Insider Accumulation", "Technical Breakout"],
      timeHorizon: "3-6 Months",
      newsAnalysis: {
        positive: 8,
        negative: 1,
        neutral: 3,
        summary: "Positive sentiment dominance."
      },
      newsItems: [
        { id: "1", title: "Significant Insider Activity Detected", sentiment: "Positive", date: "Today" }
      ],
      targets: {
        conservative: stock.currentPrice * 1.1,
        realistic: stock.currentPrice * 1.3,
        optimistic: stock.currentPrice * 1.6
      }
    };
    onSelectTrade(trade);
  };
  const StockCard = ({ stock }) => /* @__PURE__ */ jsx("div", { className: "bg-[#0a0a0a] border border-neutral-900 p-6 relative overflow-hidden group hover:border-neutral-700 transition-colors", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col lg:flex-row gap-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "w-full lg:w-1/4 border-r-0 lg:border-r border-neutral-900 pr-0 lg:pr-6 pb-6 lg:pb-0 border-b lg:border-b-0", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-baseline gap-3 mb-2", children: [
        /* @__PURE__ */ jsxs("span", { className: `text-4xl font-black select-none ${stock.rank <= 3 ? "text-amber-500" : "text-neutral-800"}`, children: [
          "0",
          stock.rank
        ] }),
        /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-neutral-200 tracking-wide", children: stock.ticker }),
        onViewDetails && /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: (e) => {
              e.stopPropagation();
              onViewDetails(stock);
            },
            className: "ml-3 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] uppercase tracking-wider font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-900/50 hover:shadow-emerald-800/70 hover:scale-105",
            children: [
              /* @__PURE__ */ jsx(Eye, { size: 12 }),
              lang === "ko" ? "자세히 보기" : "View Details"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "text-xs text-neutral-500 uppercase mb-4 tracking-wider", children: stock.companyName }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-y-4 text-[10px] uppercase text-neutral-600", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "mb-1", children: t.signal }),
          /* @__PURE__ */ jsx("div", { className: "text-emerald-600 text-base font-bold", children: t.strongBuy })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "mb-1", children: t.insiders }),
          /* @__PURE__ */ jsxs("div", { className: "text-neutral-300 text-base font-mono", children: [
            stock.insiderCount,
            lang === "ko" ? "명" : ""
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-6 pt-4 border-t border-neutral-900 grid grid-cols-1 gap-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xs", children: [
          /* @__PURE__ */ jsx("span", { className: "text-neutral-600 uppercase", children: t.avgPrice }),
          /* @__PURE__ */ jsx("span", { className: "text-neutral-300 font-mono", children: formatCurrency2(stock.avgBuyPrice) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xs", children: [
          /* @__PURE__ */ jsx("span", { className: "text-neutral-600 uppercase", children: t.curPrice }),
          /* @__PURE__ */ jsx("span", { className: `${stock.priceChange >= 0 ? "text-emerald-600" : "text-rose-600"} font-mono font-bold`, children: formatCurrency2(stock.currentPrice) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xs", children: [
          /* @__PURE__ */ jsx("span", { className: "text-neutral-600 uppercase", children: t.totalVol }),
          /* @__PURE__ */ jsx("span", { className: "text-emerald-600 font-mono", children: formatNumber(stock.totalBuyAmount) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-4 border-b border-neutral-900 pb-2", children: [
        /* @__PURE__ */ jsx(Activity, { className: "text-emerald-700", size: 14 }),
        /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-neutral-400 uppercase tracking-wide", children: t.institutional })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "space-y-2", children: stock.buyers.map((buyer, idx) => /* @__PURE__ */ jsxs(
        "div",
        {
          onClick: () => handleBuyerClick(stock, buyer),
          className: "grid grid-cols-1 md:grid-cols-12 items-center gap-4 p-4 bg-neutral-900/20 border-l-2 border-neutral-800 hover:border-emerald-600 hover:bg-neutral-900/40 transition-all cursor-pointer group/row",
          children: [
            /* @__PURE__ */ jsxs("div", { className: "md:col-span-4 flex flex-col", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("div", { className: "text-sm font-bold text-neutral-300 group-hover/row:text-white transition-colors", children: buyer.name }),
                /* @__PURE__ */ jsx("span", { className: "bg-emerald-900/20 text-emerald-500 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase", children: t.buyOnly })
              ] }),
              /* @__PURE__ */ jsx("span", { className: "text-xs text-neutral-500 mt-1", children: tData[buyer.relation] || buyer.relation })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "md:col-span-3 bg-neutral-900/50 p-2 rounded border border-neutral-800/50", children: [
              /* @__PURE__ */ jsx("div", { className: "text-[9px] text-neutral-500 uppercase mb-0.5", children: t.buyPrice }),
              /* @__PURE__ */ jsx("div", { className: "text-sm text-emerald-400 font-mono font-bold", children: formatCurrency2(buyer.price) }),
              /* @__PURE__ */ jsxs("div", { className: `text-[10px] font-bold mt-1 ${buyer.priceChange >= 0 ? "text-emerald-500" : "text-rose-500"}`, children: [
                buyer.priceChange > 0 ? "↗" : "↘",
                " ",
                buyer.priceChange > 0 ? "+" : "",
                buyer.priceChange,
                "%"
              ] }),
              /* @__PURE__ */ jsx("div", { className: "text-[9px] text-neutral-600 mt-0.5", children: buyer.date })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "md:col-span-2 bg-neutral-900/50 p-2 rounded border border-neutral-800/50 h-full", children: [
              /* @__PURE__ */ jsx("div", { className: "text-[9px] text-neutral-500 uppercase mb-0.5", children: t.shareCount }),
              /* @__PURE__ */ jsx("div", { className: "text-sm text-white font-mono font-bold", children: formatNumber(buyer.shares) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "md:col-span-3 bg-neutral-900/50 p-2 rounded border border-neutral-800/50 h-full", children: [
              /* @__PURE__ */ jsx("div", { className: "text-[9px] text-neutral-500 uppercase mb-0.5", children: t.totalAmount }),
              /* @__PURE__ */ jsx("div", { className: "text-sm text-emerald-500 font-bold font-mono", children: formatCurrency2(buyer.amount) })
            ] })
          ]
        },
        idx
      )) })
    ] })
  ] }) });
  return /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col h-full overflow-hidden bg-[#050505] relative", children: [
    /* @__PURE__ */ jsx("div", { className: "p-6 border-b border-neutral-900 flex justify-between items-end bg-[#050505] z-10 relative", children: /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-light text-neutral-200 tracking-tight uppercase flex items-center gap-3", children: [
        t.header,
        !isPro && /* @__PURE__ */ jsx("div", { className: "bg-amber-900/20 border border-amber-900/50 text-amber-600 p-1 rounded-sm", children: /* @__PURE__ */ jsx(Lock, { size: 14 }) })
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "text-xs text-neutral-600 mt-1 mono uppercase tracking-widest flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Activity, { size: 12 }),
        " ",
        t.subHeader
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-emerald-500 mt-1 font-mono flex items-center gap-1", children: [
        /* @__PURE__ */ jsx("span", { className: "animate-pulse", children: "●" }),
        " ",
        lang === "ko" ? "연결됨" : "CONNECTED"
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-y-auto p-6 relative custom-scrollbar", children: [
      /* @__PURE__ */ jsxs("div", { className: "relative mb-8", children: [
        !isPro && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 z-20 bg-black/5 backdrop-blur-md flex items-center justify-center rounded-sm border border-neutral-800/50", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md w-full bg-[#0a0a0a] border border-neutral-800 p-3 md:p-6 relative text-center shadow-2xl m-3 my-4", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-0 left-0 right-0 h-1 bg-neutral-800", children: /* @__PURE__ */ jsx("div", { className: "h-full w-1/3 bg-amber-600 mx-auto" }) }),
          /* @__PURE__ */ jsxs("div", { className: "mb-3 md:mb-4 mt-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-sm bg-neutral-900 border border-neutral-800 mb-2 md:mb-3", children: [
              /* @__PURE__ */ jsx(ShieldCheck, { size: 20, className: "text-neutral-600 md:hidden" }),
              /* @__PURE__ */ jsx(ShieldCheck, { size: 28, className: "text-neutral-600 hidden md:block" })
            ] }),
            /* @__PURE__ */ jsx("h2", { className: "text-base md:text-lg font-bold text-neutral-200 uppercase tracking-wider mb-1.5", children: t.restricted }),
            /* @__PURE__ */ jsx("div", { className: "inline-block bg-amber-900/10 text-amber-600 border border-amber-900/20 text-[9px] md:text-[10px] font-bold px-2 py-0.5 md:px-3 md:py-1 uppercase tracking-widest", children: t.securityLevel })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "space-y-2 md:space-y-3 mb-3 md:mb-5 border-t border-b border-neutral-900 py-2.5 md:py-4", children: /* @__PURE__ */ jsx("p", { className: "text-[10px] md:text-xs text-neutral-400 font-mono leading-relaxed", children: t.desc }) }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: onUpgrade,
              className: "w-full py-2 md:py-2.5 bg-white hover:bg-neutral-200 text-black font-bold uppercase tracking-widest text-[10px] md:text-xs transition-all flex items-center justify-center gap-2 mb-2.5 md:mb-3",
              children: [
                /* @__PURE__ */ jsx(ScanLine, { size: 12, className: "md:hidden" }),
                /* @__PURE__ */ jsx(ScanLine, { size: 14, className: "hidden md:block" }),
                t.cta
              ]
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-center gap-3 md:gap-4 text-[8px] md:text-[9px] text-neutral-600 font-mono uppercase", children: [
            /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(Lock, { size: 9 }),
              " ",
              t.aes
            ] }),
            /* @__PURE__ */ jsx("span", { children: "•" }),
            /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(EyeOff, { size: 9 }),
              " ",
              t.blind
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: `grid gap-6 ${!isPro ? "opacity-20 pointer-events-none select-none filter blur-sm" : ""}`, children: isPro ? topTier.map((stock) => /* @__PURE__ */ jsx(StockCard, { stock }, stock.ticker)) : topTier.slice(0, 1).map((stock) => /* @__PURE__ */ jsx(StockCard, { stock }, stock.ticker)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2 px-1", children: [
          /* @__PURE__ */ jsx("div", { className: "h-[1px] flex-1 bg-neutral-900" }),
          /* @__PURE__ */ jsx("span", { className: "text-[10px] font-mono text-neutral-600 uppercase", children: "Additional Signals (Public)" }),
          /* @__PURE__ */ jsx("div", { className: "h-[1px] flex-1 bg-neutral-900" })
        ] }),
        lowerTier.map((stock) => /* @__PURE__ */ jsx(StockCard, { stock }, stock.ticker))
      ] })
    ] })
  ] });
};
const analysisCache = /* @__PURE__ */ new Map();
const CACHE_DURATION = 6 * 60 * 60 * 1e3;
function StockSummaryModal({ isOpen, onClose, stock }) {
  var _a;
  const { language } = useLanguage();
  const gradientId = useId();
  const [stockPrice, setStockPrice] = useState(null);
  const [comprehensiveAnalysis, setComprehensiveAnalysis] = useState(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(false);
  useEffect(() => {
    if (!isOpen || !(stock == null ? void 0 : stock.ticker)) {
      setStockPrice(null);
      setComprehensiveAnalysis(null);
      return;
    }
    const fetchStockPrice = async () => {
      try {
        const response = await fetch(`/api/stocks/${stock.ticker}`);
        if (response.ok) {
          const data = await response.json();
          setStockPrice(data);
        }
      } catch (error) {
        console.error("Failed to fetch stock price:", error);
      }
    };
    const fetchAnalysis = async () => {
      const cacheKey = `${stock.ticker}_${language}`;
      const cached = analysisCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log(`✅ Using cached analysis for ${stock.ticker} (${language})`);
        setComprehensiveAnalysis(cached.data);
        return;
      }
      setIsLoadingAnalysis(true);
      try {
        const tradesResponse = await fetch(`/api/trades?ticker=${stock.ticker}&limit=1`);
        if (tradesResponse.ok) {
          const tradesData = await tradesResponse.json();
          if (tradesData.trades && tradesData.trades.length > 0) {
            const tradeId = tradesData.trades[0].id;
            const analysisResponse = await fetch(`/api/trades/${tradeId}/comprehensive-analysis?language=${language}`);
            if (analysisResponse.ok) {
              const analysisData = await analysisResponse.json();
              setComprehensiveAnalysis(analysisData);
              analysisCache.set(cacheKey, {
                data: analysisData,
                timestamp: Date.now()
              });
              console.log(`📦 Cached analysis for ${stock.ticker} (${language})`);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch analysis:", error);
      } finally {
        setIsLoadingAnalysis(false);
      }
    };
    fetchStockPrice();
    fetchAnalysis();
  }, [isOpen, stock == null ? void 0 : stock.ticker, language]);
  const langKey = language.toLowerCase();
  const t = TRANSLATIONS[langKey].modal;
  const tTop = TRANSLATIONS[langKey].top;
  const tData = TRANSLATIONS[langKey].data;
  const stats = useMemo(() => {
    if (!stock) return null;
    const buyers = stock.buyers;
    const totalShares = buyers.reduce((sum, b) => sum + b.shares, 0);
    const totalAmount = buyers.reduce((sum, b) => sum + b.amount, 0);
    const avgPrice = totalAmount / totalShares;
    const validDates = buyers.map((b) => {
      const d = new Date(b.date);
      return isNaN(d.getTime()) ? null : d;
    }).filter((d) => d !== null).sort((a, b) => a.getTime() - b.getTime());
    const firstDate = validDates.length > 0 ? validDates[0] : /* @__PURE__ */ new Date();
    const lastDate = validDates.length > 0 ? validDates[validDates.length - 1] : /* @__PURE__ */ new Date();
    return {
      buyerCount: buyers.length,
      totalShares,
      totalAmount,
      avgPrice,
      firstDate,
      lastDate,
      currentPrice: stock.currentPrice,
      priceChange: stock.priceChange
    };
  }, [stock]);
  const aiAnalysis = useMemo(() => {
    if (!stock || !stats) return null;
    const isManyBuyers = stats.buyerCount >= 3;
    const isLargeAmount = stats.totalAmount > 1e6;
    const isPositiveChange = stats.priceChange > 0;
    let confidence = 50;
    confidence += stats.buyerCount * 8;
    if (isLargeAmount) confidence += 15;
    if (isPositiveChange) confidence += 10;
    confidence = Math.min(95, confidence);
    let insight = "";
    if (langKey === "ko") {
      if (isManyBuyers && isLargeAmount) {
        insight = `${stats.buyerCount}명의 내부자가 동시에 대규모 매수. 강력한 확신 신호.`;
      } else if (isManyBuyers) {
        insight = `${stats.buyerCount}명의 내부자가 동시 매수. 긍정적 전망 공유.`;
      } else {
        insight = "다수 내부자 동시 매수는 회사에 대한 확신을 나타냄.";
      }
    } else {
      if (isManyBuyers && isLargeAmount) {
        insight = `${stats.buyerCount} insiders made large simultaneous buys. Strong conviction.`;
      } else if (isManyBuyers) {
        insight = `${stats.buyerCount} insiders bought simultaneously. Positive outlook.`;
      } else {
        insight = "Multiple insider buys indicate confidence.";
      }
    }
    let baseMedian, baseP75, baseAvg;
    if (stats.buyerCount >= 3) {
      baseMedian = 0.1;
      baseP75 = 0.22;
      baseAvg = 0.36;
    } else if (stats.buyerCount >= 2) {
      baseMedian = 0.03;
      baseP75 = 0.07;
      baseAvg = 0.3;
    } else {
      baseMedian = 0.01;
      baseP75 = 0.05;
      baseAvg = 0.1;
    }
    const investmentBonus = stats.totalAmount >= 5e6 ? 0.03 : stats.totalAmount >= 1e6 ? 0.02 : stats.totalAmount >= 5e5 ? 0.01 : 0;
    const buyers = stock.buyers;
    const hasCEO = buyers.some(
      (b) => {
        var _a2, _b;
        return ((_a2 = b.relation) == null ? void 0 : _a2.toUpperCase().includes("CEO")) || ((_b = b.relation) == null ? void 0 : _b.toUpperCase().includes("CHIEF EXECUTIVE"));
      }
    );
    const hasCFO = buyers.some(
      (b) => {
        var _a2, _b;
        return ((_a2 = b.relation) == null ? void 0 : _a2.toUpperCase().includes("CFO")) || ((_b = b.relation) == null ? void 0 : _b.toUpperCase().includes("CHIEF FINANCIAL"));
      }
    );
    const hasPresident = buyers.some(
      (b) => {
        var _a2;
        return (_a2 = b.relation) == null ? void 0 : _a2.toUpperCase().includes("PRESIDENT");
      }
    );
    let positionBonus = 0;
    if (hasCEO) {
      positionBonus = 0.02;
    } else if (hasPresident) {
      positionBonus = 0.015;
    } else if (hasCFO) {
      positionBonus = 0.01;
    }
    const clusterWithCEOBonus = stats.buyerCount >= 3 && hasCEO ? 0.03 : 0;
    const totalBonus = investmentBonus + positionBonus + clusterWithCEOBonus;
    const adjustedMedian = baseMedian + totalBonus;
    const adjustedP75 = baseP75 + totalBonus * 1.5;
    const adjustedAvg = baseAvg + totalBonus * 2;
    const priceTargets = {
      conservative: stats.avgPrice * (1 + adjustedMedian),
      // Based on median return
      realistic: stats.avgPrice * (1 + adjustedP75),
      // Based on 75th percentile
      optimistic: stats.avgPrice * (1 + adjustedAvg)
      // Based on average (includes outliers)
    };
    return {
      signal: "BUY",
      confidence,
      insight,
      priceTargets,
      riskLevel: isLargeAmount ? t.riskLow : t.riskMedium,
      timeHorizon: isManyBuyers ? langKey === "ko" ? "2-4주" : "2-4 weeks" : langKey === "ko" ? "3-6주" : "3-6 weeks"
    };
  }, [stock, stats, t, langKey]);
  const priceHistory = useMemo(() => {
    if (!stock || !stats) return [];
    const avgDate = new Date((stats.firstDate.getTime() + stats.lastDate.getTime()) / 2);
    const avgPrice = stats.avgPrice;
    const data = [];
    const seed = stock.ticker.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const pseudoRandom = (index) => {
      const x = Math.sin(seed + index) * 1e4;
      return x - Math.floor(x);
    };
    for (let i = -7; i <= 6; i++) {
      const date = new Date(avgDate);
      date.setDate(date.getDate() + i);
      const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
      let marketPrice;
      if (i < 0) {
        marketPrice = avgPrice * (0.95 + pseudoRandom(i + 10) * 0.03);
      } else if (i === 0) {
        marketPrice = avgPrice;
      } else {
        const trend = i * 5e-3;
        marketPrice = avgPrice * (1 + trend + (pseudoRandom(i + 20) * 0.02 - 0.01));
      }
      data.push({
        date: dateStr,
        marketPrice,
        isClusterCenter: i === 0
      });
    }
    return data;
  }, [stock, stats]);
  if (!stock || !stats) return null;
  const currentPrice = (stockPrice == null ? void 0 : stockPrice.currentPrice) || stock.currentPrice;
  const priceChange = (currentPrice - stats.avgPrice) / stats.avgPrice * 100;
  return /* @__PURE__ */ jsx(Dialog, { open: isOpen, onOpenChange: onClose, children: /* @__PURE__ */ jsxs(DialogContent, { className: "w-[95vw] max-w-[95vw] lg:max-w-[1200px] h-[90vh] max-h-[90vh] bg-[#0a0a0a] border-neutral-800 p-0 flex flex-col [&>button]:hidden overflow-hidden", children: [
    /* @__PURE__ */ jsx(VisuallyHidden, { children: /* @__PURE__ */ jsxs(DialogTitle, { children: [
      stock.companyName,
      " - Cluster Buy Summary"
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full overflow-y-auto", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-3 py-2 border-b border-neutral-800 bg-gradient-to-r from-emerald-950/20 to-transparent shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(
              "img",
              {
                src: `https://financialmodelingprep.com/image-stock/${stock.ticker}.png`,
                alt: stock.ticker,
                className: "w-9 h-9 rounded bg-neutral-900 object-contain",
                onError: (e) => {
                  var _a2;
                  e.currentTarget.style.display = "none";
                  (_a2 = e.currentTarget.nextElementSibling) == null ? void 0 : _a2.classList.remove("hidden");
                }
              }
            ),
            /* @__PURE__ */ jsx("div", { className: `w-9 h-9 hidden items-center justify-center rounded border ${stock.rank <= 3 ? "bg-amber-900/30 border-amber-700 text-amber-500" : "bg-neutral-900 border-neutral-700 text-neutral-400"}`, children: /* @__PURE__ */ jsx("span", { className: "font-mono text-xs font-bold", children: stock.ticker.slice(0, 2) }) })
          ] }),
          /* @__PURE__ */ jsx("div", { className: `w-6 h-6 flex items-center justify-center border ${stock.rank <= 3 ? "bg-amber-900/30 border-amber-700 text-amber-500" : "bg-neutral-900 border-neutral-700 text-neutral-400"}`, children: /* @__PURE__ */ jsxs("span", { className: "font-mono text-[10px] font-bold", children: [
            "#",
            stock.rank
          ] }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h2", { className: "text-sm md:text-base text-neutral-200 font-bold tracking-tight", children: stock.ticker }),
            /* @__PURE__ */ jsx("div", { className: "text-[10px] text-neutral-400 truncate max-w-[140px] sm:max-w-[200px]", children: stock.companyName }),
            /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1.5 mt-0.5", children: /* @__PURE__ */ jsx("span", { className: "bg-emerald-900/30 text-emerald-500 text-[7px] px-1 py-0.5 font-bold uppercase", children: langKey === "ko" ? "내부자 동시매수" : "INSIDER BUY" }) })
          ] })
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: onClose, className: "p-1 hover:bg-neutral-900 transition-colors", children: /* @__PURE__ */ jsx(X, { size: 14, className: "text-neutral-500" }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 md:grid-cols-5 border-b border-neutral-800 shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "px-2 py-2 border-r border-neutral-800 bg-emerald-950/10", children: [
          /* @__PURE__ */ jsxs("div", { className: "text-[6px] md:text-[7px] text-neutral-600 uppercase tracking-wider font-mono mb-0.5 flex items-center gap-0.5", children: [
            /* @__PURE__ */ jsx(Users, { size: 7 }),
            langKey === "ko" ? "내부자" : "INSIDERS"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-lg md:text-xl font-bold text-emerald-500", children: [
            stats.buyerCount,
            langKey === "ko" ? "명" : ""
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "px-2 py-2 border-r border-neutral-800", children: [
          /* @__PURE__ */ jsx("div", { className: "text-[6px] md:text-[7px] text-neutral-600 uppercase tracking-wider font-mono mb-0.5", children: langKey === "ko" ? "평균가" : "AVG" }),
          /* @__PURE__ */ jsx("div", { className: "text-base md:text-lg font-light text-neutral-200", children: formatCurrency(stats.avgPrice) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "px-2 py-2 md:border-r border-neutral-800", children: [
          /* @__PURE__ */ jsx("div", { className: "text-[6px] md:text-[7px] text-neutral-600 uppercase tracking-wider font-mono mb-0.5", children: langKey === "ko" ? "현재가" : "NOW" }),
          /* @__PURE__ */ jsx("div", { className: `text-base md:text-lg font-light ${priceChange >= 0 ? "text-emerald-500" : "text-rose-500"}`, children: formatCurrency(currentPrice) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "px-2 py-2 border-r border-t md:border-t-0 border-neutral-800 col-span-1", children: [
          /* @__PURE__ */ jsx("div", { className: "text-[6px] md:text-[7px] text-neutral-600 uppercase tracking-wider font-mono mb-0.5", children: langKey === "ko" ? "총액" : "TOTAL" }),
          /* @__PURE__ */ jsx("div", { className: "text-base md:text-lg font-light text-emerald-500", children: formatCurrency(stats.totalAmount, false) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "px-2 py-2 border-t md:border-t-0 border-neutral-800 col-span-2 md:col-span-1", children: [
          /* @__PURE__ */ jsx("div", { className: "text-[6px] md:text-[7px] text-neutral-600 uppercase tracking-wider font-mono mb-0.5", children: langKey === "ko" ? "수익률" : "RETURN" }),
          /* @__PURE__ */ jsxs("div", { className: `text-base md:text-lg font-bold ${priceChange >= 0 ? "text-emerald-500" : "text-rose-500"}`, children: [
            priceChange >= 0 ? "+" : "",
            priceChange.toFixed(1),
            "%"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "p-2 border-b border-neutral-800 shrink-0", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: 140, children: /* @__PURE__ */ jsxs(ComposedChart, { data: priceHistory, margin: { left: 0, right: 10, top: 15, bottom: 0 }, children: [
        /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("linearGradient", { id: gradientId, x1: "0", y1: "0", x2: "0", y2: "1", children: [
          /* @__PURE__ */ jsx("stop", { offset: "0%", stopColor: "#10b981", stopOpacity: 0.5 }),
          /* @__PURE__ */ jsx("stop", { offset: "100%", stopColor: "#064e3b", stopOpacity: 0.05 })
        ] }) }),
        /* @__PURE__ */ jsx(CartesianGrid, { stroke: "#333", strokeDasharray: "3 3", strokeOpacity: 0.3 }),
        /* @__PURE__ */ jsx(XAxis, { dataKey: "date", stroke: "#444", style: { fontSize: "8px", fontFamily: "monospace" }, tick: { fill: "#525252" } }),
        /* @__PURE__ */ jsx(YAxis, { stroke: "#444", style: { fontSize: "8px", fontFamily: "monospace" }, tick: { fill: "#525252" }, domain: ["auto", "auto"], width: 45 }),
        /* @__PURE__ */ jsx(Tooltip, { contentStyle: { background: "#0a0a0a", border: "1px solid #262626", fontSize: "9px", fontFamily: "monospace", padding: "4px" } }),
        /* @__PURE__ */ jsx(
          ReferenceLine,
          {
            y: stats.avgPrice,
            stroke: "#f59e0b",
            strokeWidth: 2,
            strokeDasharray: "4 2",
            label: {
              value: `${langKey === "ko" ? "평균 매수가" : "AVG BUY"}: $${stats.avgPrice.toFixed(2)}`,
              position: "top",
              fill: "#f59e0b",
              fontSize: 9,
              fontFamily: "monospace",
              fontWeight: "bold"
            }
          }
        ),
        /* @__PURE__ */ jsx(Area, { type: "monotone", dataKey: "marketPrice", fill: `url(#${gradientId})`, fillOpacity: 1, stroke: "none" }),
        /* @__PURE__ */ jsx(Line, { type: "monotone", dataKey: "marketPrice", stroke: "#10b981", strokeWidth: 2, dot: false }),
        /* @__PURE__ */ jsx(ReferenceDot, { x: (_a = priceHistory.find((p) => p.isClusterCenter)) == null ? void 0 : _a.date, y: stats.avgPrice, r: 5, fill: "#f59e0b", stroke: "#0a0a0a", strokeWidth: 2 })
      ] }) }) }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2 p-2 border-b border-neutral-800 shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-emerald-950/30 border border-emerald-900/50 p-2 flex flex-col justify-center", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 mb-1", children: [
            /* @__PURE__ */ jsx(TrendingUp, { size: 10, className: "text-emerald-500" }),
            /* @__PURE__ */ jsx("span", { className: "text-[8px] text-emerald-500/70 uppercase font-mono", children: "Signal" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "text-lg font-bold text-emerald-500", children: tData[comprehensiveAnalysis == null ? void 0 : comprehensiveAnalysis.signal] || (comprehensiveAnalysis == null ? void 0 : comprehensiveAnalysis.signal) || tTop.strongBuy }),
          /* @__PURE__ */ jsxs("div", { className: "text-[8px] text-emerald-500/60 font-mono", children: [
            (comprehensiveAnalysis == null ? void 0 : comprehensiveAnalysis.confidence) || (aiAnalysis == null ? void 0 : aiAnalysis.confidence),
            "% ",
            langKey === "ko" ? "신뢰도" : "conf"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "border border-neutral-800 bg-neutral-950/30 p-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 mb-1", children: [
            /* @__PURE__ */ jsx(Target, { size: 9, className: "text-neutral-500" }),
            /* @__PURE__ */ jsx("span", { className: "text-[8px] text-neutral-500 uppercase font-mono", children: langKey === "ko" ? "목표가" : "Targets" })
          ] }),
          (() => {
            const newsAnalysis = comprehensiveAnalysis == null ? void 0 : comprehensiveAnalysis.newsAnalysis;
            let newsMultiplier = 1;
            if (newsAnalysis && newsAnalysis.totalNews > 0) {
              const positiveRatio = newsAnalysis.positiveCount / newsAnalysis.totalNews;
              const negativeRatio = newsAnalysis.negativeCount / newsAnalysis.totalNews;
              newsMultiplier = 1 + positiveRatio * 0.05 - negativeRatio * 0.03;
            }
            const baseTargets = (aiAnalysis == null ? void 0 : aiAnalysis.priceTargets) || { conservative: 0, realistic: 0, optimistic: 0 };
            const adjustedTargets = {
              conservative: baseTargets.conservative * newsMultiplier,
              realistic: baseTargets.realistic * newsMultiplier,
              optimistic: baseTargets.optimistic * newsMultiplier
            };
            return /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-[9px]", children: [
                /* @__PURE__ */ jsx("span", { className: "text-neutral-600", children: langKey === "ko" ? "보수" : "Low" }),
                /* @__PURE__ */ jsx("span", { className: "text-neutral-400 font-mono", children: formatCurrency(adjustedTargets.conservative) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-[9px]", children: [
                /* @__PURE__ */ jsx("span", { className: "text-emerald-600", children: langKey === "ko" ? "현실" : "Mid" }),
                /* @__PURE__ */ jsx("span", { className: "text-emerald-400 font-mono font-bold", children: formatCurrency(adjustedTargets.realistic) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-[9px]", children: [
                /* @__PURE__ */ jsx("span", { className: "text-amber-600", children: langKey === "ko" ? "낙관" : "High" }),
                /* @__PURE__ */ jsx("span", { className: "text-amber-400 font-mono", children: formatCurrency(adjustedTargets.optimistic) })
              ] })
            ] });
          })()
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "border-b border-neutral-800 bg-gradient-to-r from-purple-950/30 to-neutral-950/30 shrink-0", children: [
        /* @__PURE__ */ jsxs(
          "div",
          {
            className: "px-2 py-2 flex items-center justify-between cursor-pointer hover:bg-purple-950/20 transition-colors",
            onClick: () => !isLoadingAnalysis && setIsAnalysisExpanded(!isAnalysisExpanded),
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsx(Brain, { size: 12, className: "text-purple-400" }),
                /* @__PURE__ */ jsx("span", { className: "text-[9px] font-bold text-purple-400 uppercase tracking-wider", children: langKey === "ko" ? "AI 분석결과" : "AI ANALYSIS" })
              ] }),
              !isLoadingAnalysis && (comprehensiveAnalysis == null ? void 0 : comprehensiveAnalysis.executiveSummary) && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 text-purple-400/60", children: [
                /* @__PURE__ */ jsx("span", { className: "text-[8px] font-mono uppercase", children: isAnalysisExpanded ? langKey === "ko" ? "접기" : "Less" : langKey === "ko" ? "더보기" : "More" }),
                isAnalysisExpanded ? /* @__PURE__ */ jsx(ChevronUp, { size: 10 }) : /* @__PURE__ */ jsx(ChevronDown, { size: 10 })
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsx("div", { className: "px-2 pb-2", children: isLoadingAnalysis ? /* @__PURE__ */ jsxs("div", { className: "pl-5 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("div", { className: "w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" }),
          /* @__PURE__ */ jsx("span", { className: "text-[10px] text-purple-400 font-mono", children: langKey === "ko" ? "AI 분석 중..." : "Analyzing..." })
        ] }) : (comprehensiveAnalysis == null ? void 0 : comprehensiveAnalysis.executiveSummary) ? /* @__PURE__ */ jsx("p", { className: `text-[11px] md:text-xs text-white leading-relaxed pl-5 font-medium ${!isAnalysisExpanded ? "line-clamp-1" : ""}`, children: comprehensiveAnalysis.executiveSummary }) : /* @__PURE__ */ jsx("p", { className: "text-[10px] text-neutral-500 pl-5 italic", children: langKey === "ko" ? "분석 데이터를 불러올 수 없습니다." : "Unable to load analysis data." }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2 p-2 border-b border-neutral-800 shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "border border-neutral-800 bg-neutral-950/30 p-2", children: [
          /* @__PURE__ */ jsx("div", { className: "text-[7px] text-neutral-600 uppercase tracking-wider font-mono mb-1", children: langKey === "ko" ? "위험도" : "RISK" }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 text-emerald-500", children: [
            /* @__PURE__ */ jsx(AlertTriangle, { size: 10 }),
            /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold", children: tData[aiAnalysis == null ? void 0 : aiAnalysis.riskLevel] || (aiAnalysis == null ? void 0 : aiAnalysis.riskLevel) || t.riskLow })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "border border-neutral-800 bg-neutral-950/30 p-2", children: [
          /* @__PURE__ */ jsx("div", { className: "text-[7px] text-neutral-600 uppercase tracking-wider font-mono mb-1", children: langKey === "ko" ? "목표 달성" : "TARGET" }),
          /* @__PURE__ */ jsx("div", { className: "text-[10px] text-neutral-200 font-mono font-bold", children: tData[comprehensiveAnalysis == null ? void 0 : comprehensiveAnalysis.timeHorizon] || tData[aiAnalysis == null ? void 0 : aiAnalysis.timeHorizon] || (comprehensiveAnalysis == null ? void 0 : comprehensiveAnalysis.timeHorizon) || (aiAnalysis == null ? void 0 : aiAnalysis.timeHorizon) || (langKey === "ko" ? "2-4주" : "2-4 weeks") })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-y-auto p-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 mb-2 pb-1.5 border-b border-neutral-800", children: [
          /* @__PURE__ */ jsx(Users, { size: 10, className: "text-emerald-600" }),
          /* @__PURE__ */ jsx("span", { className: "text-[9px] font-bold text-neutral-400 uppercase tracking-wider", children: langKey === "ko" ? "내부자 상세" : "INSIDER DETAILS" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "space-y-1.5", children: stock.buyers.map((buyer, idx) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 p-2 bg-neutral-900/30 border-l-2 border-emerald-800", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx("span", { className: "text-[9px] text-neutral-600 font-mono w-4", children: idx + 1 }),
              /* @__PURE__ */ jsx("span", { className: "text-[11px] font-bold text-neutral-300 truncate", children: buyer.name })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 ml-5", children: [
              /* @__PURE__ */ jsx("span", { className: "text-[9px] text-neutral-500", children: tData[buyer.relation] || buyer.relation }),
              /* @__PURE__ */ jsx("span", { className: "text-[8px] text-neutral-600 font-mono", children: buyer.date })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-right shrink-0", children: [
            /* @__PURE__ */ jsx("div", { className: "text-[11px] text-emerald-400 font-mono font-bold", children: formatCurrency(buyer.price) }),
            /* @__PURE__ */ jsxs("div", { className: `text-[9px] font-bold ${buyer.priceChange >= 0 ? "text-emerald-500" : "text-rose-500"}`, children: [
              buyer.priceChange > 0 ? "+" : "",
              buyer.priceChange,
              "%"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-right shrink-0 w-16", children: [
            /* @__PURE__ */ jsxs("div", { className: "text-[9px] text-neutral-500", children: [
              formatNumber(buyer.shares),
              " ",
              langKey === "ko" ? "주" : "sh"
            ] }),
            /* @__PURE__ */ jsx("div", { className: "text-[10px] text-emerald-500 font-bold font-mono", children: formatCurrency(buyer.amount) })
          ] })
        ] }, idx)) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "px-2 py-1.5 border-t border-neutral-800 bg-neutral-950/50 shrink-0", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-[8px] text-neutral-600", children: [
        /* @__PURE__ */ jsx("span", { className: "font-mono uppercase tracking-wider", children: langKey === "ko" ? "실시간 내부자 거래 알림" : "Real-Time Insider Alerts" }),
        /* @__PURE__ */ jsx("span", { className: "font-bold text-neutral-500", children: "InsiderPulse" })
      ] }) })
    ] })
  ] }) });
}
function TopStocksTerminal() {
  const { language } = useLanguage();
  const { accessLevel } = useAccess();
  const { isAuthenticated } = useAuth();
  const [, navigate2] = useLocation();
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const isPro = (accessLevel == null ? void 0 : accessLevel.hasRealtimeAccess) || false;
  const handleUpgrade = () => {
    if (!isAuthenticated) {
      navigate2("/signup");
    } else {
      navigate2("/premium-checkout");
    }
  };
  const handleSelectTrade = (trade) => {
    const insiderTrade = {
      id: trade.id || `temp-${Date.now()}`,
      ticker: trade.ticker,
      companyName: trade.companyName,
      traderName: trade.insider,
      traderTitle: trade.relation,
      tradeType: trade.type === "Buy" ? "BUY" : "SELL",
      shares: trade.shares,
      pricePerShare: trade.price,
      totalValue: trade.value,
      filedDate: trade.filingDate || trade.date,
      tradeDate: trade.date,
      isVerified: trade.isVerified || true,
      priceVariance: trade.priceChange || 0,
      secFilingUrl: trade.secFilingUrl || null,
      accessionNumber: trade.accessionNumber || null,
      aiAnalysis: {
        signal: trade.aiRecommendation || "BUY",
        significanceScore: trade.aiConfidence || 95,
        keyInsights: [trade.summary || "Significant insider activity detected"],
        riskLevel: trade.riskLevel || "LOW"
      }
    };
    setSelectedTrade(insiderTrade);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTrade(null);
  };
  const handleViewDetails = (stock) => {
    setSelectedStock(stock);
    setIsSummaryModalOpen(true);
  };
  const handleCloseSummaryModal = () => {
    setIsSummaryModalOpen(false);
    setSelectedStock(null);
  };
  const { data: rankingData, isLoading, error } = useQuery({
    queryKey: ["/api/rankings", language],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", `/api/rankings?limit=20&language=${language}`);
        return response.json();
      } catch (err) {
        console.error("Failed to fetch rankings:", err);
        return { rankings: [] };
      }
    },
    staleTime: 10 * 60 * 1e3
    // 10 minutes
  });
  if (isLoading) {
    return /* @__PURE__ */ jsx("div", { className: "flex-1 flex items-center justify-center bg-[#050505]", children: /* @__PURE__ */ jsx(Loader2, { className: "h-8 w-8 animate-spin text-neutral-500" }) });
  }
  const parseNumeric = (value) => {
    if (typeof value === "number") return value;
    if (!value) return 0;
    const cleaned = String(value).replace(/[$,\s]/g, "");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };
  const stockRecommendations = ((rankingData == null ? void 0 : rankingData.rankings) || []).map((item, index) => {
    var _a, _b, _c;
    const avgBuyPrice = ((_a = item.enhancedTrade) == null ? void 0 : _a.pricePerShare) || item.avgTradeValue || 0;
    const currentPrice = item.currentPrice || ((_b = item.enhancedTrade) == null ? void 0 : _b.currentPrice) || avgBuyPrice;
    const priceChange = item.priceChangePercent !== void 0 ? item.priceChangePercent : avgBuyPrice > 0 ? (currentPrice - avgBuyPrice) / avgBuyPrice * 100 : 0;
    return {
      rank: index + 1,
      ticker: item.ticker,
      companyName: item.companyName || item.ticker,
      currentPrice,
      priceChange,
      avgBuyPrice,
      totalBuyAmount: parseNumeric(item.netBuying),
      insiderCount: item.uniqueInsiders || ((_c = item.insiders) == null ? void 0 : _c.length) || 0,
      lastTradeDate: item.lastTradeDate || (/* @__PURE__ */ new Date()).toISOString(),
      buyers: (item.insiders || []).slice(0, 5).map((insider) => {
        const sharesNum = parseNumeric(insider.shares);
        const totalValueNum = parseNumeric(insider.totalValue);
        const pricePerShareNum = parseNumeric(insider.pricePerShare);
        const buyerBuyPrice = pricePerShareNum || avgBuyPrice;
        const buyerPriceChange = buyerBuyPrice > 0 ? (currentPrice - buyerBuyPrice) / buyerBuyPrice * 100 : 0;
        const buyerAmount = totalValueNum > 0 ? totalValueNum : sharesNum * buyerBuyPrice;
        return {
          name: insider.name || "Unknown",
          relation: insider.title || "Insider",
          shares: sharesNum,
          price: buyerBuyPrice,
          amount: buyerAmount,
          priceChange: Math.round(buyerPriceChange * 10) / 10,
          date: insider.date ? new Date(insider.date).toLocaleDateString() : "N/A",
          secFilingUrl: insider.secFilingUrl,
          accessionNumber: insider.accessionNumber
        };
      })
    };
  });
  return /* @__PURE__ */ jsxs(Fragment$1, { children: [
    /* @__PURE__ */ jsx(
      TopStocks,
      {
        data: stockRecommendations,
        lang: language,
        isPro,
        onUpgrade: handleUpgrade,
        onSelectTrade: handleSelectTrade,
        onViewDetails: handleViewDetails
      }
    ),
    selectedTrade && /* @__PURE__ */ jsx(
      TradeDetailModal,
      {
        trade: selectedTrade,
        isOpen: isModalOpen,
        onClose: handleCloseModal
      }
    ),
    /* @__PURE__ */ jsx(
      StockSummaryModal,
      {
        stock: selectedStock,
        isOpen: isSummaryModalOpen,
        onClose: handleCloseSummaryModal
      }
    )
  ] });
}
function AuthModal() {
  useLocation();
  const { showAuthModal, authModalMode, login, closeAuthModal } = useAuth();
  const { language } = useLanguage();
  const langKey = language.toLowerCase();
  const t = TRANSLATIONS[langKey].auth;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState(authModalMode);
  const [isLogin, setIsLogin] = useState(true);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const inputRefs = useRef([]);
  const [logs, setLogs] = useState([]);
  const [targets, setTargets] = useState([]);
  const scrollRef = useRef(null);
  useEffect(() => {
    setMode(authModalMode);
    setIsLogin(authModalMode === "login");
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
  useEffect(() => {
    if (!showAuthModal) return;
    const bootSequence = [
      "ESTABLISHING_SEC_UPLINK...",
      "HANDSHAKE_EDGAR_DB: [OK]",
      "LOADING_INSTITUTIONAL_LEDGERS...",
      "FILTERING_10B5-1_PLANS (NOISE_REDUCTION)...",
      "LOADING_INSIDER_PROFILES_V2.4...",
      "QUANT_MODEL_INIT: ALPHA_SCORE",
      "CROSS_REFERENCING_DARK_POOLS...",
      "ENCRYPTING_SESSION_KEYS...",
      "TERMINAL_READY."
    ];
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < bootSequence.length) {
        setLogs((prev) => [...prev, `> ${bootSequence[currentIndex]}`]);
        currentIndex++;
      } else {
        if (Math.random() > 0.7) {
          const commands = [
            "SCANNING_FORM_4: NVDA [CEO_BUY]",
            "DETECTING_CLUSTER_BUYING: BIOTECH_SECTOR",
            "ANALYZING_FILING: 0001193125-24-123456",
            "SENTIMENT_ANALYSIS: BULLISH_DIVERGENCE",
            "WHALE_ALERT: $5.2M PURCHASE DETECTED",
            "UPDATING_REAL_TIME_PRICE_TARGETS..."
          ];
          const cmd = commands[Math.floor(Math.random() * commands.length)];
          setLogs((prev) => {
            const newLogs = [...prev, `> ${cmd}`];
            return newLogs.slice(-8);
          });
        }
      }
    }, 250);
    return () => clearInterval(interval);
  }, [showAuthModal]);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);
  useEffect(() => {
    if (!showAuthModal) return;
    const spawnInterval = setInterval(() => {
      if (document.hidden) return;
      const id = Date.now();
      const angle = Math.random() * 2 * Math.PI;
      const r = Math.sqrt(Math.random()) * 40;
      const x = 50 + r * Math.cos(angle);
      const y = 50 + r * Math.sin(angle);
      const typeRand = Math.random();
      let type = "neutral";
      let label = "";
      if (typeRand > 0.85) {
        type = "buy";
        label = `CEO BUY +$${(Math.random() * 10).toFixed(1)}M`;
      } else if (typeRand > 0.75) {
        type = "sell";
        label = "WHALE DUMP";
      }
      const newTarget = { id, x, y, type, label };
      setTargets((prev) => [...prev, newTarget]);
      setTimeout(() => {
        setTargets((prev) => prev.filter((t2) => t2.id !== id));
      }, 3e3);
    }, 800);
    return () => clearInterval(spawnInterval);
  }, [showAuthModal]);
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }
    setIsLoading(true);
    try {
      const response = await apiClient.login(email, password);
      if (response.success && response.user && response.token) {
        login(response.user, response.token);
        closeAuthModal();
      } else {
        setError(response.message || "Login failed");
      }
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };
  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password || !confirmPassword) {
      setError("All fields are required");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Invalid email address");
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
        setError(response.message || "Signup failed");
      }
    } catch (err) {
      setError(err.message || "Signup failed");
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
      if (index < 6) newCode[index] = digit;
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
      setError("Please enter all 6 digits");
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
        setError(data.message || "Verification failed");
      }
    } catch (err) {
      setError(err.message || "Verification failed");
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
        setError(data.message || "Failed to resend code");
      }
    } catch (err) {
      setError(err.message || "Failed to resend code");
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
  if (verificationSuccess) {
    return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4", children: /* @__PURE__ */ jsxs("div", { className: "bg-[#080808] border border-neutral-800 rounded-sm shadow-[0_0_50px_rgba(0,0,0,0.8)] w-full max-w-md p-6 relative", children: [
      /* @__PURE__ */ jsx("button", { onClick: closeAuthModal, className: "absolute top-4 right-4 text-neutral-600 hover:text-white transition-colors", children: /* @__PURE__ */ jsx(X, { className: "h-5 w-5" }) }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-6 py-12 text-center", children: [
        /* @__PURE__ */ jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-full bg-emerald-900/50 border border-emerald-900 flex items-center justify-center", children: /* @__PURE__ */ jsx(CheckCircle, { className: "h-8 w-8 text-emerald-500" }) }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-neutral-200 mb-2 uppercase tracking-wide", children: "Verification Complete" }),
          /* @__PURE__ */ jsx("p", { className: "text-neutral-500 text-sm font-mono", children: "Logging you in..." })
        ] })
      ] })
    ] }) });
  }
  if (mode === "verify") {
    return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4", children: /* @__PURE__ */ jsxs("div", { className: "bg-[#080808] border border-neutral-800 rounded-sm shadow-[0_0_50px_rgba(0,0,0,0.8)] w-full max-w-md p-6 relative", children: [
      /* @__PURE__ */ jsx("button", { onClick: closeAuthModal, className: "absolute top-4 right-4 text-neutral-600 hover:text-white transition-colors", children: /* @__PURE__ */ jsx(X, { className: "h-5 w-5" }) }),
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-8", children: [
        /* @__PURE__ */ jsx("div", { className: "inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-900 border border-neutral-800 mb-4", children: /* @__PURE__ */ jsx(Mail, { className: "h-8 w-8 text-emerald-600" }) }),
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold mb-2 text-neutral-200 uppercase tracking-wide", children: "Verify Email" }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-neutral-500 font-mono", children: [
          "Check ",
          /* @__PURE__ */ jsx("strong", { className: "text-neutral-300", children: email }),
          /* @__PURE__ */ jsx("br", {}),
          "Enter 6-digit verification code"
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
            className: "w-12 h-14 text-center text-2xl font-bold font-mono border border-neutral-800 rounded focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-[#0a0a0a] text-neutral-200",
            autoFocus: index === 0
          },
          index
        )) }),
        /* @__PURE__ */ jsx(
          Button,
          {
            type: "submit",
            className: "w-full bg-emerald-900/20 hover:bg-emerald-900/30 border border-emerald-900/50 text-emerald-500 font-bold uppercase tracking-widest py-3 text-xs",
            disabled: isLoading || code.join("").length !== 6,
            children: isLoading ? /* @__PURE__ */ jsxs(Fragment$1, { children: [
              /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }),
              "Verifying..."
            ] }) : "Verify Code"
          }
        ),
        /* @__PURE__ */ jsx("div", { className: "text-center", children: /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: handleResendCode,
            disabled: resendCooldown > 0 || isResending,
            className: "text-sm text-emerald-600 hover:text-emerald-500 font-medium disabled:text-neutral-600 disabled:cursor-not-allowed font-mono",
            children: isResending ? /* @__PURE__ */ jsxs(Fragment$1, { children: [
              /* @__PURE__ */ jsx(Loader2, { className: "inline h-3 w-3 animate-spin mr-1" }),
              "Resending..."
            ] }) : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"
          }
        ) }),
        /* @__PURE__ */ jsx("div", { className: "text-center pt-4 border-t border-neutral-800", children: /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => setMode("signup"),
            className: "text-sm text-neutral-500 hover:text-neutral-300 inline-flex items-center gap-1 font-mono",
            children: [
              /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
              "Back to Signup"
            ]
          }
        ) })
      ] })
    ] }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 bg-[#030303] text-neutral-300 overflow-hidden font-mono selection:bg-emerald-900 selection:text-emerald-50 z-50", children: [
    /* @__PURE__ */ jsx("style", { children: `
        @keyframes radar-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        @keyframes blip {
            0% { transform: scale(0); opacity: 0; }
            50% { transform: scale(1.5); opacity: 1; }
            100% { transform: scale(1); opacity: 0; }
        }
        @keyframes lock-on {
            0% { width: 40px; height: 40px; opacity: 0; transform: scale(1.5); }
            20% { opacity: 1; }
            100% { width: 24px; height: 24px; opacity: 1; transform: scale(1); }
        }
        @keyframes scan-bar {
            0% { left: -50%; }
            100% { left: 150%; }
        }
        @keyframes fade-in {
            0% { opacity: 0; transform: translateY(5px); }
            100% { opacity: 1; transform: translateY(0); }
        }
      ` }),
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: closeAuthModal,
        className: "absolute top-6 right-6 z-50 bg-black/50 hover:bg-neutral-800 p-2 rounded-full text-neutral-500 hover:text-white transition-colors border border-neutral-800",
        "data-testid": "button-close-auth",
        children: /* @__PURE__ */ jsx(X, { size: 20 })
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "hidden lg:flex w-2/3 h-screen relative flex-col justify-between p-16 bg-[#020202] border-r border-neutral-900 overflow-hidden float-left", children: [
      /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 pointer-events-none z-0", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[linear-gradient(to_right,#121212_1px,transparent_1px),linear-gradient(to_bottom,#121212_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" }),
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-radial-gradient(circle at 30% 50%, #05966908 0%, transparent 50%)" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "relative z-10", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex gap-1", children: [
            /* @__PURE__ */ jsx("div", { className: "w-1 h-4 bg-emerald-600" }),
            /* @__PURE__ */ jsx("div", { className: "w-1 h-4 bg-emerald-800/50" }),
            /* @__PURE__ */ jsx("div", { className: "w-1 h-4 bg-emerald-900/30" })
          ] }),
          /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold tracking-[0.3em] text-emerald-500 uppercase animate-pulse", children: "DETECTING_SMART_MONEY_FLOW" })
        ] }),
        /* @__PURE__ */ jsxs("h1", { className: "text-6xl font-black tracking-tighter text-white mb-2 uppercase leading-none", children: [
          "Insider",
          /* @__PURE__ */ jsx("span", { className: "text-neutral-700", children: "Pulse" })
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-neutral-500 text-xs tracking-widest uppercase mt-2 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Database, { size: 12 }),
          "SEC Form 4 Intelligence Platform"
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "relative z-10 flex-1 flex items-center justify-center", children: /* @__PURE__ */ jsxs("div", { className: "relative w-[500px] h-[500px] flex items-center justify-center", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 border border-neutral-800/30 rounded-full" }),
        /* @__PURE__ */ jsx("div", { className: "absolute inset-[15%] border border-neutral-800/50 rounded-full border-dashed opacity-50" }),
        /* @__PURE__ */ jsx("div", { className: "absolute inset-[35%] border border-neutral-800 rounded-full" }),
        /* @__PURE__ */ jsx("div", { className: "absolute inset-[48%] border border-emerald-900/30 rounded-full" }),
        /* @__PURE__ */ jsx("div", { className: "absolute w-full h-[1px] bg-neutral-900" }),
        /* @__PURE__ */ jsx("div", { className: "absolute h-full w-[1px] bg-neutral-900" }),
        /* @__PURE__ */ jsx("div", { className: "absolute w-full h-full rounded-full animate-[radar-spin_4s_linear_infinite] origin-center bg-[conic-gradient(from_0deg,transparent_0deg,transparent_270deg,rgba(16,185,129,0.1)_360deg)]" }),
        /* @__PURE__ */ jsx("div", { className: "absolute w-12 h-12 bg-[#050505] border border-emerald-900/50 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.2)] z-20", children: /* @__PURE__ */ jsx(Target, { size: 20, className: "text-emerald-600 animate-pulse" }) }),
        targets.map((target) => /* @__PURE__ */ jsxs(
          "div",
          {
            className: "absolute w-0 h-0 flex items-center justify-center",
            style: { left: `${target.x}%`, top: `${target.y}%` },
            children: [
              target.type === "buy" && /* @__PURE__ */ jsxs(Fragment$1, { children: [
                /* @__PURE__ */ jsx("div", { className: "absolute border-2 border-emerald-500/50 rounded-sm animate-[lock-on_0.5s_forwards]" }),
                /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_10px_#10b981] animate-[pulse_1s_infinite]" }),
                target.label && /* @__PURE__ */ jsx("div", { className: "absolute left-4 top-0 bg-emerald-900/90 text-[9px] text-emerald-100 px-2 py-0.5 rounded backdrop-blur-md whitespace-nowrap border border-emerald-500/30 animate-[fade-in_0.3s_ease-out]", children: target.label }),
                /* @__PURE__ */ jsx("div", { className: "absolute h-[1px] w-16 bg-emerald-800/50 rotate-45 origin-top-left top-0 left-0 -z-10 opacity-50" })
              ] }),
              target.type === "sell" && /* @__PURE__ */ jsxs(Fragment$1, { children: [
                /* @__PURE__ */ jsx("div", { className: "w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_15px_#f43f5e]" }),
                /* @__PURE__ */ jsx("div", { className: "absolute w-8 h-8 border border-rose-900/50 rounded-full animate-[ping_1.5s_infinite]" }),
                target.label && /* @__PURE__ */ jsx("div", { className: "absolute right-4 top-0 bg-rose-900/90 text-[9px] text-rose-100 px-2 py-0.5 rounded backdrop-blur-md whitespace-nowrap border border-rose-500/30 animate-[fade-in_0.3s_ease-out]", children: target.label })
              ] }),
              target.type === "neutral" && /* @__PURE__ */ jsx("div", { className: "w-1 h-1 bg-neutral-600 rounded-full animate-pulse opacity-50" })
            ]
          },
          target.id
        )),
        /* @__PURE__ */ jsxs("div", { className: "absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 w-full", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-[9px] text-emerald-500 tracking-[0.2em] uppercase font-bold", children: [
            /* @__PURE__ */ jsx(Activity, { size: 12, className: "animate-bounce" }),
            "Tracking Signals"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "w-32 h-0.5 bg-neutral-800 overflow-hidden rounded-full relative", children: /* @__PURE__ */ jsx("div", { className: "absolute top-0 h-full bg-emerald-500 w-16 animate-[scan-bar_2s_linear_infinite] shadow-[0_0_8px_#10b981] opacity-80" }) })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "relative z-10 bg-black/50 border-t border-neutral-900 backdrop-blur-sm pt-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-[10px] text-neutral-500 uppercase tracking-wider", children: [
            /* @__PURE__ */ jsx(Scan, { size: 12 }),
            /* @__PURE__ */ jsx("span", { children: "System Log" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-[10px] text-emerald-700 animate-pulse", children: [
            /* @__PURE__ */ jsx(Crosshair, { size: 12 }),
            /* @__PURE__ */ jsx("span", { children: "LIVE FEED" })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { ref: scrollRef, className: "h-24 overflow-hidden font-mono text-[10px] space-y-1.5 opacity-80", children: logs.map((log, i) => /* @__PURE__ */ jsxs("div", { className: "text-neutral-400 truncate border-l border-neutral-800 pl-2", children: [
          /* @__PURE__ */ jsx("span", { className: "text-neutral-600 mr-2", children: ((/* @__PURE__ */ new Date()).getTime() + i).toString().slice(-6) }),
          log
        ] }, i)) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "w-full lg:w-1/3 h-screen flex items-center justify-center bg-[#050505] relative z-20 border-l border-neutral-900 lg:float-right", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute top-8 left-8 lg:hidden", children: /* @__PURE__ */ jsx("span", { className: "font-bold text-white tracking-tight text-lg", children: "INSIDERPULSE" }) }),
      /* @__PURE__ */ jsxs("div", { className: "w-full max-w-sm px-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-10 text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "w-16 h-16 mx-auto bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(0,0,0,0.5)]", children: /* @__PURE__ */ jsx(Lock, { size: 24, className: "text-emerald-600" }) }),
          /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-white mb-2 tracking-tight uppercase", children: isLogin ? t.welcome : t.createAccount }),
          /* @__PURE__ */ jsx("p", { className: "text-neutral-500 text-xs font-mono leading-relaxed max-w-[240px] mx-auto", children: isLogin ? "Please authenticate to access real-time insider trading data streams." : "Initialize new institutional account." })
        ] }),
        error && /* @__PURE__ */ jsxs(Alert, { variant: "destructive", className: "mb-4", children: [
          /* @__PURE__ */ jsx(AlertCircle, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsx(AlertDescription, { children: error })
        ] }),
        /* @__PURE__ */ jsxs("form", { className: "space-y-6", onSubmit: isLogin ? handleLogin : handleSignup, children: [
          /* @__PURE__ */ jsx("div", { className: "group", children: /* @__PURE__ */ jsxs("div", { className: "relative flex items-center", children: [
            /* @__PURE__ */ jsx(Globe, { size: 14, className: "absolute left-3 text-neutral-600 group-focus-within:text-emerald-500 transition-colors" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "email",
                className: "block w-full bg-[#0a0a0a] border border-neutral-800 rounded text-sm text-neutral-200 pl-10 pr-4 py-3 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20 transition-all placeholder-neutral-700 font-mono",
                placeholder: "ENTER_EMAIL_ADDRESS",
                id: "email",
                value: email,
                onChange: (e) => setEmail(e.target.value),
                disabled: isLoading,
                "data-testid": "input-email"
              }
            )
          ] }) }),
          /* @__PURE__ */ jsx("div", { className: "group", children: /* @__PURE__ */ jsxs("div", { className: "relative flex items-center", children: [
            /* @__PURE__ */ jsx(Lock, { size: 14, className: "absolute left-3 text-neutral-600 group-focus-within:text-emerald-500 transition-colors" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "password",
                className: "block w-full bg-[#0a0a0a] border border-neutral-800 rounded text-sm text-neutral-200 pl-10 pr-4 py-3 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20 transition-all placeholder-neutral-700 font-mono",
                placeholder: "ENTER_PASSWORD",
                id: "password",
                value: password,
                onChange: (e) => setPassword(e.target.value),
                disabled: isLoading,
                "data-testid": "input-password"
              }
            )
          ] }) }),
          !isLogin && /* @__PURE__ */ jsx("div", { className: "group", children: /* @__PURE__ */ jsxs("div", { className: "relative flex items-center", children: [
            /* @__PURE__ */ jsx(Fingerprint, { size: 14, className: "absolute left-3 text-neutral-600 group-focus-within:text-emerald-500 transition-colors" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "password",
                className: "block w-full bg-[#0a0a0a] border border-neutral-800 rounded text-sm text-neutral-200 pl-10 pr-4 py-3 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20 transition-all placeholder-neutral-700 font-mono",
                placeholder: "CONFIRM_CREDENTIALS",
                id: "confirm",
                value: confirmPassword,
                onChange: (e) => setConfirmPassword(e.target.value),
                disabled: isLoading,
                "data-testid": "input-confirm-password"
              }
            )
          ] }) }),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "submit",
              className: "w-full bg-emerald-900/20 hover:bg-emerald-900/30 border border-emerald-900/50 text-emerald-500 font-bold uppercase tracking-widest py-4 text-xs transition-all flex items-center justify-center gap-2 mt-4 group shadow-[0_0_15px_rgba(16,185,129,0.1)]",
              disabled: isLoading,
              "data-testid": "button-submit-auth",
              children: isLoading ? /* @__PURE__ */ jsxs(Fragment$1, { children: [
                /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }),
                isLogin ? "LOGGING IN..." : "CREATING..."
              ] }) : /* @__PURE__ */ jsxs(Fragment$1, { children: [
                /* @__PURE__ */ jsx("span", { children: isLogin ? t.submit : t.register }),
                /* @__PURE__ */ jsx(ArrowRight, { size: 14, className: "group-hover:translate-x-1 transition-transform" })
              ] })
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-10 flex justify-between items-center border-t border-neutral-900 pt-6", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setIsLogin(!isLogin),
              className: "text-[10px] text-neutral-500 hover:text-neutral-300 transition-colors uppercase tracking-wider font-bold",
              "data-testid": "button-toggle-mode",
              children: isLogin ? t.noAccount : t.hasAccount
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-neutral-700", children: [
            /* @__PURE__ */ jsx(ShieldCheck, { size: 12 }),
            /* @__PURE__ */ jsx("span", { className: "text-[9px] font-mono", children: "AES-256 ENCRYPTION" })
          ] })
        ] })
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
function AppContent() {
  var _a;
  const { language, setLanguage } = useLanguage();
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState(false);
  const [location2, setLocation] = useLocation();
  const [activeView, setActiveView] = useState(View.LIVE_TRADING);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const terminalLang = language;
  const t = ((_a = TRANSLATIONS[terminalLang]) == null ? void 0 : _a.common) || TRANSLATIONS.en.common;
  const isPro = (user == null ? void 0 : user.subscriptionStatus) === "active" || (user == null ? void 0 : user.subscriptionStatus) === "trialing";
  const languages = [
    { code: "en", label: "English" },
    { code: "ko", label: "한국어" },
    { code: "ja", label: "日本語" },
    { code: "zh", label: "中文" }
  ];
  useEffect(() => {
    const languageSelected = localStorage.getItem("language-selected");
    const savedLanguage = localStorage.getItem("language");
    if (languageSelected === "true" || savedLanguage) {
      setHasSelectedLanguage(true);
    }
  }, []);
  const handleViewChange = (view) => {
    setActiveView(view);
    setIsMobileMenuOpen(false);
    switch (view) {
      case View.LIVE_TRADING:
        setLocation("/dashboard");
        break;
      case View.TOP_STOCKS:
        setLocation("/ranking");
        break;
      case View.PROFILE:
        setLocation("/profile");
        break;
      case View.SETTINGS:
        setLocation("/settings");
        break;
    }
  };
  useEffect(() => {
    if (location2.startsWith("/dashboard") || location2.startsWith("/trades")) {
      setActiveView(View.LIVE_TRADING);
    } else if (location2.startsWith("/ranking")) {
      setActiveView(View.TOP_STOCKS);
    } else if (location2.startsWith("/profile")) {
      setActiveView(View.PROFILE);
    } else if (location2.startsWith("/settings")) {
      setActiveView(View.SETTINGS);
    }
  }, [location2]);
  useEffect(() => {
    if (location2.startsWith("/dashboard") || location2.startsWith("/ranking")) {
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["topStocks"] });
    }
  }, [location2]);
  const publicPaths = ["/", "/signup", "/login", "/forgot-password", "/reset-password", "/verify-code", "/verify-email", "/start-trial", "/premium-checkout"];
  const isPublicRoute = publicPaths.includes(location2);
  if (!hasSelectedLanguage && !isPublicRoute) {
    return /* @__PURE__ */ jsx(LanguageSelection, { onLanguageSelected: () => setHasSelectedLanguage(true) });
  }
  if (isPublicRoute) {
    return /* @__PURE__ */ jsx(PublicRouter, {});
  }
  const handleTriggerAction = () => {
    if (!isAuthenticated) {
      openAuthModal("login");
    } else {
      setLocation("/premium-checkout");
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "flex h-screen w-screen bg-[#050505] text-neutral-300 font-sans overflow-hidden", children: [
    isMobileMenuOpen && /* @__PURE__ */ jsx(
      "div",
      {
        className: "fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden animate-in fade-in duration-200",
        onClick: () => setIsMobileMenuOpen(false)
      }
    ),
    /* @__PURE__ */ jsx("div", { className: `fixed inset-y-0 left-0 z-50 w-64 bg-[#050505] transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? "translate-x-0 shadow-[0_0_50px_rgba(0,0,0,0.5)] border-r border-neutral-800" : "-translate-x-full"}`, children: /* @__PURE__ */ jsx(
      Sidebar,
      {
        activeView,
        onChangeView: handleViewChange,
        lang: terminalLang,
        isPro,
        isAuthenticated,
        onLoginClick: () => openAuthModal("login"),
        onLogout: logout,
        onCloseMobile: () => setIsMobileMenuOpen(false)
      }
    ) }),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col relative bg-[#050505] w-full min-w-0", children: [
      /* @__PURE__ */ jsxs("div", { className: "h-10 border-b border-neutral-900 flex items-center justify-between px-4 md:px-6 text-[10px] tracking-widest text-neutral-600 uppercase select-none bg-[#050505] relative z-30", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 md:gap-6", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setIsMobileMenuOpen(true),
              className: "md:hidden text-neutral-400 hover:text-white transition-colors",
              "data-testid": "button-mobile-menu",
              children: /* @__PURE__ */ jsx(Menu, { size: 16 })
            }
          ),
          /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: `w-1.5 h-1.5 rounded-full animate-pulse ${isPro ? "bg-emerald-500" : "bg-amber-500"}` }),
            /* @__PURE__ */ jsxs("span", { className: "hidden sm:inline", children: [
              "SYSTEM: ",
              isPro ? t.systemPro : t.systemFree
            ] }),
            /* @__PURE__ */ jsx("span", { className: "sm:hidden", children: isPro ? t.tierPro : t.tierFree })
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "hidden md:inline", children: [
            "LATENCY: ",
            isPro ? t.latencyPro : t.latencyFree
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 md:gap-6 mono", children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: handleTriggerAction,
              className: `flex items-center gap-2 transition-colors ${isPro ? "text-emerald-500" : "text-amber-600 hover:text-amber-500"}`,
              "data-testid": "button-upgrade-status",
              children: [
                isPro ? /* @__PURE__ */ jsx(ShieldCheck, { size: 10 }) : /* @__PURE__ */ jsx(Shield, { size: 10 }),
                /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: isPro ? t.licenseActive : t.licenseFree })
              ]
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => setShowLangMenu(!showLangMenu),
                className: "flex items-center gap-2 hover:text-neutral-300 transition-colors focus:outline-none",
                "data-testid": "button-language-selector",
                children: [
                  /* @__PURE__ */ jsx(Globe, { size: 10 }),
                  /* @__PURE__ */ jsx("span", { className: "text-neutral-400", children: language.toUpperCase() })
                ]
              }
            ),
            showLangMenu && /* @__PURE__ */ jsxs(Fragment$1, { children: [
              /* @__PURE__ */ jsx(
                "div",
                {
                  className: "fixed inset-0 z-40",
                  onClick: () => setShowLangMenu(false)
                }
              ),
              /* @__PURE__ */ jsx("div", { className: "absolute right-0 top-full mt-2 w-24 bg-[#0a0a0a] border border-neutral-800 shadow-xl flex flex-col py-1 z-50", children: languages.map((lang) => /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => {
                    setLanguage(lang.code);
                    setShowLangMenu(false);
                  },
                  className: `px-3 py-2 text-left text-[10px] hover:bg-neutral-900 transition-colors ${language === lang.code ? "text-emerald-500" : "text-neutral-400"}`,
                  "data-testid": `button-language-${lang.code}`,
                  children: lang.label
                },
                lang.code
              )) })
            ] })
          ] }),
          /* @__PURE__ */ jsx(CurrencySelector, {})
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-hidden relative w-full", children: /* @__PURE__ */ jsxs("main", { className: "h-full overflow-hidden w-full", children: [
        activeView === View.LIVE_TRADING && /* @__PURE__ */ jsx(LiveTradingTerminal, {}),
        activeView === View.TOP_STOCKS && /* @__PURE__ */ jsx(TopStocksTerminal, {}),
        activeView === View.PROFILE && /* @__PURE__ */ jsx(ProfileView, { lang: terminalLang }),
        activeView === View.SETTINGS && /* @__PURE__ */ jsx(SettingsView, { lang: terminalLang, setLang: (lang) => setLanguage(lang) })
      ] }) })
    ] })
  ] });
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
  return /* @__PURE__ */ jsx(QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ jsx(AuthProvider, { children: /* @__PURE__ */ jsx(LanguageProvider, { children: /* @__PURE__ */ jsx(CurrencyProvider, { children: /* @__PURE__ */ jsx(AccessProvider, { children: /* @__PURE__ */ jsxs(TooltipProvider, { children: [
    /* @__PURE__ */ jsx(AppContent, {}),
    /* @__PURE__ */ jsx(AuthModal, {}),
    /* @__PURE__ */ jsx(PWAInstallPrompt, {}),
    /* @__PURE__ */ jsx(Toaster, {})
  ] }) }) }) }) }) });
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
