import nock from 'nock';
console.log(nock);
import { init, Constants } from '../lib/client';
import resource from '../lib/resource';

const FAKE_SERVER = "test.foo.com";
const BASE_URL = `http://${FAKE_SERVER}`;

init(FAKE_SERVER);

describe('create resource with all default actions', () => {
    let res;
    beforeEach(() => {
        res = resource('resource');
    });

    test(" should create functions for standard functions.", () => {
        ['index', 'findOne', 'create', 'update', 'delete'].forEach((name) => {
            expect(res[name]).toBeDefined();
        });
    });
});

describe('created index function ', () => {
    let res = resource('resources');

    describe('without params', () => {
        const scope = nock(BASE_URL)
              .get('/resources.json')
              .reply(200, {success: true, attr: 'val'});

        test('should call correct url without params', done => {
            res.index()
                .then((json) => {
                    expect(json).toEqual({ attr: 'val'});
                    expect(scope.isDone()).toBeTruthy();
                    done();
                });
        });
    });

    describe('with params', () => {
        const scope = nock(BASE_URL)
              .get('/resources.json')
              .query({ page: 1})
              .reply(200, { success: true, attr: 'val'});

        test('should call with correct query params', done=> {
            res.index({ page: 1})
                .then((json) => {
                    expect(json).toEqual({ attr: 'val'});
                    expect(scope.isDone()).toBeTruthy();
                    done();
                });
        });
    });

});

describe('created findOne function', () => {
    let res = resource('resources');
    const id = '101';

    describe('without params', () => {
        const scope = nock(BASE_URL)
              .get('/resources/101.json')
              .reply(200, {success: true, attr: 'val'});

        test('should call correct url without params', done => {
            res.findOne(id)
                .then((json) => {
                    expect(json).toEqual({ attr: 'val'});
                    expect(scope.isDone()).toBeTruthy();
                    done();
                });
        });
    });

    describe('with params', () => {
        const scope = nock(BASE_URL)
              .get('/resources/101.json')
              .query({ f: 1})
              .reply(200, { success: true, attr: 'val'});

        test('should call with correct query params', done=> {
            res.findOne(id, { f: 1})
                .then((json) => {
                    expect(json).toEqual({ attr: 'val'});
                    expect(scope.isDone()).toBeTruthy();
                    done();
                });
        });
    });
});

describe('created create function', () => {
    let res=resource('resources');

    const scope = nock(BASE_URL)
          .post('/resources.json')
          .reply(200, { success: true, id: '101'});

    test('should call with correct query params', done=> {
        res.create({ field: 'value'})
            .then((json) => {
                expect(json).toEqual({ id: '101'});
                expect(scope.isDone()).toBeTruthy();
                done();
            });
    });
});

describe('created update function', () => {
    let res=resource('resources');
    const id="101";

    const scope = nock(BASE_URL)
          .put('/resources/101.json')
          .reply(200, { success: true, id: '101'});

    test('should call correct url with corrent method', done=> {
        res.update(id, { field: 'value'})
            .then((json) => {
                expect(json).toEqual({ id: '101'});
                expect(scope.isDone()).toBeTruthy();
                done();
            });
    });
});

describe('created delete function', () => {
    let res=resource('resources');
    const id="101";

    const scope = nock(BASE_URL)
          .delete('/resources/101.json')
          .reply(200, { success: true });

    test('should call with corrent url and method', done=> {
        res.delete(id)
            .then((json) => {
                expect(scope.isDone()).toBeTruthy();
                done();
            });
    });
});

describe('generate function for member action', () => {
    let res=resource('resources', {
        member: ['query', { action: 'act', method: Constants.POST}]
    });

    let id="101";

    describe('without specifiy method', () => {
        const scope = nock(BASE_URL)
              .get('/resources/101/query.json')
              .query({ field: 'value'})
              .reply(200, { success: true });

        test('should call with correct url and method', done=> {
            res.query(id, { field: 'value' })
                .then(() => {
                    expect(scope.isDone()).toBeTruthy();
                    done();
                });
        });
    });

    describe('not default method', () => {
        const scope = nock(BASE_URL)
              .post('/resources/101/act.json')
              .reply(200, { success: true });

        test('should call with correct url and method', done=> {
            res.act(id, { field: 'value' })
                .then(() => {
                    expect(scope.isDone()).toBeTruthy();
                    done();
                });
        });
    });
});


describe('generate function for collection action', () => {
    let res=resource('resources', {
        collection: ['query', { action: 'act', method: Constants.POST}]
    });
    describe('without specifiy method', () => {
        const scope = nock(BASE_URL)
              .get('/resources/query.json')
              .query({ field: 'value'})
              .reply(200, { success: true });

        test('should call with correct url and method', done=> {
            res.query({ field: 'value' })
                .then(() => {
                    expect(scope.isDone()).toBeTruthy();
                    done();
                });
        });
    });

    describe('not default method', () => {
        const scope = nock(BASE_URL)
              .post('/resources/act.json')
              .reply(200, { success: true });

        test('should call with correct url and method', done=> {
            res.act({ field: 'value' })
                .then(() => {
                    expect(scope.isDone()).toBeTruthy();
                    done();
                });
        });
    });
});
