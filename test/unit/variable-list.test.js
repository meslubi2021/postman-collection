var expect = require('expect.js'),
    sdk = require('../../'),
    VariableList = sdk.VariableList;

/* global describe, it */
describe('VariableList', function () {
    it('should resolve a single reference properly', function () {
        var list = new VariableList(null, [{
            key: 'somevar',
            value: 'asdasd'
        }, {
            key: 'root',
            value: 'one'
        }]);

        expect(list.one('root').valueOf()).to.eql('one');
    });

    it('must support function variables', function () {
        var list = new VariableList(null, [{
                key: 'somevar',
                value: 'asdasd'
            }, {
                key: 'root',
                value: 'one'
            }, {
                key: 'third',
                value: 'in 3rd layer'
            }]),

            unresolved = {
                xyz: '{{$guid}}\n{{$timestamp}}\n{{somevar}}\n{{third}}'
            },
            resolved = list.substitute(unresolved),
            values = resolved.xyz.split('\n'),
            expectations = [
                /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i, // GUID
                /^\d+$/, // A number, without decimals
                /asdasd/,
                /in 3rd layer/
            ];
        expectations.forEach(function (regex, index) {
            expect(regex.test(values[index])).to.be(true);
        });
    });

    it('should recursively resolve regular variables', function () {
        var unresolved = {
                xyz: '{{alpha}}'
            },
            mylist = new VariableList(null, [{
                key: 'alpha',
                value: '{{beta}}-bar'
            }, {
                key: 'beta',
                value: '{{name}}'
            }, {
                key: 'name',
                value: 'foo'
            }]),
            resolved = mylist.substitute(unresolved);
        expect(resolved.xyz).to.eql('foo-bar');
    });

    it('should correctly resolve variables with a forward slash in their name', function () {
        var unresolved = {
                xyz: '{{alp/ha}}'
            },
            mylist = new VariableList(null, [{
                key: 'alp/ha',
                value: 'beta'
            }]),
            resolved = mylist.substitute(unresolved);
        expect(resolved.xyz).to.eql('beta');
    });

    it('should correctly resolve variables with a backslash in their name', function () {
        var unresolved = {
                // eslint-disable-next-line no-useless-escape
                xyz: '{{al\pha}}'
            },
            mylist = new VariableList(null, [{
                key: 'al\pha', // eslint-disable-line no-useless-escape
                value: 'beta'
            }]),
            resolved = mylist.substitute(unresolved);
        expect(resolved.xyz).to.eql('beta');
    });

    it('should correctly handle cyclic resolution loops', function () {
        var unresolved = {
                xyz: '{{alpha}}'
            },
            cyclicList = new VariableList(null, [{
                key: 'alpha',
                value: '{{beta}}'
            }, {
                key: 'beta',
                value: '{{gamma}}'
            }, {
                key: 'gamma',
                value: '{{delta}}'
            }, {
                key: 'delta',
                value: '{{beta}}'
            }]),
            resolved = cyclicList.substitute(unresolved);
        expect(resolved.xyz).to.eql('{{beta}}');
    });

    it('should correctly handle poly chained variable resolution(s)', function () {
        var unresolved = {
                xyz: '{{alpha}}'
            },
            polyChainList = new VariableList(null, [{
                key: 'alpha',
                value: '{{beta-{{gamma}}}}'
            }, {
                key: 'gamma',
                value: 'delta'
            }, {
                key: 'beta-delta',
                value: 'epsilon'
            }]),
            resolved = polyChainList.substitute(unresolved);
        expect(resolved.xyz).to.eql('epsilon');
    });

    it('should correctly handle recursive poly chained variable resolution(s)', function () {
        var unresolved = {
                xyz: '{{alpha}}'
            },
            polyChainList = new VariableList(null, [{
                key: 'alpha',
                value: '{{beta-{{gamma}}}}'
            }, {
                key: 'gamma',
                value: 'delta'
            }, {
                key: 'beta-delta',
                value: '{{gamma}}'
            }]),
            resolved = polyChainList.substitute(unresolved);
        expect(resolved.xyz).to.eql('delta');
    });

    it('should correctly handle nested variable resolutions', function () {
        var unresolved = {
                xyz: '{{a}}'
            },
            polyChainList = new VariableList(null, [{
                key: 'a',
                value: '{{b{{c{{d}}}}}}'
            }, {
                key: 'd',
                value: 'e'
            }, {
                key: 'ce',
                value: 'f'
            }, {
                key: 'b',
                value: 'g'
            }, {
                key: 'bf',
                value: 'z'
            }]),
            resolved = polyChainList.substitute(unresolved);
        expect(resolved.xyz).to.eql('z');
    });

    it.skip('should correctly handle variables with single braces in their name', function () {
        var unresolved = {
                xyz: '{{alpha}}'
            },
            polyChainList = new VariableList(null, [], [
                {
                    alpha: '{{be{t}a}}',
                    'be{t}a': 'gamma',
                    gamma: 'delta'
                }
            ]),
            resolved = polyChainList.substitute(unresolved);
        expect(resolved.xyz).to.eql('delta');
    });

    describe('sanity', function () {
        it('constructor must be exported', function () {
            expect(VariableList).to.be.a('function');
        });

        it('should create a new instance', function () {
            var parent = {},
                v = new VariableList(parent, [{
                    key: 'somevar',
                    value: 'asdasd'
                }, {
                    key: 'root',
                    value: 'one'
                }, {
                    key: 'third',
                    value: 'in 3rd layer'
                }]);
            expect(v instanceof VariableList).to.be.ok();
        });

        it('should store variables as an object as well', function () {
            var parent = {},
                v = new VariableList(parent, [{
                    key: 'somevar',
                    value: 'asdasd'
                }, {
                    key: 'root',
                    value: 'one'
                }, {
                    key: 'third',
                    value: 'in 3rd layer'
                }]);
            expect(v.reference).to.be.an('object');
        });
    });

    describe('static helpers', function () {
        var variableList = new VariableList();

        it('should work correctly for isVariableList', function () {
            expect(VariableList.isVariableList(variableList)).to.be(true);
            expect(VariableList.isVariableList({})).to.be(false);
            expect(VariableList.isVariableList()).to.be(false);
        });
    });

    describe('.syncFromObject', function () {
        it('should bail out if no source object has been provided', function () {
            var list = new VariableList(null, [
                { key: 'foo', value: 'bar' }
            ]);

            expect(list.syncFromObject()).to.be(undefined);
            expect(list.reference).to.eql({
                foo: {
                    key: 'foo',
                    value: 'bar',
                    type: 'any'
                }
            });
        });
    });

    describe('.syncToObject', function () {
        it('should use a default blank target object if the provided target is not an object', function () {
            var list = new VariableList(null, [
                { key: 'foo', value: 'bar' }
            ]);

            expect(list.syncToObject()).to.eql({
                foo: 'bar'
            });
        });
    });

    describe('.replace', function () {
        it('should correctly replace variable tokens in the provided string', function () {
            var list = new VariableList(null, [
                { key: 'foo', value: 'bar' }
            ]);

            expect(list.replace('{{foo}}')).to.be('bar');
        });
    });
});
