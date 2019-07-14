import { defaultClient, Constants } from './client';

function execute(call, params) {
    return call.with_param(params)
        .execute();
};

function templates(name) {
    return {
        index: (params={}) => execute(defaultClient.get(`/${name}.json`), params),

        findOne: (id, params={}) =>execute(defaultClient.get(`/${name}/${id}.json`), params),

        create: (params={}) => execute(defaultClient.post(`/${name}.json`), params),

        update: (id, params={}) => execute(defaultClient.put(`/${name}/${id}.json`), params),

        delete: (id, params={}) => execute(defaultClient.delete(`/${name}/${id}.json`), params)
    };
}

function createMemberActions(result, resourceName, actions) {
    actions.forEach( act => {
        let method = Constants.GET;
        let actionName = act;
        if ( ('object' === typeof act) && act.method ) {
            actionName = act.action;
            method = act.method;
        }

        result[actionName] = (id, params={}) => execute(defaultClient.request(method, `/${resourceName}/${id}/${actionName}.json`),
                                                        params);
    });
}

function createCollectionActions(result, resourceName, actions) {
    actions.forEach( act => {
        let method = Constants.GET;
        let actionName = act;
        if ( ('object' === typeof act) && act.method ) {
            actionName = act.action;
            method = act.method;
        }

        result[actionName] = (params={}) => execute(defaultClient.request(method, `/${resourceName}/${actionName}.json`),
                                                        params);
    });
}

export default function resource(name, options={}) {
    const result = templates(name);
    if ( options.member) {
        createMemberActions(result, name, options.member);
    }

    if (options.collection) {
        createCollectionActions(result, name, options.collection);
    }
    return result;
}
