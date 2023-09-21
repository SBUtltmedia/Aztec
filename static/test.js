const handler = {
    get(target, key) {
      if (key == 'isProxy')
        return true;
  
      const prop = target[key];
  
      // return if property not found
      if (typeof prop == 'undefined')
        return;
  
      // set value as proxy if object
      if (!prop.isProxy && typeof prop === 'object')
        target[key] = new Proxy(prop, handler);
  
      return target[key];
    },
    set(target, key, value) {
      console.log('Setting', target, `.${key} to equal`, value);
  
      // todo : call callback
  
      target[key] = value;
      return true;
    }
  }

  function diffSet(pathArr, value){
    console.log({pathArr, value})
    let currKey;
    let prevKey = value
    while(pathArr.length > 0){
        currKey = {[pathArr.pop()]: prevKey};
        prevKey = currKey;
    }

    console.log("diff:", currKey);

}

  function createHandler(path = []){
    return {
    get(target, key) {
        if(path.length == 0 && key != `variables`){
            return target[key];
        }
        if (typeof target[key] === 'object' && target[key] !== null) {
        return new Proxy(target[key], createHandler([...path,key]))
        } else {
        return target[key];
        }
    },
    set (target, key, value) {
        console.log({target, key, value})
        if(target[key] != value){
            target[key] = value
            path.shift();
            diffSet([...path,key], value)
        }
        return true
    }
}
}
  
let state = {
    variables: {
        chatlog : {
            chat : [{message:"hey1"}, {message:"hey2"}]
        }
    }
  };

  state = new Proxy(state, createHandler());

  state.variables.chatlog.chat.push({message:"hey3"});

  //state.variables.chatlog = state.variables.chatlog.slice(-1);
  
  console.log(JSON.stringify(state));