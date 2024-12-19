import React from '../react/index';

const container = document.getElementById("root");


// const updateValue = (e)=> {
//     reRender(e.target.value)
// }
// const reRender = (value)=> {
//     const element = (
//         <div>
//             <input oninput={updateValue} value={value}></input>
//             <h2>Hello {value}</h2>
//       </div>
//     )
//     React.render(element, container);
// }



function App(props) {
    const [count, setCount] = React.useState(0);
    const set = () => {
      setCount(count + 1);
    };
    return (
      <div>
            <h2>Hello {count}</h2>
            <button onclick={set}>Increment</button>
      </div>
    );
}
const element = <App name="angus" />

// reRender("World")
React.render(element, container);
