let storage = window.localStorage

function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}

export const saveName = (name) => {
    storage.setItem('name', name)
}

export const getName = () => {
    return storage.getItem('name')
}

export const createUUID = () => {
    storage.setItem('uuid', guid())
}

export const getUUID = () => {
    return storage.getItem('uuid')
}