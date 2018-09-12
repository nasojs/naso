const Sequelize = require('sequelize')

const { Naso, Model, Controller, Interceptor, Service, Router, Middleware } = require('../dist')

const { Table, Field, SQL, Method } = Model

@Model
@Table('user')
@Field('id', {
  type: Sequelize.INTEGER,
  primaryKey: true,
  autoIncrement: true
  })
@Field('name', Sequelize.STRING)
class M {
  @SQL
  findAll () {
    return 'SELECT * FROM `user`'
  }

  @SQL
  findAllAndCount () {
    return ['SELECT COUNT(*) AS count FROM `user`', 'SELECT * FROM `user`']
  }

  @Method
  sayHello () {
    console.log('hello !')
  }
}

@Controller
class C {
  helloWorld (ctx, next) {
    ctx.body = 'hello world!'
  }

  hello (ctx, next) {
    ctx.body = 'hello'
    next()
  }

  world (ctx, next) {
    ctx.body = ctx.body + ' world!'
  }
}

const { ServerBeforeStart, ServerStarted } = Interceptor

@Interceptor
class I1 {
  @ServerBeforeStart
  sayHello1 () {
    console.log('I1, hello1 !')
  }

  @ServerStarted
  sayHello2 () {
    console.log('I1, hello2 !')
  }
};

@Interceptor
class I2 {
  @ServerBeforeStart
  sayHello1 () {
    console.log('I2, hello1 !')
  }

  @ServerStarted
  sayHello2 () {
    console.log('I2, hello2 !')
  }
};

@Service
class S {
  sayHello () {
    console.log('hello !')
  }
}

Router
  .get('/').to(({ controller }) => controller.C.helloWorld)
  .get('/helloWorld').to(({ controller }) => [
    controller.C.hello,
    controller.C.world
  ])
  .all('/user/:id').to(() => async function (ctx, next) {
    ctx.body = (await ctx.model.M.find({ where: { id: ctx.params.id } })) || 'not found user'
  })
  .post('/user').to(() => async function (ctx, next) {
    ctx.body = (await ctx.model.M.find({ where: { id: ctx.request.body.id } })) || 'not found user'
  })
  .get('/sql/1').to(() => async function (ctx, next) {
    ctx.body = await ctx.model.M.SQL.findAll()
  })
  .get('/sql/2').to(() => async function (ctx, next) {
    const [ count, users ] = await Promise.all(ctx.model.M.SQL.findAllAndCount())
    ctx.body = { count, users }
  })
  .all('/error').to(() => function (ctx, next) {
    ctx.error('test error message')
    console.log('not run here')
  })
  .get('/ejs').to(() => async function (ctx, next) {
    await ctx.render('a', { msg: ctx.controller.C.sayHello() })
  })
  .get('/store').to(() => async function (ctx, next) {
    !ctx.store.code && (ctx.store.code = 0)
    ctx.body = ++ctx.store.code
  })
  .get('/jwt/sign/:code').to(() => async function (ctx, next) {
    ctx.body = ctx.jwt.sign(ctx.params.code)
  })
  .get('/jwt/verify/:token').to(() => async function (ctx, next) {
    ctx.body = ctx.jwt.verify(ctx.params.token)
  })
  .get('/session').to(() => async function (ctx, next) {
    !ctx.session.code && (ctx.session.code = 0)
    ctx.body = ++ctx.session.code
  })
  .get('/io').to(() => async function (ctx, next) {
    ctx.body = !!ctx.io
  })

Middleware
  .add((app, config) => async (ctx, next) => {
    console.log('middle ware 1')
    await next()
  })
  .add((app, config) => console.log('middle ware 2'))

const naso = new Naso()

naso.start()
