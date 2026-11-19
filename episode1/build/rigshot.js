const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1500,height:560}});
p.on('pageerror',e=>console.log('pageerror',e.message));p.on('console',m=>console.log('c',m.text()));
await p.goto('file:///home/user/Project/episode1/build/rigtest.html');await p.screenshot({path:'/home/user/Project/episode1/build/rigtest.png'});await b.close();})();
