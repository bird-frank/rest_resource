export function trim(data){
    for(var i in data){
        if(undefined !== data[i] && null !== data[i]){
            if(typeof data[i] === 'string'){
                data[i] = data[i].replace(/(^\s*)|(\s*$)/g, "");
            }
        }
    }
    return data;
}

export function isBlank(obj) {
    if ( undefined === obj ||
         null === obj ) {
        return true;
    }

    if ( obj.length && 0 === obj.length ) {
        return true;
    }

    if ( 'function' === obj.size ) {
        return obj.size() === 0;
    }

    return false;
}
