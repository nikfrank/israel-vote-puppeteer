# counting votes in Israel

Thomas Jefferson - more widely known for being on the two dollar bill - invented the vote counting system for proportional representation we use in Israel. Unjustly, Europeans call the method "the D'Hondt method", probably because they don't have two dollar bills there. In this meetup, we will scrape vote total numbers from an Israeli government website and use those totals to calculate seat apportionments according to Jefferson's method.

This meetup is the result of the website in question not doing such math live during vote counting, and having had my friends ask me to do the math in my head repeatedly. Generally during elections, I'm in no condition to do that much math - so I made my friends watch me live code the original version of this program while we waited for the numbers to change.


## automation for bechirot website

We want to know the number of seats that the votes numbers posted live on https://votes25.bechirot.gov.il/

(during the election the mandates are not calculated on the website - only after - the next one should go up whenever at https://votes26.bechirot.gov.il/ )

let's use puppeteer to scrape the vote totals from the existing site and calculate mandates on the fly!


### project setup


`cd ~/code`

`mkdir vote-israel`

`cd vote-israel`

`npm init -y`

`npm i -S puppeteer`

`touch index.js`


### booting headless Chrome in puppeteer


open `index.js` in your favourite text editor

now we need to boot a browser instance in puppeteer to load the page to get the data

<sub>./index.js</sub>
```js
const puppeteer = require('puppeteer');

const loadVotes = async () => {
  
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome'
  });
  const page = await browser.newPage();

  await page.goto('https://votes24.bechirot.gov.il/');

  console.log('done');

  return await browser.close();
};

loadVotes();
```

your absolute Chrome path might be different though - this is for mac default installations

(( if you have to figure your's out, usually you can by opening a command line and doing `which google-chrome` ))


`node .`

should  print out 'done'


### scraping numbers


let's figure out the selector we'll use to scrape vote totals

open up https://votes25.bechirot.gov.il/ in the browser, open up a dev panel to the console tab and...

<sub>browser console in webpage</sub>
```js
document.querySelectorAll('table.TableData')

document.querySelectorAll('table.TableData td.Last')

[...document.querySelectorAll('table.TableData td.Last')]
.map(el=> el.innerText)

[...document.querySelectorAll('table.TableData td.Last')].map(el=> el.innerText.split(',').join(''))

[...document.querySelectorAll('table.TableData td.Last')].map(el=> Number(el.innerText.split(',').join('')))

```

after puppeteer loads the page, we can do the same thing in our headless chrome

<sub>./index.js</sub>
```js

  //...

  const votes = await page.evaluate(() => {
    return [...document.querySelectorAll('table.TableData td.Last')]
      .map(e=> Number(e.innerText.split(',').join('')));
  });

  console.log(votes);

  return await browser.close();


```

`node .`

it should print our vote totals to the terminal stdout



### scraping party vote slip labels


we'll also want the vote slip abbreviation for each party


```js

  [...document.querySelectorAll('table.TableData td:first-of-type')].map(el => el.innerText)

```

<sub>./index.js</sub>
```js

  //...

  const parties = await page.evaluate(() => {
    return [...document.querySelectorAll('table.TableData td:nth-of-type(2)')].map(el=> el.innerText);
  });
  
  console.log(parties);

  return await browser.close();

```

### the math


after getting the votes and the parties

`touch math.js`

<sub>./math.js</sub>
```js
const calculateSeats = (allParties, votes)=> {};

module.exports = {
  calculateSeats,
};
```


<sub>./index.js</sub>
```js
const { calculateSeats } = require('./math');

//...

  const seats = calculateSeats(parties, votes);

  console.log(JSON.stringify(seats, null, 2));
  
  return await browser.close();

```

as mentinoed in the preamble, Israel uses [Thomas Jefferson's seat distribution method](https://en.wikipedia.org/wiki/D%27Hondt_method#Procedure)

because apparently he also did some math... who knew?

```js

const calculateSeats = (allParties, votes)=>{

  // eliminate < 3.25%  
  // map to (v / (s + 1)) 
  // inc seat to highest list
  // continue 120 times

  // that's it - return the seat totals
};


```


now let's put our thoughts into code

(( this is my solution. perhaps you want to code it a different way! please do, and send me a link / PR ))

```js

const calculateSeats = (allParties, votes)=>{

  // eliminate < 3.25%
  const totalVotes = votes.reduce((p, c)=> p+c, 0);
  
  const parties = allParties.filter((p, i)=> (votes[i] > (totalVotes * 0.0325)));

  // map to (v / (s + 1)) 
  let q = [];
  let seats = parties.map(()=> 0);
  
  // quotient loop
  // continue 120 times
  for(let s = 0; s < 120; s++){
  
    // recalculate quotients
    q = parties.map((p, i)=> (votes[i] / (seats[i] + 1)));

    // inc seat to highest list
    seats[
      q.indexOf( Math.max(...q) )
    ]++;
  }

  // that's it - return the seat totals
  // we'll put them in a JSON like { [vote-slip]: seatTotal, ... }

  return parties.reduce((totals, voteSlip, i)=> ({ ...totals, [voteSlip]: seats[i] }), {});
};


```

### testing the math

let's test our code against the previous election (or the previous one, or the previous one, ...)

<sub>./test.js</sub>
```js

const sampleData = {
  "parties": [
    "מחל",
    "פה",
    "שס",
    "כן",
    "ב",
    "אמת",
    "ג",
    "ל",
    "ט",
    "ודעם",
    "ת",
    "מרצ",
    "עם",
    "יז",
    "ר",
    "ףז",
    "כך",
    "רנ",
    "י",
    "קץ",
    "זץ",
    "רף",
    "קך",
    "נ",
    "ק",
    "כ",
    "צי",
    "יק",
    "ני",
    "ינ",
    "ז",
    "קי",
    "ץ",
    "יר",
    "צכ",
    "צף",
    "נר",
    "יף",
    "רק"
  ],
  "votes": [
    1066892,
    614112,
    316008,
    292257,
    273836,
    268767,
    248391,
    248370,
    225641,
    212583,
    209161,
    202218,
    167064,
    34883,
    17346,
    1309,
    1291,
    1189,
    811,
    729,
    663,
    592,
    514,
    486,
    463,
    443,
    441,
    429,
    429,
    408,
    395,
    395,
    385,
    256,
    253,
    226,
    220,
    196,
    0
  ]
};


const { calculateSeats } = require('./math');

test('election24', ()=>{

  const seats = calculateSeats( sampleData.parties, sampleData.votes );

  expect( seats['מחל'] ).toEqual(30);
});
```

we can run the test with

`npx jest test.js`


aha! there's a problem ... `30 !== 31`

we haven't calculated for surplus votes, and this causes a discrepancy in Likud's vote total here.

let's dive a bit deeper into the math.


### more math

parties can decide to shared surplus votes with eachother

the way this math works, is that before we start distributing seats, we must first join shared votes

then we'll distribute the seats between the sharing parties later

<sub>./math.js</sub>
```js

const shareds25 = [
  ['כן', 'פה'],
  ['שס', 'ג'],
  ['מחל', 'ט'],
  ['מרצ', 'אמת'],
];

const shareds24 = [
  ['ב', 'ת'],
  ['שס', 'ג'],
  ['מחל', 'ט'],
  ['מרצ', 'אמת'],
];

// vote sharing agreements for 24th and 25th elections


const calculateSeats = (allParties, votes, sharedLists)=>{

  //... we'll pretend the first party on the shared list got all the votes

  const sharedTotals = parties.map(p=> {
    const sharedLeadIndex = sharedLists.findIndex(list => list.indexOf(p) === 0);
    
    if( sharedLeadIndex !== -1 )
      return sharedLists[sharedLeadIndex].reduce((total, sharingParty)=> (
        total + votes[ parties.indexOf(sharingParty) ]
      ), 0);

    const sharedFollowIndex = sharedLists.findIndex(list => list.indexOf(p) > 0);
    if( sharedFollowIndex !== -1 ) return 0; // pretend the other ones get 0 for now

    // implicit else / default case
    return votes[ parties.indexOf(p) ]; // not shared, no change
  });

  //...

}
```


now in our quotient loop, we should use the shared totals

```js


  // map to (v / (s + 1))
  let q = [];
  let seats = parties.map(()=> 0);
  
  // quotient loop
  // continue 120 times
  for(let s = 0; s < 120; s++){

    // recalculate quotients
    q = parties.map((p, i)=> (sharedTotals[i] / (seats[i] + 1)) );

    // inc seat to highest list
    seats[
      q.indexOf( Math.max(...q) )
    ]++;
  }

```

and redistribute privately after

```js

  // redistribute shared lists

  for(let sl = 0; sl < sharedLists.length; sl++){
  
    // we gave all the seats to the first party in the list

    const sharedSeats = seats[ parties.indexOf(sharedLists[sl][0]) ];
    let sq = [];
    let redistributedSeats = sharedLists[sl].map(()=> 0);

    // same as before, for each seat we calculate the quotient
    // and give a seat to the max q val
    
    for(let sharedSeat = 0; sharedSeat < sharedSeats; sharedSeat++ ){
      sq = sharedLists[sl]
        .map((p, i)=> (votes[ parties.indexOf(p) ] / ( redistributedSeats[i] + 1)));

      redistributedSeats[
        sq.indexOf( Math.max(...sq) )
      ]++;
    }

    // and put the redistributed seats back into the main seats result
    sharedLists[sl].forEach((p, i)=> {
      seats[ parties.indexOf(p) ] = redistributedSeats[i];
    });
  }

  //...
```


much better! (or "more accurate" at the very least)

in the 24th elections, this actually cost Likud a seat to Meretz. THANKS JEFFERSON

anyhow our test should pass now.


### conclusion, next steps


now you're prepared to calculate seat outcomes from the votes totals on the government website live during the elections next time they happen!

just change all the 25s to 26s!, and make a new list of sharing agreements


### one more thing...

let's calculate if some theoretical coalition has 61 seats

<sub>./index.js</sub>
```js

  //...

  const seats = calculateSeats(parties, votes, shareds24);

  console.log(JSON.stringify(seats, null, 2));

  console.log(
    'Likud + Shas + UTJ + RZ = ',
    seats['מחל'] + seats['שס'] + seats['ג'] + seats['ט']
  );

  //...

```

perhaps we'll make a front end coalition building app in the next meetup