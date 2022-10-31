# counting votes in Israel

## automation for bechirot website

We want to know the number of seats that the votes numbers posted live on https://votes24.bechirot.gov.il/

`cd ~/code`

`mkdir vote-israel`

`cd vote-israel`

`npm init -y`

`npm i -S puppeteer`

`touch index.js`

open `index.js` in your favourite text editor

now we need to boot a browser instance in puppeteer to load the page to get the data

<sub>./index.js</sub>
```js
const puppeteer = require('puppeteer');

const loadVotes = async () => {
  
  const browser = await puppeteer.launch({
    executablePath: "/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome"
  });
  const page = await browser.newPage();

  await page.goto('https://votes24.bechirot.gov.il/');

  console.log('done');
});

loadVotes();
```

your absolute Chrome path might be different though


`node .`

should  print out 'done'

then we can hit ctrl-c to end the process

<sub>browser console in webpage</sub>
```js
document.querySelectorAll('table.TableData')

document.querySelectorAll('table.TableData td.Last')

[...document.querySelectorAll('table.TableData td.Last')]
.map(el=> el.innerText)

[...document.querySelectorAll('table.TableData td.Last')].map(el=> el.innerText.split(',').join(''))

[...document.querySelectorAll('table.TableData td.Last')].map(el=> Number(el.innerText.split(',').join('')))

```

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


```js

  [...document.querySelectorAll('table.TableData td:first-of-type')].map(el => el.innerText)

```


<sub>./index.js</sub>
```js

  //...

  const parties = await page.evaluate(() => {
    return [...document.querySelectorAll('table.TableData td:first-of-type')].map(el=> el.innerText);
  });
  
  console.log(parties);

  return await browser.close();

```


after getting the votes and the parties

<sub>./index.js</sub>
```js

  const seats = calculateSeats(parties, votes);

  console.log(JSON.stringify(seats, null, 2));
  
  await browser.close();


```

<sub>./algorithm.js</sub>
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

```js

const calculateSeats = (allParties, votes, sharedLists)=>{

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
  // we'll put them in a JSON [vote-slip]: seatTotal

  return parties.reduce((c, p, i)=> ({ ...c, [p]: seats[i] }), {});
};


```

### testing

let's test our code against the previous election (or the previous one, or the previous one, ...)

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

```


<sub>./test.js</sub>
```js

test('election24', ()=>{

  const seats = calculateSeats( sampleData.parties, sampleData.votes );

  expect( seats['מחל'] ).toEqual(30);
});
```

aha! there's a problem

we haven't calculated for surplus votes


before we start distributing seats, we must first join shared votes

(we'll distribute the seats between the sharing parties later)

<sub>./index.js</sub>
```js
  const sharedTotals = parties.map(p=> {
    const sharedLeadIndex = sharedLists.findIndex(list => list.indexOf(p) === 0);
    if( sharedLeadIndex !== -1 )
      return sharedLists[sharedIndex].reduce((total, sharingParty)=> (
        total + votes[ parties.indexOf(sharingParty) ]
      ), 0); // pretend the first party on the shared list gets all the votes

    const sharedFollowIndex = sharedLists.findIndex(list => list.indexOf(p) > 0);
    if( sharedLeadIndex !== -1 ) return 0; // pretend the other ones get 0 for now

    else return votes[ parties.indexOf(p) ]; // not shared, no change
  });

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

```


much better! (or "more accurate" at the very least)

in the 24th elections, this actually cost Likud a seat to Meretz.


now you're prepared to calculate seat outcomes from the votes totals on the government website live during the elections 11/1/22

just change all the 24s to 25s!