import React, { useEffect, createContext, useMemo, useContext } from "react";
import UpdateManager from "./UpdateManager";

const Root = createContext("");

function F(props) {
  const { um } = useContext(Root);
  const { say } = um.useDeps({
    say: (get) => {
      return get("man2") || "";
    },
  });

  return <div>{"man2:" + say}</div>;
}
const E = React.memo(function E(props) {
  const { um } = useContext(Root);
  const { say } = um.useDeps({
    say(get) {
      return get("man1.h") || "";
    },
  });

  return <div>{"man1: " + say}</div>;
});
function D(props) {
  return (
    <>
      <E />
      <F />
    </>
  );
}
function C(props) {
  return <D />;
}
function B(props) {
  return <C />;
}

const um = new UpdateManager({ man1: { h: "你杀了我爹！" }, man2: "" });
export default function A(props) {
  useEffect(() => {
    setTimeout(() => {
      um.setState({
        man2: "我是你爹！",
      });
      setTimeout(() => {
        um.setState({
          "man1.h": "不！！！！",
        });
      }, 2000);
    }, 1000);
  }, []);
  return (
    <Root.Provider
      value={{
        um: um,
      }}
    >
      <B />
    </Root.Provider>
  );
}
