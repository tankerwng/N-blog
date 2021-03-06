var crypto = require('crypto'),
    User = require('../models/user.js'),
    Post = require('../models/post.js'),
    Comment = require('../models/comment.js');

module.exports = function(app){
　app.get('/', function(req,res){
    //判断是否是第一页，并把请求的页数转换成 number 类型
    var page = req.query.p?parseInt(req.query.p):1;
    //查询并返回第 page 页的10篇文章
    Post.getTen(null, page, function(err, posts){
      if(err){
        posts = [];
      } 
      res.render('index',{
        title: '主页',
        user: req.session.user,
        posts: posts,
        page: page,
        postsLen: posts.length,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });

  app.get('/reg', checkNotLogin);
  app.get('/reg',function(req,res){
    res.render('reg', {
      title: '注册',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });

  app.post('/reg', checkNotLogin);
　app.post('/reg', function(req,res){
    var name = req.body.name,
        password = req.body.password,
        password_re = req.body['password-repeat'];
    //检验用户两次输入的密码是否一致
    if(password_re != password){
      req.flash('error','两次输入的密码不一致!'); 
      return res.redirect('/reg');
    }
    //生成密码的散列值
    var md5 = crypto.createHash('md5'),
        password = md5.update(req.body.password).digest('hex');
    var newUser = new User({
        name: req.body.name,
        password: password,
        email: req.body.email
    });
    //检查用户名是否已经存在 
    User.get(newUser.name, function(err, user){
      if(user){
        err = '用户已存在!';
      }
      if(err){
        req.flash('error', err);
        return res.redirect('/reg');
      }
      //如果不存在则新增用户
      newUser.save(function(err){
        if(err){
          req.flash('error',err);
          return res.redirect('/reg');
        }
        req.session.user = newUser;//用户信息存入 session
        req.flash('success','注册成功!');
        res.redirect('/');
      });
    });
  });

  app.get('/login', checkNotLogin);
　app.get('/login', function(req, res){
    res.render('login',{
      title: '登录',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    }); 
  });

  app.post('/login', checkNotLogin);
  app.post('/login', function(req, res){
    //生成密码的散列值
    var md5 = crypto.createHash('md5'),
        password = md5.update(req.body.password).digest('hex');
    //检查用户是否存在
    User.get(req.body.name, function(err, user){
      if(!user){
        req.flash('error', '用户不存在!'); 
        return res.redirect('/login'); 
      }
      //检查密码是否一致
      if(user.password != password){
        req.flash('error', '密码错误!'); 
        return res.redirect('/login');
      }
      //用户名密码都匹配后，将用户信息存入 session
      req.session.user = user;
      req.flash('success','登陆成功!');
      res.redirect('/');
    });
  });

  app.get('/post', checkLogin);
  app.get('/post',function(req,res){
    res.render('post', {
      title: '发表',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });

  app.post('/post', checkLogin);
  app.post('/post', function(req, res){
    var currentUser = req.session.user,
        post = new Post(currentUser.name, req.body.title, req.body.post);
    post.save(function(err){
      if(err){
        req.flash('error', err); 
        return res.redirect('/');
      }
      req.flash('success', '发布成功!');
      res.redirect('/');
    });
  });
  
  app.get('/logout', checkLogin);
  app.get('/logout', function(req, res){
    req.session.user = null;
    req.flash('success','登出成功!');
    res.redirect('/');
  });

  app.get('/archive', function(req,res){
    Post.getArchive(function(err, posts){
      if(err){
        req.flash('error',err); 
        return res.redirect('/');
      }
      res.render('archive',{
        title: '存档',
        posts: posts,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });

  app.get('/:name', function(req,res){
    var page = req.query.p?parseInt(req.query.p):1;
    //检查用户是否存在
    User.get(req.params.name, function(err, user){
      if(!user){
        req.flash('error','用户不存在!'); 
        return res.redirect('/');
      }
      //查询并返回该用户第 page 页的10篇文章
      Post.getTen(user.name, page, function(err, posts){
        if(err){
          req.flash('error',err); 
          return res.redirect('/');
        } 
        res.render('user',{
          title: user.name,
          posts: posts,
          page: page,
          postsLen: posts.length,
          user : req.session.user,
          success : req.flash('success').toString(),
          error : req.flash('error').toString()
        });
      });
    }); 
  });

  app.get('/:name/:day/:title', function(req,res){
    Post.getOne(req.params.name, req.params.day, req.params.title, function(err, post){
      if(err){
        req.flash('error',err); 
        return res.redirect('/');
      }
      res.render('article',{
        title: req.params.title,
        post: post,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });
  app.post('/:name/:day/:title', function(req,res){
    var date = new Date(),
        time = date.getFullYear() + "-" + (date.getMonth()+1) + "-" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes(),
        comment = {"name":req.body.name, "email":req.body.email, "website":req.body.website, "time":time, "content":req.body.content};
    var newComment = new Comment(req.params.name, req.params.day, req.params.title, comment);
    newComment.save(function(err){
      if(err){
        req.flash('error',err); 
        return res.redirect('/');
      }
      req.flash('success', '留言成功!');
      res.redirect('back');
    });
  });
};

function checkLogin(req, res, next){
  if(!req.session.user){
    req.flash('error','未登录!'); 
    return res.redirect('/login');
  }
  next();
}

function checkNotLogin(req,res,next){
  if(req.session.user){
    req.flash('error','已登录!'); 
    return res.redirect('/');
  }
  next();
}