const puppeteer = require('puppeteer');

const loadVotes = async () => {

  // const browser = await puppeteer.launch();
  // const browser = await puppeteer.launch({executablePath: '/opt/homebrew/bin/chromium'});
  // const browser = await ({executablePath: '/opt/homebrew/bin/chromium'});
  
  
  const browser = await puppeteer.launch({
    executablePath: "/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome"
  });
  const page = await browser.newPage();

  await page.goto('https://votes24.bechirot.gov.il/');

  const votes = await page.evaluate(() => {
    return [...document.querySelectorAll('table.TableData td.Last')]
      .map(e=> Number(e.innerText.split(',').join('')));
  });

  const parties = await page.evaluate(() => {
    return [...document.querySelectorAll('table.TableData td:first-of-type')]
      .map(el=> el.innerText);
  });
  
  // Print all 
  // console.log(votes.map((v, i)=> `${v} - ${parties[i]}`).join('\n'));

  const seats = calculateSeats(parties, votes, shareds24);

  console.log(JSON.stringify(seats, null, 2));

  console.log(
    'Likud + Shas + UTJ + RZ = ',
    seats['מחל'] + seats['שס'] + seats['ג'] + seats['ט']
  );
  
  await browser.close();
};

loadVotes();



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


const calculateSeats = (allParties, votes, sharedLists)=>{

  const totalVotes = votes.reduce((p, c)=> p+c, 0);
  
  const parties = allParties.filter((p, i)=> (votes[i] > (totalVotes * 0.0325)));

  // eliminate < 3.25%
  // calculate vote totals for sharing lists

  const sharedTotals = parties.map(p=> {
    const sharedLeadIndex = sharedLists.findIndex(list => list.indexOf(p) === 0);
    if( sharedLeadIndex !== -1 )
      return sharedLists[sharedLeadIndex].reduce((total, sharingParty)=> (
        total + votes[ parties.indexOf(sharingParty) ]
      ), 0); // pretend the first party on the shared list gets all the votes

    const sharedFollowIndex = sharedLists.findIndex(list => list.indexOf(p) > 0);
    if( sharedFollowIndex !== -1 ) return 0; // pretend the other ones get 0 for now

    // implicit else / default case
    return votes[ parties.indexOf(p) ]; // not shared, no change
  });

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
  

  // that's it - return the seat totals

  return parties.reduce((c, p, i)=> ({ ...c, [p]: seats[i] }), {});
};



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


// const sampleSeats = calculateSeats( sampleData.parties, sampleData.votes, shareds24);

