import fetch from 'node-fetch';
const { MongoClient } = require('mongodb');

(async () => {
    let professors = await getProfessors(true);
    await addDetailedInfo(professors);
    compileInfo(professors);
    await updateDB(professors);
    // console.log(professors);
})();

// uses RateMyProf's API to get a map of all professors and their id's
async function getProfessors(testing = false) {
    if (testing) 
        console.log("Test run...");
    let page = 1;
    let moreData = false
    const professors = {};
    do {
        let SBU_url = `http://www.ratemyprofessors.com/filter/professor/?&page=${page}&filter=teacherlastname_sort_s+asc&query=*%3A*&queryoption=TEACHER&queryBy=schoolId&sid=971`;
        const res = await fetch(SBU_url);
        const data = await res.json();
        moreData = (data.remaining != 0);
        for (let professor of data.professors) {
            professors[professor.tFname + " " + professor.tLname] = {
                "id" : professor.tid
            };
        }
        console.log("Adding page " + page);
        page++;
    } while (moreData && !testing) 
    console.log("Professor IDs retrieved successfully");
    return professors;
}

// inputs professor id's found in previous function into RateMyProf's APIs to get all ratings
async function addDetailedInfo(professors) {
    const professorURL = "https://www.ratemyprofessors.com/paginate/professors/ratings?tid="
    let count = 0;
    for (let professor of Object.keys(professors)) {
        console.log("Adding professor " + count);
        count++;
        let url = professorURL + professors[professor].id;
        const res = await fetch(url);
        const professorRatings = (await res.json()).ratings;
        professors[professor]["ratings"] = []
        for (let professorRating of professorRatings) {
            let importantRatingData = {};

            importantRatingData.rating = professorRating.rOverall;
            importantRatingData.difficulty = professorRating.rEasy;
            importantRatingData.would_retake = professorRating.rWouldTakeAgain;
            importantRatingData.date = professorRating.rDate;
            
            professors[professor]["ratings"].push(importantRatingData);
        }
    }
    console.log("Professor data added successfully");
}

// computes average difficulty and would retake ratings from the individual ratings
function compileInfo(professors) {
    for (let professor of Object.keys(professors)) {
        // console.log(professors[professor].ratings.length);
        let difficultySum = 0;
        let wouldRetake = 0;
        let wouldNotRetake = 0;
        for (let rating of professors[professor].ratings) {
            difficultySum += rating.difficulty;
            if (rating.would_retake === "Yes") wouldRetake++;
            if (rating.would_retake === "No" ) wouldNotRetake++;
        }
        let num_ratings = professors[professor].ratings.length;
        professors[professor].difficulty = parseFloat((difficultySum / num_ratings).toFixed(1));
        professors[professor].would_retake = wouldRetake / (wouldRetake + wouldNotRetake);
        professors[professor].num_ratings = num_ratings;
    }
    console.log("Professor ratings computed successfully");
}

async function updateDB(professors) {
    const uri = 'mongodb://localhost:27017';
    const client = new MongoClient(uri);

    await client.connect();

    const db = client.db('professors');
    const collection = db.collection('professors');

    await collection.deleteMany({});
    await collection.insertOne(professors);
    await client.close();
    console.log("Database updated successfully");
}