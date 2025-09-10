const words = require('english-words'); // This provides multiple sets of word lists

const prompt = require("prompt-sync")({ sigint: true });

words.getWords(run)

function run(wordList) {

    // Get a random word
    function getRandomWord() {
        const randomIndex = Math.floor(Math.random() * wordList.length);
        return wordList[randomIndex];
    }

    // Check if a word is valid
    function isValidWord(word) {
        return wordList.includes(word.toLowerCase());
    }

    function isLinked(word, previous) {
        for (let i = 1; i < previous.length-1; i++) {
            if (word.startsWith(previous.substring(i, previous.length))){
                return previous.substring(i, previous.length).length
            }
        }
        return null
    }

    function getChain(chain){
        string = ""
        chain.forEach(ele => {
            string = string.concat(ele.word.substring(ele.overlap))
        });
        return string
    }
    function limitCharacters(chain, end, bestcount, count = 1, bestchar = Number.MAX_VALUE){
        if (getChain(chain).length > bestchar){
            return null
        }
        if (!isLinked(end, chain[chain.length-1].word)) {
            var best = null
            currentbestchar = bestchar
            newList = wordList.filter((x) => x.length > 4 && x.length < 10)
            advance = newList.filter((x) => isLinked(x, chain[chain.length-1].word))
            advance.forEach(word => {
                newChain = chain.slice()
                newChain.push({"word": word, "overlap": isLinked(word, chain[chain.length-1].word)})
                contender = checkValidity(newChain, end, count+1, bestcount, currentbestchar)
                

                if (contender != null){
                    if (best == null || getChain(contender.chain).length < currentbestchar ){
                        best = contender
                        currentbestchar = getChain(contender.chain).length
                    }
                }
            });
            // if (count == 2){
            //     console.log(best)
            // }
            // if (count == 1){
            //     console.log(best)
            // }
            return best
        }
        else {
            chain.push({"word": end, "overlap": isLinked(end, chain[chain.length-1].word)})

            console.log({"chain": chain, "count": count, "character": getChain(chain).length})
            // the = {"chain": chain, "count": count + 1}
            // console.log(the["chain"])
            return {"chain": chain, "count": count, "character": getChain(chain).length}
        }
    }

    function checkValidity(chain, end, count = 1, bestcount = 5){
        if (count > bestcount ){
            return null
        }
        if (!isLinked(end, chain[chain.length-1].word)) {
            var best = null
            currentbestcount = bestcount
            newList = wordList.filter((x) => x.length > 4 && x.length < 10)
            advance = newList.filter((x) => isLinked(x, chain[chain.length-1].word))
            advance.forEach(word => {
                newChain = chain.slice()
                newChain.push({"word": word, "overlap": isLinked(word, chain[chain.length-1].word)})
                contender = checkValidity(newChain, end, count+1, currentbestcount)
                

                if (contender != null){
                    if (best == null || contender.count < best.count){
                        best = contender
                        currentbestcount = best.count - 1
                    }
                }
            });
            return best
        }
        else {
            chain.push({"word": end, "overlap": isLinked(end, chain[chain.length-1].word)})

            console.log({"chain": chain, "count": count, "character": getChain(chain).length})
            // the = {"chain": chain, "count": count + 1}
            // console.log(the["chain"])
            return {"chain": chain, "count": count, "character": getChain(chain).length}
        }
    }
    

    const randomFirst = getRandomWord();
    const randomLast = getRandomWord();
    // reinstated educate teamwork working

    console.log(`${randomFirst} - ${randomLast}`);
    chain = [{"word": randomFirst, "overlap": 0}]

    validity = checkValidity(chain, randomLast)
    console.log(validity)
    console.log(getChain(validity.chain, randomLast))

    bestResult = limitCharacters(chain, randomLast, validity.count, 1, validity.character + 1)
    console.log(bestResult)
    score = 0

    while(true){
        var input = prompt("");
        linked = isLinked(input, chain[chain.length-1].word)
        if (!isValidWord(input)) {
            console.log(`${input} is not a valid word`)
        }
        else if (input.length < 3){
            console.log(`${input} is too short`)
        }
        else if (linked == null){
            console.log(`${input} does not connect to ${chain[chain.length-1].word}`)
        }
        else {
            score++;
            chain.push({"word": input, "overlap": linked})
        }

        if (chain[chain.length-1].word == randomLast){
            console.log(`Win: ${score}`)
            console.log()
            console.log(getChain(chain))
            break
        }
    }
}


