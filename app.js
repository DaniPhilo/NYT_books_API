


const getAllLists = async () => {
    let request = await fetch('https://api.nytimes.com/svc/books/v3/lists/names.json?api-key=aIIJ5p83TsAOWEXASdgbJYiNjZ1kSNW0');
    let response = await request.json();
    return response.results
}

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

const getAndDisplayAllLists = async () => {
    const lists = await getAllLists();
    await displayAllLists(lists);
}

getAndDisplayAllLists();

const getOneList = async (id) => {
    let request = await fetch(`https://api.nytimes.com/svc/books/v3/lists/${id}.json?api-key=aIIJ5p83TsAOWEXASdgbJYiNjZ1kSNW0`);
    let response = await request.json();
    return response.results.books
}

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

const goToList = async () => {
    let previousDivs = document.querySelectorAll('div');
    [...previousDivs].map(div => div.remove());
    const id = window.event.target.parentElement.getAttribute('id');
    const list = await getOneList(id);
    await displayOneList(list);
}