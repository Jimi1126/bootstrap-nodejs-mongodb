# EPCOS
## 下载与解析模块
  本模块主要提供EP系统下载与解析图片功能。
  模块采用策略模式、代理模式、责任链模式、观察者模式设计，尽可能的将业务与逻辑分离，降低系统耦合度，符合高内聚、低耦合的设计思想，符合设计模式的职责单一、开闭原则、接口隔离等设计原则，具有高灵活、易拓展、易维护等优点。
### 接口说明
![](./doc/downAndParseClassDiagram.jpg)
#### Context 上下文接口
  对业务逻辑进行二次封装，避免高层模块对业务对象的直接调用<br/>
  **属性：**<br/>
  ——<br/>
  **方法：**<br/>
  ——
*******
#### Istrategy 策略接口
  根据不同业务制定不同策略，执行不同逻辑，进行模块化<br/>
  **属性：**<br/>
  ——<br/>
  **方法：**
  - exec<br/>
    策略执行入口，控制整个策略的启动模式
---
#### Proxy 代理接口
  通过传入目标对象实例化代理类，外部通过该代理间接访问目标对象
  我们可以通过该代理来规范外部的访问、提供安全的调用、丰富目标对象的行为
  通常我们需要通过继承该类来制定不同类型的对象的代理，否则外部访问与直接访问目标对象无异
  鉴于javaScript弱类型的特征，建议在子类中做类型限制，使代理模块化<br/>
  **属性：**
  - target 目标对象<br/>
  **方法：**
  - instance<br/>
    实例化代理过程，通过遍历目标对象以及递归原型链，对目标对象的行为进行封装，默认地，只对目标对象的行为进行封装代理，如果你需要代理目标对象的属性或  更多的功能，可以覆盖该过程
  - proxy
    目标对象行为的封装，默认地除了目标对象行为，不做其他操作，你需要在子类中覆盖该方法，制定需要类型的对象行为封装
---
#### Handler 操作接口
  通过继承EventEmitter的事件响应机制，实现观察者模式以及操作链模式<br/>
  一个操作者需要具备以下几点：
  1. 执行操作的能力
  2. 判断可以操作的能力
  3. 当执行模式为操作链模式，还需要知道相邻的上、下位操作者<br/>
  **属性：**
  - lastHandler 上一位操作者
  - nextHandler 下一位操作者<br/>
  **方法：**
  - execute<br/>
    操作入口，控制操作者的执行模式，默认地，操作者会通过verify来判断的自身是否应该进行操作，当可以进行操作时，调用handle主操作方法，当操作完成后，通过触发next事件来通知下一位操作者，你可在子类中覆盖该方法，以重新控制操作者的执行模式。
  - verify<br/>
    判断是否应该做操作，默认地返回true，具体判断逻辑请覆盖该方法
  - handle<br/>
    操作者所拥有的操作能力，子类必须实现该方法，以指定操作者的拥有的操作能力
---
#### Dao 数据库操作层接口
  提供各类型数据库操作对象<br/>
  **属性：**<br/>
  ——<br/>
  **方法：**<br/>
  ——
### 逻辑说明
#### 预下载策略
  预下载策略采用操作链模式，延伸于责任链模式，不同于责任链模式的是，操作链模式节点在操作完成后不会退出模式，而是继续传递到下一个节点，直到链尾
#### 下载策略
  下载策略也是采用操作链模式，下载策略采用async模块提供的series方法进行流程控制，由中间函数next通知下一位操作者，于是我们只需将操作者的执行方法交给async就行了<br/>
  **注意：**<br/>
  下载策略需用到预下载中的业务数据，将下载策略对象的业务数据引用指向预下载策略对象中的业务数据时，操作者所持有的业务数据对象引用也应该重新指向下载策略的业务数据
  
