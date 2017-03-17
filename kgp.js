var Nightmare = require('nightmare');       
var vo = require('vo')
var mainUrl = 'http://kgp2016.highlight.hk/web/school.php?lang=tc&district=yuenlong';
var json2xls = require('json2xls');
var fs = require('fs');
var ProgressBar = require('progress');

//Generate banner text
var AsciiBanner = require('ascii-banner');  
AsciiBanner
.write('KGP Downloader')
.color('green')
.font('Thin')
.after('>v{{version}}', 'yellow')
.before('>[{{name}}<')
.out();

vo(run)(function(err, result) {
  if (err) throw err
})


function *run() {
  var nightmare = Nightmare({ show: false });
  var value = yield nightmare
  .goto(mainUrl)
  .wait()
  //.click('.font_content_school_list:nth-child('+index+') td')
  //.wait('.font_content_schoolinfo tbody > tr > td')
  .wait('.Font_Title_Join_Scheme_TC')
  .evaluate(function () {
    var indexId = [];
    var initVal = 0;

    [].forEach.call(
      document.querySelectorAll('.font_content_school_list td'), 
      function(el){
        indexId.push(initVal+=3);
      }
    );

    return indexId;
    //return document.querySelector('.font_content_schoolinfo tbody > tr > td').textContent;
  });

  //yield nightmare.end()

  //console.log(value);
  yield getDetail(value);
  yield nightmare.end()
}

function *getDetail(arr){
  var detailJsonArr = [];
  var bar = new ProgressBar('downloading content [:bar] :percent :etas', {
    complete: '=',
    incomplete: ' ',
    width: 20,
    total: arr.length
  });

  for(i=0; i<arr.length; i++){
      //console.log(arr[i]);
      var nightmare = Nightmare({ show: false });
    var detailJson = yield nightmare
    .goto(mainUrl)
    .wait(10)
    .click('.font_content_school_list:nth-child('+arr[i]+') td')
    .wait('.font_content_schoolinfo tbody > tr > td')
    .evaluate(function () {   
      var schlName = document.querySelector('.font_content_schoolinfo tbody > tr > td').textContent.replace(/(\r\n|\n|\r|\t)/g,"");
      var schlAddr = document.querySelector('.font_content_schoolinfo tbody > tr:nth-child(3) > td:last-child').textContent.replace(/(\r\n|\n|\r|\t)/g,"");
      var tel = document.querySelector('.font_content_schoolinfo tbody > tr:nth-child(5) > td:last-child').textContent.replace(/(\r\n|\n|\r|\t)/g,"");
      var createYr = document.querySelector('.font_content_box > tbody > tr:nth-child(5) > td:nth-child(2)').textContent.replace(/(\r\n|\n|\r|\t)/g,"");
      var website = document.querySelector('.font_content_box > tbody > tr:nth-child(13) > td:nth-child(2)').textContent.replace(/(\r\n|\n|\r|\t)/g,"");
      var feeAM = document.querySelector('body > table > tbody > tr > td > table > tbody > tr:nth-child(3) > td > table:nth-child(3) > tbody > tr > td:nth-child(2) > table > tbody > tr > td > table > tbody > tr:nth-child(2) > td > table > tbody > tr:nth-child(1) > td > table > tbody > tr > td > table:nth-child(23) > tbody > tr:nth-child(6) > td:nth-child(3)').textContent.replace(/(\r\n|\n|\r|\t)/g,"");
      var feePM = document.querySelector('body > table > tbody > tr > td > table > tbody > tr:nth-child(3) > td > table:nth-child(3) > tbody > tr > td:nth-child(2) > table > tbody > tr > td > table > tbody > tr:nth-child(2) > td > table > tbody > tr:nth-child(1) > td > table > tbody > tr > td > table:nth-child(23) > tbody > tr:nth-child(7) > td:nth-child(2)').textContent.replace(/(\r\n|\n|\r|\t)/g,"");
      var feeWholeDay = document.querySelector('body > table > tbody > tr > td > table > tbody > tr:nth-child(3) > td > table:nth-child(3) > tbody > tr > td:nth-child(2) > table > tbody > tr > td > table > tbody > tr:nth-child(2) > td > table > tbody > tr:nth-child(1) > td > table > tbody > tr > td > table:nth-child(23) > tbody > tr:nth-child(8) > td:nth-child(2)').textContent.replace(/(\r\n|\n|\r|\t)/g,"");

      if(schlName == undefined){
        return null;
      }

      return {
        "schlName": schlName,
        "schlAddr": schlAddr,
        "tel": tel,
        "createYr": createYr,
        "website": website,
        "feeAM": feeAM,
        "feePM": feePM,
        "feeWholeDay": feeWholeDay
      };
    })
    .catch(function (error) {
      //console.error('Search failed:', error);
    });

    //console.log(detailJson);
    if(detailJson != null){
      detailJsonArr.push(detailJson);  
    }
    
    yield nightmare.end();
    bar.tick();
  }

  console.log('\ndownload completed\n');
  var xls = json2xls(detailJsonArr);
  fs.writeFileSync('kgp.xlsx', xls, 'binary');
  //console.log(detailJsonArr);
}
