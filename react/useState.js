let globalState = [];
let globalSubscribers = [];
let stateIndex = 0;

export function useState(initialState) {
  const currentIndex = stateIndex;
  stateIndex++;
  if (!(currentIndex in globalState)) {
    globalState[currentIndex] = initialState;
      globalSubscribers[currentIndex] = new Set();
  }
  function setState(newState) {
    if (typeof newState === "function") {
      newState = newState(globalState[currentIndex]);
    }
    globalState[currentIndex] = newState;
    for (let subscriber of globalSubscribers[currentIndex]) {
      subscriber(newState);
    }
  }
    const subscribers = (subscriber) => {
      console.log(globalSubscribers);
    globalSubscribers[currentIndex].add(subscriber);
    return () => {
      globalSubscribers[currentIndex].delete(subscriber);
    };
  };
  return [globalState[currentIndex], setState, subscribers];
}
const [count, setCount, subscribeCount] = useState(0);
const unsubscribe = subscribeCount((count) => {
  console.log("count changed", count);
});
setCount(2);
console.log(count);
console.log(unsubscribe);

// 定义useState钩子函数
export function useState(initialState) {
    const oldHook = wipFiber?.alternate && wipFiber.alternate?.hooks[hookIndex];
    const hook = {
        state: oldHook ? oldHook.state : initialState,
        queue: []
    }
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
