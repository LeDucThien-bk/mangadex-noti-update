const express = require('express')
const axios = require('axios');
const cheerio = require('cheerio');
const bodyParser = require('body-parser');
const util = require('util');
const FormData = require('form-data');

const app = express()
require('dotenv').config();


app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

let cred = {
  cookie1: '',
  cookie2: '',
  cookie3: ''
}

app.get('/getUpdate', function (req, res) {
  let crawlData = [];

  var config = {
    method: 'get',
    url: 'https://mangadex.org/follows',
    headers: {
      'authority': 'mangadex.org',
      'cache-control': 'max-age=0',
      'dnt': '1',
      'upgrade-insecure-requests': '1',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36',
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
      'sec-fetch-site': 'same-origin',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-user': '?1',
      'sec-fetch-dest': 'document',
      'referer': 'https://mangadex.org/',
      'accept-language': 'en-US,en;q=0.9,vi-VN;q=0.8,vi;q=0.7',
      'cookie': `__ddg1=${cred.cookie1}; mangadex_session=${cred.cookie2}; mangadex_rememberme_token=${cred.cookie3}`
    }
  };

  axios(config)
    .then(function (response) {
      const $ = cheerio.load(response.data);
      let update = {};
      $('div.chapter-container')[0].children.forEach(row => {
        if (row.children) {
          row.children.forEach(manga => {
            // console.log(title)
            if (manga.attribs && manga.attribs.class.includes('font-weight-bold')) {
              manga.children.forEach(title => {
                if (title.name == 'a') {
                  if (Object.keys(update).length != 0) {
                    crawlData.push(update)
                  }
                  update = {
                    title: title.attribs.title,
                    updates: []
                  }
                }
              })
            }
            if (manga.attribs && manga.attribs.class.includes('col col-md-9')) {
              manga.children.forEach(chapter => {
                if (chapter.attribs && chapter.attribs.class.includes('chapter-row')) {
                  if (chapter.attribs['data-chapter']) {
                    let temp = {
                      chapterTitle: chapter.attribs['data-title'],
                      chapter: chapter.attribs['data-chapter'],
                      time: chapter.attribs['data-timestamp'],
                      read: false
                    }
                    chapter.children.forEach(read => {
                      if (read.attribs && read.attribs.class == 'col-auto text-center order-lg-1') {
                        read.children.forEach(readStat => {
                          if (readStat.attribs && readStat.attribs.title == 'Mark unread') {
                            temp.read = true
                            update.updates.push(temp);
                          } else if (readStat.attribs && readStat.attribs.title == 'Mark read') {
                            update.updates.push(temp);
                          }
                        })
                      }
                    })
                  }
                }
              })
            }
          })
        }
      })
      res.send(crawlData);
    })
    .catch(function (error) {
      console.log(error);
    });
})


app.post('/setLoginCred', function (req, res) {
  var data = new FormData();
  data.append('login_username', req.body.usr);
  data.append('login_password', req.body.pwd);
  data.append('two_factor', '');
  data.append('remember_me', '1');

  var config = {
    method: 'post',
    url: 'https://mangadex.org/ajax/actions.ajax.php?function=login',
    headers: {
      'authority': 'mangadex.org',
      'accept': '*/*',
      'dnt': '1',
      'x-requested-with': 'XMLHttpRequest',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36',
      'content-type': 'multipart/form-data; boundary=----WebKitFormBoundaryVgfRvhB2OBwq6xTj',
      'origin': 'https://mangadex.org',
      'sec-fetch-site': 'same-origin',
      'sec-fetch-mode': 'cors',
      'sec-fetch-dest': 'empty',
      'referer': 'https://mangadex.org/login',
      'accept-language': 'en-US,en;q=0.9',
      ...data.getHeaders()
    },
    data: data
  };

  axios(config)
    .then(function (response) {
      cred.cookie1 = response.headers["set-cookie"][0].split(/([=;])/g)[2]
      cred.cookie2 = response.headers["set-cookie"][1].split(/([=;])/g)[2]
      cred.cookie3 = response.headers["set-cookie"][2].split(/([=;])/g)[2]
      console.log(cred)
      res.send('ok');
    })
    .catch(function (error) {
      console.log(error);
    });
})

app.listen(process.env.PORT, () => {
  console.log(`Example app listening at http://localhost:${process.env.PORT}`);
})