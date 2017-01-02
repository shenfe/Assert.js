/*jslint browser: true, vars: true, nomen: true, for: false, indent: 4, maxlen: 180, plusplus: true, sloppy: true, newcap: true, sub: true, regexp: true, continue: true, forin: true*/
/*global console: true, changyan: true, _: true, module: true*/


/**
 * @Author: Ke Shen <hengwu>
 * @Date:   2016-11-20
 * @Email:  keshen@sohu-inc.com
 * @Project: Assert
 * @Last modified by:   hengwu
 * @Last modified time: 2016-11-20 14:35:29
 */


/**************** 断言语法（assertion schema）说明 ****************

1.  基本语法（primary schema）
    适用于对基本数据类型的字段值的检查断言，定义形式为一个字符串。
    由b、n、s分别表示boolean、number、string三种基本类型；
    通过r标识该字段是否是可选，没有r标识则默认为必需字段。
    基本类型之间用':'分隔，r标识用'r'写在基本类型之后，用','分隔。
    示例：
        'b'       // 布尔值；必需字段
        'b,r'     // 布尔值；可选字段
        'n:s'     // 数值或字符串；必需字段
        'b:n:s'   // 布尔值或数值或字符串；必需字段
        's:n,r'   // 字符串或数值；可选字段

2.  映射型语法（map-built schema）
    适用于对object类型的字段值的检查断言，定义形式为一个object。
    每个字段名对应一个语法。
    示例：
        // 新建或编辑用户信息时：
        // id是可选字段，可为数字或字符串；传入id字段则表示编辑，否则表示新建。
        // info是必需字段；其中用户名name是必需字段；手机列表phones是可选字段；
        // address是可选字段，其中省、市、区字段都是字符串且可选。
        {
            id: 's:n,r',
            info: {
                name: 's',
                phones: [ 's,r' ],
                address: {
                    province: 's,r',
                    city: 's,r',
                    district: 's,r'
                }
            }
        }

3.  列表型语法（list-built schema）
    适用于对array类型的字段值的检查断言，定义形式为一个array。
    该数组可以有两个元素；第一个是每个元素的schema定义，是必需的；第二个是要求
    该字段必传且必须是数组，通过f或F标识，且F强制允许空数组。
    示例：
        [ 'n', 'f' ]                 // 数值型数组；数组不可空，字段必需；此时f标识可有可无
        [ 'n', 'F' ]                 // 数值型数组；数组可空，字段必需；相较于['n']，F标识强行允许了数组为空的情况，不论元素的schma是否允许空值
        [ 'n' ]                      // 数值型数组；数组不可空，字段必需
        [ 'n,r', 'f' ]               // 数值型数组；数组可空，字段必需；此时数组可空是由元素schma允许空值所决定的
        [ 'n,r' ]                    // 数值型数组；数组可空，字段可选
        [ { id: 's', name: 's,r' } ] // 对象型数组；元素对象至少有id字段 => 数组不可空 => 字段必需
        [ { id: 's,r' } ]            // 对象型数组；元素对象可空 => 数组可空 => 字段可选
        [ [ 'n' ] ]                  // 数值型二维数组；不含有空数组

4.  检查函数
    直接定义一个纯函数，输入为单个字段值，输出为布尔值。

 *******************************************************************/


/**
 * Get the type of a value.
 * @param  {*} v    any value
 * @return {String} undefined|null|boolean|number|string|object|array|date|function
 */
var getTypeOf = function (v) {
    var type = Object.prototype.toString.call(v);
    return type.substring(8, type.length - 1).toLowerCase();
};

/**
 * Error information table.
 * @type {Object}
 */
var errorInfo = {
    invalidSchema: 'schema is invalid',
    wrongType: 'type of value is wrong',
    emptyValue: 'value cannot be null or undefined',
    missingProperty: 'property is missing',
    uselessProperty: 'property is redundant',
    emptyArray: 'array cannot be empty',
    wrongTypeElement: 'type of element is wrong',
    emptyElementValue: 'value of element cannot be null or undefined',
    functionNotPass: 'has not passed the checking function',
    arrayMustBeArray: 'array should be an empty array at least'
};

/**
 * Default assertion options.
 * @type {Object}
 */
var assertOptions = {
    debug: true, /* whether to print debug info or not */
    allowUselessProperty: false /* whether to allow useless properties or not */
};

/**
 * Check a schema and return its runner function.
 * @param  {*} schema           a schema (primary, or map-built, or list-built), or a function
 * @return {Function|String}    a function whose input is a parameter of some api method
 *                                and output is whether the parameter's structure is legal, if
 *                                legal then return TRUE, else return error information;
 *                              or some error information about the schema.
 */
var checkSchema = function (schema) {
    var schemaType = getTypeOf(schema);
    switch (schemaType) {
    case 'string': /* be a primary schema */
        var twoPartsOfPrimSchema = schema.split(',');
        if (twoPartsOfPrimSchema.length > 2) {
            return errorInfo.invalidSchema;
        }
        var propForced = true;
        if (twoPartsOfPrimSchema.length === 2) {
            if (twoPartsOfPrimSchema[1] !== 'r') {
                return errorInfo.invalidSchema;
            }
            propForced = false;
        }
        var allowedPrimaryTypes = twoPartsOfPrimSchema[0].split(':'),
            typeMap = { b: 'boolean', n: 'number', s: 'string' },
            flag = {},
            i,
            len;
        for (i = 0, len = allowedPrimaryTypes.length; i < len; i++) {
            var char = allowedPrimaryTypes[i];
            switch (char) {
            case 'b':
            case 'n':
            case 's':
                if (flag[typeMap[char]]) {
                    return errorInfo.invalidSchema; /* already exists */
                }
                flag[typeMap[char]] = true;
                break;
            default:
                return errorInfo.invalidSchema;
            }
        }
        return function (v) { /* this function will return TRUE or error info */
            if (v === null || v === undefined) {
                if (propForced) {
                    return errorInfo.emptyValue;
                }
                return true;
            }
            var result = !!flag[getTypeOf(v)];
            if (!result) {
                return errorInfo.wrongType;
            }
            return true;
        };
    case 'object': /* be a map-built schema */
        var schemaTable = {},
            propName;
        for (propName in schema) {
            if (!schema.hasOwnProperty(propName)) {
                return errorInfo.invalidSchema;
            }
            var checkPropSchema = checkSchema(schema[propName]);
            if (typeof checkPropSchema !== 'function') {
                return errorInfo.invalidSchema;
            }
            schemaTable[propName] = checkPropSchema;
        }
        return function (obj) { /* this function will return TRUE or error info */
            var isNull = (obj === null || obj === undefined),
                target;
            if (!isNull) {
                var objType = getTypeOf(obj);
                if (objType !== 'object') {
                    return errorInfo.wrongType;
                }
                target = obj;
            } else {
                target = {};
            }
            var propName, propResult, ifPropError = false, propErrors = {};
            for (propName in schemaTable) {
                propResult = schemaTable[propName](target[propName]);
                if (propResult !== true) {
                    ifPropError = true;
                    propErrors[propName] = propResult;
                }
            }
            /* now all props are checked, time to check the existence of useless properties */
            if (!assertOptions.allowUselessProperty) {
                for (propName in target) {
                    if (!target.hasOwnProperty(propName) || !schemaTable[propName]) {
                        ifPropError = true;
                        propErrors[propName] = errorInfo.uselessProperty;
                    }
                }
            }

            if (!ifPropError) {
                return true;
            }
            return propErrors;
        };
    case 'array': /* be a list-built schema */
        if (schema.length === 0 || schema.length > 2) {
            return errorInfo.invalidSchema;
        }
        var elementForced = 0;
        if (schema.length === 2) {
            if (schema[1] === 'f') {
                elementForced = 1;
            } else if (schema[1] === 'F') {
                elementForced = 2;
            } else {
                return errorInfo.invalidSchema;
            }
        }
        var checkElementSchema = checkSchema(schema[0]);
        if (typeof checkElementSchema !== 'function') {
            return errorInfo.invalidSchema;
        }
        return function (arr) { /* this function will return TRUE or error info */
            var isNull = (arr === null || arr === undefined),
                elementNullable = (checkElementSchema(null) === true);
            if (isNull) {
                if (elementForced > 0) { /* 如果schema有强制标识，则字段是空值将返回错误 */
                    return errorInfo.arrayMustBeArray;
                }
                if (!elementNullable) { /* 如果元素不允许空值，则字段空值将返回错误 */
                    return errorInfo.arrayMustBeArray;
                }
                return true; /* 如果元素允许空值，则字段空值被允许 */
            }
            var arrType = getTypeOf(arr);
            if (arrType !== 'array') {
                return errorInfo.arrayMustBeArray;
            }
            if (arr.length === 0) {
                if (elementNullable || elementForced === 2) { /* 如果元素允许空值，或者有F标识，则返回正确 */
                    return true;
                }
                return errorInfo.emptyArray;
            }
            var target = arr;

            /* 现在，target是非空数组，只需要检查每个元素是否符合元素的schema */

            var elementErrors = {},
                ifElementError = false,
                elementResult,
                i,
                len;
            for (i = 0, len = target.length; i < len; i++) {
                elementResult = checkElementSchema(target[i]);
                if (elementResult !== true) {
                    elementErrors[i] = elementResult;
                    ifElementError = true;
                } else if (target[i] === null || target[i] === undefined) {
                    elementErrors[i] = errorInfo.emptyElementValue; /* 非空数组的元素不能是无意义值 */
                    ifElementError = true;
                }
            }
            if (!ifElementError) {
                return true;
            }
            return elementErrors;
        };
    case 'function': /* be a checking method */
        return schema;
    default:
        return errorInfo.invalidSchema;
    }
};

/**
 * Assert, to see whether the value matches the schema.
 * @param  {*} value                                the value to be checked
 * @param  {String|Object|Array|Function} schema    the schema to be applied
 * @return {Boolean}                                the result
 */
var assert = function (value, schema, options) {
    if (options && options.allowMore) {
        assertOptions.allowUselessProperty = true;
    }
    var check = checkSchema(schema);
    if (typeof check !== 'function') {
        if (assertOptions.debug) {
            console.error('[invalid schema]', check, schema);
        }
        return false;
    }
    var result = check(value);
    if (result !== true && assertOptions.debug) {
        console.error('[assert failed]', result);
        console.debug('value:', value, 'schema:', schema);
    }
    return (result === true);
};

module.exports = assert;