// *** FIREBASE SETUP ***:
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.6/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/9.6.6/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc} from "https://www.gstatic.com/firebasejs/9.6.6/firebase-firestore.js";

// *** PRIVATE INFO IMPORTS ***
import { firebaseConfig, apiKey } from "./js/info.js"

const app = initializeApp(firebaseConfig);
const db = getFirestore();
const auth = getAuth();

// DOM elements that will be constantly called:
const nav = document.querySelector('nav');
const userName = document.querySelector('#user-name');
const launchSection = document.querySelector('#launch-section');
const signUpForm = document.querySelector('#sign-up-form');
const logInForm = document.querySelector('#log-in-form');
const closeFormBtn = document.querySelectorAll('form > span');
const displaySection = document.querySelector('#display-section');
const toSignUpBtn = document.querySelector('#to-sign-up-btn');
const toLogInBtn = document.querySelector('#to-log-in-btn');
const menuBtn = document.querySelector('#hamburger-container');
const myProfileBtn = document.querySelector('#my-profile-btn');
const logOutBtn = document.querySelector('#log-out-btn');
const loadingSpinner = document.querySelector('#lds-ring-container');

// *** FUNCTIONS ***
// Sign Up function:
const signUp = async (data) => {

    try {
        // Sign Up Process
        await createUserWithEmailAndPassword(auth, data.signUpEmail, data.signUpPassword)
            .then((userCredential) => {
                console.log('User registered');
            })
            // Update display name of logged user so we could get his name any time in the future:
            .then(() => updateProfile(auth.currentUser, {
                displayName: data.signUpName
            }))
            .then(() => userName.innerText = `User: ${auth.currentUser.displayName}`)
        //Create document in Firestore
        await setDoc(doc(db, 'users', data.signUpEmail), {
            userName: data.signUpName,
            email: data.signUpEmail,
            favourites: []
        })
    }
    catch (error) {
        console.log('Error: ', error)
    }
}
// Log In function:
const logIn = async (data) => {
    try {
        await signInWithEmailAndPassword(auth, data.logInEmail, data.logInPassword);
        // Each tiem user logs in, his favourites list is downloaded from Firestore, so we didn't have to fetch it every time user wants to access it in My Profile page:
        await getDoc(doc(db, 'users', data.logInEmail))
            .then(user => localStorage.setItem('favourites', (JSON.stringify(user.data().favourites || []))))
            .then(() => userName.innerText = `User: ${auth.currentUser.displayName}`);

    }
    catch (error) {
        const errorCode = error.code;
        const errorMessage = error.message;
        return error
    }
}
// Log Out function:
const logOut = async () => {
    try {
        // Each time user logs out, his favourites list is uploaded to Firestore, updating his profile:
        const favourites = JSON.parse(localStorage.getItem('favourites'));
        const docRef = await doc(db, 'users', auth.currentUser.email);
        await updateDoc(docRef, {
            favourites: favourites
        })
        localStorage.clear();
        await auth.signOut();

    }
    catch (error) {
        console.log(error);
    }
}

// Creating and displaying "Go Back" button:
const createBackBtn = () => {
    const btn = document.createElement('button');
    btn.setAttribute('id', 'back-btn');
    btn.innerText = 'Go Back';
    displaySection.insertBefore(btn, displaySection.firstChild);
    // The "go back" button deletes every card on the DOM, and fetches the main page again (it will be in local storage after the first log in, so it won't take much time):
    btn.addEventListener('click', function () {
        const previousDivs = document.querySelectorAll('#display-section > div');
        [...previousDivs].forEach(div => div.remove());
        getAndDisplayAllLists();
        this.remove();
    });
}

// Add to favourites button event:
const addToFav = async (event) => {

    const favourites = JSON.parse(localStorage.getItem('favourites')) || [];
    // Select the card div(parent element of the fav button) and the title of the book:
    const div = event.target.parentElement.parentElement;
    const title = div.lastChild.childNodes[1].innerText;

    // If button is 'liked' (has 'liked' class), it's been alredy stored and needs to be deleted:
    if (event.target.classList.length > 2) {
        favourites.forEach(async (item, index) => {
            // If element is alredy saved in favourites, it's removed:
            if (item.title === title) {
                favourites.splice(index, 1);
                localStorage.setItem('favourites', JSON.stringify(favourites));
                event.target.classList.toggle('liked');
            }
        })
    }
    // If not, we add it to favourites:
    else {
        //Replace buttons from book-card with new buttons and trim the spaces:
        const newDiv = div.innerHTML.replace(/\s\s+/gm, '').replace(/<div.id="book-btns".+(?=<div)/gim, '<i class="fa fa-heart" aria-hidden="true"></i>');
        //Save favourites in local storage:
        favourites.push({
            title: title,
            HTML: newDiv
        });
        localStorage.setItem('favourites', JSON.stringify(favourites));
        event.target.classList.toggle('liked');
    }
}

const removeFromFav = async (event) => {
    const div = event.target.parentElement;
    const title = div.lastChild.childNodes[0].innerText;
    //Remove card from DOM:
    div.remove();
    //Remove book from local storage:
    const favourites = JSON.parse(localStorage.getItem('favourites'));
    favourites.forEach((book, index) => {
        if (book.title === title) {
            favourites.splice(index, 1);
        }
    })
    localStorage.setItem('favourites', JSON.stringify(favourites));
}

//Function for fetching one books list:
const getOneList = async (id) => {
    try {
        let request = await fetch(`https://api.nytimes.com/svc/books/v3/lists/${id}.json?api-key=${apiKey}`);
        let response = await request.json();
        return response.results.books
    }
    catch (error) {
        console.log(error)
    }
}

//Function for displaying one books list:
const displayOneList = async (list) => {
    // Creates a div for each book in the list:
    list.forEach(book => {
        const div = document.createElement('div');
        div.setAttribute('id', `${book.title}`)
        div.classList.add('book-card');
        div.innerHTML = `<img src="${book.book_image}">
                         <div id="book-btns">
                            <i class="fa fa-heart" aria-hidden="true"></i>
                            <button type="button" class="buy-book-btn">Buy</button>
                         </div>
                         <div id="book-info-container">
                            <h2>#${book.rank} ${book.title}</h2>
                            <p>${book.author}</p>
                            <p>Weeks on list: ${book.weeks_on_list}</p>
                            <p>${book.description}</p>
                         </div>`;
        displaySection.appendChild(div);
        // A fav button is added each time, with its event:
        const favIcons = document.querySelectorAll('.fa');
        favIcons[favIcons.length - 1].addEventListener('click', addToFav);
        // If book is alredy in favs, the fav button is highlighted, so user knows it alredy saved as fav:
        const favourites = JSON.parse(localStorage.getItem('favourites')) || [];
        favourites.forEach(item => {
            if (item.title === `#${book.rank} ${book.title}`) {
                favIcons[favIcons.length - 1].classList.toggle('liked');
            }
        })
        // Buy button event to Amazon, that searches by ISBN-10:
        const buttons = document.querySelectorAll('.buy-book-btn');
        buttons[buttons.length - 1].addEventListener('click', () => {
            window.open(`https://www.amazon.es/dp/${book.isbns[0].isbn10}`)
        })
    });

}
// Loading and removing spinner for fetching books:
const toggleSpinner = () => {
    loadingSpinner.classList.toggle('off');
}

// Wraper function for fetching and displaying the books list (it functions as an event listener) in the list card:
const getAndDisplayOneList = async (event) => {
    // Display loading spinner:
    toggleSpinner();
    // Removes previous lists from section:
    const previousDivs = document.querySelectorAll('#display-section > div');
    [...previousDivs].forEach(div => div.remove());
    // Parent element id of the button is the name of that list, and it's passed to the fetch function:
    const id = event.target.parentElement.getAttribute('id');
    const list = await getOneList(id);
    await displayOneList(list);
    // Loading spinner out:
    toggleSpinner();
    createBackBtn();
}

// Function for fetching all lists:
const getAllLists = async () => {
    try {
        let request = await fetch(`https://api.nytimes.com/svc/books/v3/lists/names.json?api-key=${apiKey}`);
        let response = await request.json();
        return response.results
    }
    catch (error) {
        console.log(error)
    }
}

//Function for displaying all lists:
const displayAllLists = async (lists) => {
    // Creates one div card for each list:
    lists.forEach(list => {
        const div = document.createElement('div');
        div.classList.add('list-card');
        div.setAttribute('id', `${list.list_name_encoded}`)
        div.innerHTML = `<h2>${list.display_name}</h2>
                         <p>Oldest: ${list.oldest_published_date}</p>
                         <p>Newest: ${list.newest_published_date}</p>
                         <p>Updated: ${list.updated}</p>
                         <button type="button" class="go-to-list-btn">Go</button>`;
        displaySection.appendChild(div);

        // Set button event listeners for getting the books in the list:
        const buttons = document.querySelectorAll('.go-to-list-btn');
        [...buttons].forEach(button => button.addEventListener('click', getAndDisplayOneList))
    })
}

//Wrapper function for managing asynchrony:
const getAndDisplayAllLists = async () => {
    //If the lists are not in local storage, we have to do the fetch:
    if (window.localStorage.length < 2) {
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
    // Since this is the main page, we don't need a back button here:
    const backBtn = document.querySelector('#back-btn');
    if (backBtn) {
        backBtn.remove();
    }
}

// Button events that lead to signup / login formularies:
toSignUpBtn.addEventListener('click', () => {
    signUpForm.classList.toggle('scaled');
});
toLogInBtn.addEventListener('click', () => {
    logInForm.classList.toggle('scaled');
});

// Sign up button event:
signUpForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const data = {
        signUpName: event.target['sign-up-name'].value,
        signUpEmail: event.target['sign-up-email'].value,
        signUpPassword: event.target['sign-up-password'].value,
        signUpPassword2: event.target['sign-up-password2'].value,
    };

    // Regex validation:
    if (data.signUpPassword === data.signUpPassword2
        && /^[\w!@#$%&?\-_\.]{6,19}$/gi.test(data.signUpPassword)
        && /^[\w!\-_\.&]+@[\w\-_\.\/]+\.[\w]{0,4}$/gi.test(data.signUpEmail)) {

        launchSection.classList.toggle('off');
        signUpForm.classList.toggle('scaled');
        signUpForm.reset();
        displaySection.classList.toggle('off');
        nav.classList.toggle('off');
        menuBtn.classList.toggle('off');
        document.querySelectorAll('p').forEach(p => p.remove());

        await signUp(data);
        await getAndDisplayAllLists();
    }

    else {
        // Show error message:
        const p = document.querySelector('#sign-up-form > p') || '';
        if (!p) {
            const p = document.createElement('p');
            p.classList.add('incorrect-sign-up');
            p.innerText = 'Incorrect e-mail \n or password.'
            signUpForm.appendChild(p);
        }
    }
});

// Log in button event:
logInForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const data = {
        logInEmail: event.target['log-in-email'].value,
        logInPassword: event.target['log-in-password'].value,
    };

    try {
        await logIn(data)
            .then(error => {
                // If log in fails, we don't want to execute the code below, or then the formulary will be removed, so we throw an error and go directly to the cath:
                if (error) throw error
            })

        launchSection.classList.toggle('off');
        logInForm.classList.toggle('scaled');
        logInForm.reset();
        displaySection.classList.toggle('off');
        nav.classList.toggle('off');
        menuBtn.classList.toggle('off');
        document.querySelectorAll('p').forEach(p => p.remove());

        await getAndDisplayAllLists();
    }
    catch (error) {
        console.log('Error en login: ' + error);
        // Display error message for user:
        const p = document.querySelector('#log-in-form > p') || '';
        if (!p) {
            const p = document.createElement('p');
            p.classList.add('incorrect-sign-up');
            p.innerText = 'Incorrect e-mail \n or password.'
            logInForm.appendChild(p);
        }
    }
});

// Close formuñary button event:
[...closeFormBtn].forEach(button => button.addEventListener('click', () => {
    button.parentElement.classList.toggle('scaled');
}))

// Hamburger menu button event for displaying the side menu in mobile screen:
menuBtn.addEventListener('click', () => {
    nav.classList.toggle('translated-menu');
})

// Log Out button event:
logOutBtn.addEventListener('click', () => {
    logOut();
    //If you log out from "My Profile" page, you have to destroy divs and goBack button, or they will appear next time you log in if the window is not refreshed:
    const previousDivs = document.querySelectorAll('#display-section > div') || false;
    if (previousDivs) {
        previousDivs.forEach(div => div.remove());
    }
    const backBtn = document.querySelector('#back-btn') || false;
    if (backBtn) {
        backBtn.remove();
    }
    displaySection.classList.toggle('off');
    launchSection.classList.toggle('off');
    nav.classList.toggle('off');
    menuBtn.classList.toggle('off');
    // If you log out from the menu, it remains displayed when you log in again, so it must be hidden if not:
    if (nav.classList[0] !== 'translated-menu') {
        nav.classList.toggle('translated-menu')
    }
});

// My Profile button event:
myProfileBtn.addEventListener('click', () => {
    // Removes previous list divs
    const previousDivs = document.querySelectorAll('#display-section > div');
    previousDivs.forEach(div => div.remove());

    createBackBtn();
    // Fetches favourite books from local storage:
    const favourites = JSON.parse(localStorage.getItem('favourites')) || [];
    favourites.forEach(book => {
        const div = document.createElement('div');
        div.classList.add('favourites-card');
        div.innerHTML = book.HTML;
        displaySection.appendChild(div);
    })
    // Since we are alredy in favourites page, the like button here un-likes the book:
    const buttons = document.querySelectorAll('.fa');
    [...buttons].forEach(button => {
        button.addEventListener('click', removeFromFav);
        button.classList.toggle('liked');
    });

    nav.classList.toggle('translated-menu');
})