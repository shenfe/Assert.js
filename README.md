# Assert.js

数据格式断言。

## Installation

```bash
$ npm install --save azzert
```

## Usage

```js
const assert = require('azzert');

function someFunction(data) {
    assert(data, {
        id: 'n',
        name: 's,r'
        phones: ['s,r']
    });
    // ...
}
```

## 断言语法（assertion schema）说明

### 基本语法（primary schema）

适用于对基本数据类型的字段值的检查断言，定义形式为一个字符串。由b、n、s分别表示boolean、number、string三种基本类型；通过r标识该字段是否是可选，没有r标识则默认为必需字段。基本类型之间用':'分隔，r标识用'r'写在基本类型之后，用','分隔。

示例：

    'b'       // 布尔值；必需字段
    'b,r'     // 布尔值；可选字段
    'n:s'     // 数值或字符串；必需字段
    'b:n:s'   // 布尔值或数值或字符串；必需字段
    's:n,r'   // 字符串或数值；可选字段

### 映射型语法（map-built schema）

适用于对object类型的字段值的检查断言，定义形式为一个object。每个字段名对应一个语法。

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

### 列表型语法（list-built schema）

适用于对array类型的字段值的检查断言，定义形式为一个array。该数组可以有两个元素；第一个是每个元素的schema定义，是必需的；第二个是要求该字段必传且必须是数组，通过f或F标识，且F强制允许空数组。

示例：

    [ 'n', 'f' ]                 // 数值型数组；数组不可空，字段必需；此时f标识可有可无
    [ 'n', 'F' ]                 // 数值型数组；数组可空，字段必需；相较于['n']，F标识强行允许了数组为空的情况，不论元素的schma是否允许空值
    [ 'n' ]                      // 数值型数组；数组不可空，字段必需
    [ 'n,r', 'f' ]               // 数值型数组；数组可空，字段必需；此时数组可空是由元素schma允许空值所决定的
    [ 'n,r' ]                    // 数值型数组；数组可空，字段可选
    [ { id: 's', name: 's,r' } ] // 对象型数组；元素对象至少有id字段 => 数组不可空 => 字段必需
    [ { id: 's,r' } ]            // 对象型数组；元素对象可空 => 数组可空 => 字段可选
    [ [ 'n' ] ]                  // 数值型二维数组；不含有空数组

### 检查函数

直接定义一个纯函数，输入为单个字段值，输出为布尔值。

## License

[MIT](http://opensource.org/licenses/MIT)

Copyright © 2016-present, [shenfe](https://github.com/shenfe)
