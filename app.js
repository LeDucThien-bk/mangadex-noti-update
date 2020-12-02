const axios = require('axios');
const cheerio = require('cheerio');
const util = require('util');
require('dotenv').config();

let crawlData = [];
let count = 0;

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
    'cookie': process.env.COOKIE
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
    console.log(util.inspect(crawlData, false, null, true))
  })
  .catch(function (error) {
    console.log(error);
  });