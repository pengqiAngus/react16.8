import { createDom } from "./render";

let nextUnitOfWork = null;
let currentRoot = null;
let wipRoot = null;
let deletions = [];
let wipFiber = null;
let hookIndex = null;

export const render = (element, container) => {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    alternate: currentRoot,
  };
  deletions = [];
  nextUnitOfWork = wipRoot;
};

/**
 * @description: 执行栈空闲时执行
 * @param {String}
 * @return:
 */
export const workLoop = (deadline) => {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performanceWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }
  if (!nextUnitOfWork && wipRoot) {
    commitRoot(wipRoot);
  }
  requestIdleCallback(workLoop);
};
requestIdleCallback(workLoop);

/**
* @description:深度优先遍历root的每一个dom元素,可能不是一次性完成的,
    里面有个reconcileChildren 会把 wipRoot 和currentRoot进行对比然后把wipRoot更新
* @param nextUnitOfWork
* @return: 
*/
const performanceWork = (fiber) => {
  const isFunctionComponent = typeof fiber.type === "function";
  if (isFunctionComponent) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }
  if (fiber.child) {
    return fiber.child;
  }
  const nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
};

const updateFunctionComponent = (fiber) => {
  wipFiber = fiber;
  hookIndex = 0;
  wipFiber.hooks = [];
  const element = [fiber.type(fiber.props)];
  reconcileChildren(wipFiber, element);
};
const updateHostComponent = (fiber) => {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  const element = fiber.props.children;
  reconcileChildren(fiber, element);
};

/**
 * @description:  diff 对这一层的dom元素(node节点)进行diff对比, oldFiber[0] 和element[0] 对比,
 * oldFiber[1] 和element[1] 对比,
 * element是数组,oldFiber是链表
 * @param
 * @return:
 */
const reconcileChildren = (wipFiber, elements) => {
  let index = 0;
  let prevSibling = null;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  while (index < elements.length || oldFiber) {
    const element = elements[index];
    let newFiber = null;
    const sameType = oldFiber?.type === element?.type;
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
    if (index === 0) {
      wipFiber.child = newFiber;
    } else {
      prevSibling.sibling = newFiber;
    }
    prevSibling = newFiber;
    index++;
  }
};

/**
 * @description: wipRoot 的 dom,props 这些已经在内存被更新,commitRoot 把内存中的更新同步到页面上
 * @param wipRoot
 * @return:
 */
const commitRoot = (wipRoot) => {
  deletions.forEach(commitWork);
  commitWork(wipRoot.child);
  currentRoot = wipRoot;
  wipRoot = null;
};
const commitWork = (fiber) => {
  if (!fiber) return;
  let parentFiber = fiber.parent;
  while (!parentFiber) {
    parentFiber = parentFiber.parent;
  }
  if (fiber.effectTag === "PLACEMENT" && fiber.dom !== null) {
    parentFiber.dom.appendChild(fiber.dom);
  }
  if (fiber.effectTag === "UPDATE") {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  }
  if (fiber.effectTag === "DELECTION") {
    commitDeletion(fiber, parentFiber);
  }
  commitWork(fiber.child);
  commitWork(fiber.sibling);
};

const updateDom = (dom, prevProps, currentProps) => {
    
}

const commitDeletion = (fiber, parentFiber) => {
  if (fiber.dom) {
    parentFiber.removeChild(fiber.dom);
  } else {
    commitDeletion(fiber.child, parentFiber);
  }
};
