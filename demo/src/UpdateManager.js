import React, { useState, useRef, useEffect, useMemo } from "react";
import lodashSet from "lodash/set";

// function castPath(value) {
//   if (Array.isArray(value)) {
//     return value;
//   }

//   if (typeof value !== 'string') {
//     console.log('路径必须是数组或者string类型');
//     return '';
//   }
//   return value
//     .replace(/(\[|\])/gi, '.')
//     .split('.')
//     .filter((e) => e);
// }
// function isObject(value) {
//   const type = typeof value;
//   return value !== null && type == 'object';
// }
// function baseSet(object, path, value) {
//   if (!isObject(object)) {
//     return object;
//   }
//   path = castPath(path);

//   let index = -1;
//   const length = path.length;
//   const lastIndex = length - 1;
//   let nested = object;

//   while (nested !== null && ++index < length) {
//     const key = path[index];
//     if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
//       console.log('路径不能出现 __proto__ constructor prototype等内置属性');
//       return object;
//     }
//     if (index === lastIndex) {
//       nested[key] = value;
//     }
//     nested = nested[key];
//   }
//   return object;
// }
// function mySet(object, path, value) {
//   return object === null ? object : baseSet(object, path, value);
// }
export default class UpdateManager {
  constructor(datas) {
    this.updateCallback = {};
    this.deep = true;
    // const _proxy = Symbol('proxy');
    // const _path = Symbol('path');
    // const handler = {
    //   get: (target, pname) => {
    //     if (pname === _proxy || pname === _path) {
    //       return target[pname];
    //     }
    //     if (Array.isArray(target) && (typeof pname === 'symbol' || isNaN(pname))) {
    //       return target[pname];
    //     }
    //     let path = target[_path] + '/' + pname;
    //     if (target[pname] && typeof target[pname] === 'object' && !target[pname][_proxy] && this.deep) {
    //       target[pname][_proxy] = true;
    //       path = target[pname][_path] = target[_path] + '/' + pname;
    //       target[pname] = new Proxy(target[pname], handler);
    //     }

    //     return target[pname];
    //   },
    //   set: (target, pname, val) => {
    //     target[pname] = val;
    //   },
    //   // set: (target, pname, val) => {
    //   //   if (pname === _proxy) {
    //   //     return;
    //   //   }
    //   //   const origin = target[pname];
    //   //   if (val && typeof val === 'object' && this.deep) {
    //   //     target[pname][_proxy] = true;
    //   //     target[pname][_path] = target[_path] + '/' + pname;
    //   //     target[pname] = new Proxy(val, handler);
    //   //   } else {
    //   //     target[pname] = val;
    //   //   }
    //   //   // }
    //   //   // val !== origin && this.update(pname, target[_path] + '/' + pname);
    //   // },
    // };
    // this.handler = handler;
    this._datas = datas;
  }

  updateCallbacks(oldtar, newtar) {
    this.updateCallback.forEach((el) => {
      if (el.target === oldtar) {
        el.target = newtar;
      }
    });
  }

  set datas(val) {
    console.log("_datas 是只读的");
  }

  get datas() {
    if (!this._datas) {
      throw Error("请初始化datas");
    }
    return this._datas;
  }

  setState = (obj) => {
    if (!obj || typeof obj !== "object") {
      return;
    }
    Object.keys(obj).forEach((path) => {
      this.updateState(path, obj[path]);
    });
  };

  splitPath(path) {
    return path
      .replace(/(\[|\]|'|")/gi, ".")
      .split(".")
      .filter((e) => e)
      .map((e) => (/^[0-9]+$/.test(e) ? parseInt(e) : e));
  }

  getData = (path) => {
    const arr = Array.isArray(path) ? path : this.splitPath(path);
    let target = this._datas;
    let currPath = "root";
    let count = 0;
    let res;
    for (const key of arr) {
      currPath += "/" + key;
      ++count;
      if (this.isCollect) {
        this.currDeps.push({
          path: currPath,
          pname: key,
        });
      }
      if (!target[key]) {
        return;
      }
      if (count === arr.length) {
        res = target[key];
      } else if (typeof target[key] === "object") {
        target = target[key];
      } else {
        return;
      }
    }
    return res;
  };

  updateState = (path, val) => {
    const arr = path
      .replace(/(\[|\]|'|")/gi, ".")
      .split(".")
      .filter((e) => e);
    const p = "root/" + arr.join("/");
    const pre = this.getData(path);
    lodashSet(this._datas, path, val);
    if (pre !== val) {
      this.update(p);
    }
  };

  refs = [];
  useDeps = (deps) => {
    const ref = useRef(Symbol("key")).current;
    const res = {};
    Object.keys(deps).forEach((key) => {
      const func = deps[key];
      if (typeof func !== "function") {
        return;
      }
      this.isCollect = true;
      this.currDeps = [];
      const d = func(this.getData);
      const [_, set_] = useState(d);
      this.refs = this.refs.filter((r) => r !== ref);
      this.refs.push(ref);
      this.updateCallback[ref] = [];
      useEffect(() => {
        return () => {
          this.updateCallback[ref] = [];
          this.refs = this.refs.filter((r) => r !== ref);
        };
      }, []);
      // this.updateCallback[ref] = [];
      // this.updateCallback = this.updateCallback?.filter((el) => el.ref !== ref);
      // this.currDeps = this.currDeps.filter(
      //   (el) => !this.updateCallback.find((e) => e.ref === el.ref && e.path === el.path),
      // );
      this.currDeps.forEach((e) => {
        e.func = () => {
          set_(func(this.getData));
        };
        e.ref = ref;
      });
      this.updateCallback[ref]?.push(...this.currDeps);

      this.currDeps = [];
      this.isCollect = false;
      res[key] = _;
    });
    return res;
  };

  clear() {
    this.updateCallback = [];
  }

  updating = false;
  updates = [];
  update = async (p) => {
    // this.updates.push(() => {
    //   this.updateCallback &&
    for (const ref of this.refs) {
      const arr = this.updateCallback[ref];
      if (Array.isArray(arr)) {
        arr.forEach((el) => {
          const { path, func } = el;

          if (path === p) {
            func &&
              typeof func === "function" &&
              !this.updates.find((e) => e === func) &&
              this.updates.push(func);
          }
        });
      }
    }
    // });
    if (!this.updating) {
      this.updating = true;
      setTimeout(() => {
        this.updating = false;
        this.updates.forEach((update) => {
          update();
        });
        this.updates = [];
      });
    }
  };
}
