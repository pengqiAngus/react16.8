let nextUnitOfWork = null;
let currentRoot = null;
let wipRoot = null;
let deletions = [];

export function render(element, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    alternate: currentRoot,
  };
  deletions = [];
  nextUnitOfWork = wipRoot;
}

function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    performUintOfWork;
    nextUnitOfWork = performUintOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }
  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }
  requestIdleCallback(workLoop);
}
requestIdleCallback(workLoop);

function updateFunctionComponent(fiber) {
    wipFiber = fiber;
    hookIndex = 0;
    wipFiber.hooks = [];
    const children = [fiber.type(fiber.props)];
  reconcileChildren(fiber, children);
}
let wipFiber = null;
let hookIndex = null;

export function useState(initialState) {
    const oldHook = wipFiber?.alternate && wipFiber.alternate?.hooks[hookIndex];
    const hook = {
        state: oldHook ? oldHook.state : initialState,
        queue: []
    }
    console.log("oldHook", oldHook);
    const actions = oldHook ? oldHook.queue : [];
    actions.forEach(action => {
        hook.state = typeof action==='function' ? action(hook.state) : action;
    })
    const setState = (action) => {
        hook.queue.push(action);
        wipRoot = {
            dom: currentRoot.dom,
            props: currentRoot.props,
            alternate: currentRoot,
        };
        nextUnitOfWork = wipRoot;
        deletions = [];
    }
    wipFiber?.hooks.push(hook);
    hookIndex++;
    return [hook.state, setState];
}
function updateHostComponent(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  const elements = fiber.props.children;
  reconcileChildren(fiber, elements);
}

function performUintOfWork(fiber) {
  const isFunctionComponent = typeof fiber.type === "function";
  if (isFunctionComponent) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }

  if (fiber.child) {
    return fiber.child;
  }
  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
}

function reconcileChildren(wipFiber, elements) {
  let index = 0;
  let prevSibling = null;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  while (index < elements.length || oldFiber) {
    let element = elements[index];
    let newFiber = null;
    const sameType = oldFiber && element && element.type === oldFiber.type;
    if (sameType) {
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: "UPDATE",
      };
    }
    if (element && !sameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT",
      };
    }
    if (oldFiber && !sameType) {
      oldFiber.effectTag = "DELETION";
      deletions.push(oldFiber);
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    if (index == 0) {
      wipFiber.child = newFiber;
    } else {
      prevSibling.sibling = newFiber;
    }
    prevSibling = newFiber;
    index++;
  }
}
function commitDeletion(fiber, parentFiber) {
  if (fiber.dom) {
    parentFiber.removeChild(fiber.dom);
  } else {
    commitDeletion(fiber.child, parentFiber);
  }
}

function commitRoot(params) {
  deletions.forEach(commitWork);
  commitWork(wipRoot.child);
    currentRoot = wipRoot;
  wipRoot = null;
}
function commitWork(fiber) {
  if (!fiber) {
    return;
  }
    let parentFiber = fiber.parent;
    while (!parentFiber.dom) {
      parentFiber = parentFiber.parent;
    }
  if (fiber.effectTag === "PLACEMENT" && fiber.dom != null) {
    
    parentFiber.dom.appendChild(fiber.dom);
  } else if (fiber.effectTag === "UPDATE" && fiber.dom != null) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  } else if (fiber.effectTag === "DELETION" && fiber.dom != null) {
      commitDeletion(fiber, parentFiber);
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

export function createDom(fiber) {
  const dom =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);
  updateDom(dom, {}, fiber.props);
  return dom;
}

const isEvent = (key) => key.startsWith("on");
const isProperty = (key) => key !== "children" && !isEvent(key);

function updateDom(dom, prevProps, nextProps) {
  Object.keys(prevProps)
    .filter(isProperty)
    .forEach((name) => {
      if (!(name in nextProps)) {
        dom[name] = "";
      }
    });
  Object.keys(nextProps)
    .filter(isProperty)
    .forEach((name) => {
      if (prevProps[name] !== nextProps[name]) {
        dom[name] = nextProps[name];
      }
    });
  // 移除老事件
  Object.keys(prevProps)
    .filter(isEvent)
    .forEach((name) => {
      const eventType = name.replace("on", "");
      dom.removeEventListener(eventType, prevProps[name]);
    });
  // 添加新事件
  Object.keys(nextProps)
    .filter(isEvent)
    .forEach((name) => {
      const eventType = name.replace("on", "");
      dom.addEventListener(eventType, nextProps[name]);
    });
}
