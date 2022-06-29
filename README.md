#### 介绍

半自动收集数据依赖，数据更新自动渲染依赖组件。
暂时只支持函数组件。

### 用例

```
import UpdateManager from 'test';

const Root = createContext('');
function A (props) {
   const um =  useRef(new UpdateManager({ man1: { h: '你杀了我爹！'}, man2: "" })).current;
   useEffect(() => {
    setTimeout(() => {
        um.setState({
            man2: '我是你爹！'
        }, 2000);
        setTimeout(() => {
            um.setState({
                ['man1.h']: "不！！！！"
            })
        }, 2000)
    });
   },[])
    return <Root.Provider value={{
        um: um
    }}> <B/> </Root.Provider>
}
...其他组件
function E () {
    const { um } = useContext(Root);
    const { say } = um.useDeps({
        say ({ man1 }) {
            return man1.h;
        }
    });
    return <div>{'man1: ' + say}</div>
}
```

在 A 组件中使用

```
um.setState({["man1.h"]: "值"})
```

就会自动更新使用了

```
useDeps({say(get){ return get("man1.h")}})
```

的组件。
useDeps 中方法的返回值就是 useDeps 最后导出的属性的值
