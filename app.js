

// Function for fetching all lists:
const getAllLists = async () => {
    try {
        let request = await fetch('https://api.nytimes.com/svc/books/v3/lists/names.json?api-key=aIIJ5p83TsAOWEXASdgbJYiNjZ1kSNW0');
        let response = await request.json();
        return response.results
    }
    catch (error) {
        console.log(error)
    }
}

//Function for displaying all lists:
const displayAllLists = async (lists) => {
    lists.forEach(list => {
        const main = document.querySelector('main');
        const div = document.createElement('div');
        div.classList.add('list-card');
        div.setAttribute('id', `${list.list_name_encoded}`)
        div.innerHTML = `<h2>${list.display_name}</h2>
                         <p>Oldest: ${list.oldest_published_date}</p>
                         <p>Newest: ${list.newest}</p>
                         <p>Updated: ${list.updated}</p>
                         <button type="button" class="go-to-list-btn" onclick=goToList()>Go</button>`;
        main.appendChild(div);
    })
}

//Wrapper function for managing asynchrony:
const getAndDisplayAllLists = async () => {
    //If the lists are not in local storage, we have to do the fetch:
    if (window.localStorage.length < 1) {
        const lists = await getAllLists();
        await displayAllLists(lists);
        //Save lists in local storage, so we didn't have to fetch them next time:
        localStorage.setItem('lists', JSON.stringify(lists));
    }
    //If the lists are in local storage, the fetch is not needed, and we save time:
    else {
        const lists = JSON.parse(localStorage.getItem('lists'));
        displayAllLists(lists);
    }
}
getAndDisplayAllLists();

//Function for fetching one list
const getOneList = async (id) => {
    try {
        let request = await fetch(`https://api.nytimes.com/svc/books/v3/lists/${id}.json?api-key=aIIJ5p83TsAOWEXASdgbJYiNjZ1kSNW0`);
        let response = await request.json();
        return response.results.books
    }
    catch (error) {
        console.log(error)
    }
}

//Function for displaying one list
const displayOneList = async (list) => {
    list.forEach(book => {
        const main = document.querySelector('main');
        const div = document.createElement('div');
        div.classList.add('book-card');
        div.innerHTML = `<h2>#${book.rank} ${book.title}</h2>
                         <p>${book.author}</p>
                         <img src="${book.book_image}">
                         <p>Weeks on list: ${book.weeks_on_list}</p>
                         <p>${book.description}</p>
                         <button type="button" class="buy-book-btn">Buy</button>`;
        main.appendChild(div);
    })
}

//Button event going to clicked list (wrapper function for asynchrony)
const goToList = async () => {
    let previousDivs = document.querySelectorAll('div');
    [...previousDivs].map(div => div.remove());
    const id = window.event.target.parentElement.getAttribute('id');
    const list = await getOneList(id);
    await displayOneList(list);
}