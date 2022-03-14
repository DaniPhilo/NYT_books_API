// *** FIREBASE SETUP ***:
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.6/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, deleteUser, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/9.6.6/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove, query, where, deleteField } from "https://www.gstatic.com/firebasejs/9.6.6/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCLUor0R1QCzEdIo0FEqH3VUOXWoitujDQ",
    authDomain: "test-19cf1.firebaseapp.com",
    projectId: "test-19cf1",
    storageBucket: "test-19cf1.appspot.com",
    messagingSenderId: "407722304456",
    appId: "1:407722304456:web:1dfe1d12f2b60e9a3816fd"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore();
const auth = getAuth();
const provider = new GoogleAuthProvider();

const nav = document.querySelector('nav');
const title = document.querySelector('h1');
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


// *** FUNCTIONS ***
// Sign Up function:
const signUp = async (data) => {
    if (data.signUpPassword === data.signUpPassword2 /* aquí los regex*/) {
        try {
            // Sign Up Process
            await createUserWithEmailAndPassword(auth, data.signUpEmail, data.signUpPassword)
                .then((userCredential) => {
                    console.log('User registered');
                })
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
    else {
        alert('Different passwords');
    }
}
// Log In function:
const logIn = async (data) => {
    try {
        await signInWithEmailAndPassword(auth, data.logInEmail, data.logInPassword);
        await getDoc(doc(db, 'users', data.logInEmail))
            .then(user => localStorage.setItem('favourites', (JSON.stringify(user.data().favourites || []))))
            .then(() => userName.innerText = `User: ${auth.currentUser.displayName}`);

    }
    catch (error) {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode)
        console.log(errorMessage)
        alert('Incorrect user or password')
    }
}
// Log Out function:
const logOut = async () => {
    try {
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
// Login observer function:
const isUserLogged = () => {
    auth.onAuthStateChanged((user) => {
        if (user) {
            console.log('Logged user: ' + user.displayName);
        }
        else {
            console.log('No logged user');
        }
    })
}

// Creating and displaying "Go Back" button:
const createBackBtn = () => {
    const btn = document.createElement('button');
    btn.setAttribute('id', 'back-btn');
    btn.innerText = 'Go Back';
    displaySection.insertBefore(btn, displaySection.firstChild);
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
    // If not, we added to favourites:
    else {
        //Replace buttons from book-card with new buttons and trim the spaces:
        const newDiv = div.innerHTML.replace(/\s\s+/gm, '').replace(/<div.id="book-btns".+(?=<div)/gim, '<i class="fa fa-heart" aria-hidden="true"></i>');
        //Save favourites in local storage:
        favourites.push({
            title: title,
            HTML: newDiv
        });
        localStorage.setItem('favourites', JSON.stringify(favourites))

        //Update doc in Firestore:
        const docRef = doc(db, 'users', auth.currentUser.email);
        await updateDoc(docRef, {
            favourites: arrayUnion({
                title: title,
                HTML: div.innerHTML
            })
        });
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
        let request = await fetch(`https://api.nytimes.com/svc/books/v3/lists/${id}.json?api-key=aIIJ5p83TsAOWEXASdgbJYiNjZ1kSNW0`);
        let response = await request.json();
        return response.results.books
    }
    catch (error) {
        console.log(error)
    }
}

//Function for displaying one books list:
const displayOneList = async (list) => {

    list.forEach(book => {
        const div = document.createElement('div');
        div.setAttribute('id', `${list.list_name_encoded}`)
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

        const buttons = document.querySelectorAll('.fa');
        buttons[buttons.length - 1].addEventListener('click', addToFav);
        const favourites = JSON.parse(localStorage.getItem('favourites')) || [];
        favourites.forEach(item => {
            if (item.title === `#${book.rank} ${book.title}`) {
                buttons[buttons.length - 1].classList.toggle('liked');
            }
        })
    });

}

// Wraper function for fetching and displaying the books list (it functions as an event listener)
const getAndDisplayOneList = async (event) => {
    const previousDivs = document.querySelectorAll('#display-section > div');
    [...previousDivs].forEach(div => div.remove());
    // Parent element id of the button is the name of that list:
    const id = event.target.parentElement.getAttribute('id');
    const list = await getOneList(id);
    await displayOneList(list);
    createBackBtn();
}

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
        const div = document.createElement('div');
        div.classList.add('list-card');
        div.setAttribute('id', `${list.list_name_encoded}`)
        div.innerHTML = `<h2>${list.display_name}</h2>
                         <p>Oldest: ${list.oldest_published_date}</p>
                         <p>Newest: ${list.newest_published_date}</p>
                         <p>Updated: ${list.updated}</p>
                         <button type="button" class="go-to-list-btn">Go</button>`;
        displaySection.appendChild(div);

        // Set button event listeners:
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
    const backBtn = document.querySelector('#back-btn');
    if (backBtn) {
        backBtn.remove();
    }
}

// Launch page button events:
toSignUpBtn.addEventListener('click', () => {
    signUpForm.classList.toggle('scaled');
});
toLogInBtn.addEventListener('click', () => {
    logInForm.classList.toggle('scaled');
});

// Sign up and Log in button events:
signUpForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    launchSection.classList.toggle('off');
    signUpForm.classList.toggle('scaled');
    displaySection.classList.toggle('off');
    nav.classList.toggle('off');
    menuBtn.classList.toggle('off');
    const data = {
        signUpName: event.target['sign-up-name'].value,
        signUpEmail: event.target['sign-up-email'].value,
        signUpPassword: event.target['sign-up-password'].value,
        signUpPassword2: event.target['sign-up-password2'].value,
    };
    await signUp(data);
    await getAndDisplayAllLists();
});

logInForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    launchSection.classList.toggle('off');
    logInForm.classList.toggle('scaled');
    displaySection.classList.toggle('off');
    nav.classList.toggle('off');
    menuBtn.classList.toggle('off');
    const data = {
        logInEmail: event.target['log-in-email'].value,
        logInPassword: event.target['log-in-password'].value,
    };
    await logIn(data);
    await getAndDisplayAllLists();
});

// Colse Form btn event:
[...closeFormBtn].forEach(button => button.addEventListener('click', () => {
    button.parentElement.classList.toggle('scaled');
}))

// Hamburger menu button event:
menuBtn.addEventListener('click', () => {
    nav.classList.toggle('translated-menu');
})

// Log Out button event:
logOutBtn.addEventListener('click', () => {
    logOut();
    //If you log out from "My Profile" page, you have to destroy divs and goBack button, or they appear next time you log in:
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
    if (nav.classList[0] !== 'translated-menu') {
        nav.classList.toggle('translated-menu')
    }
});

// My Profile button event:
myProfileBtn.addEventListener('click', () => {
    const previousDivs = document.querySelectorAll('#display-section > div');
    previousDivs.forEach(div => div.remove());

    createBackBtn();

    const favourites = JSON.parse(localStorage.getItem('favourites'));
    favourites.forEach(book => {
        const div = document.createElement('div');
        div.classList.add('favourites-card');
        div.innerHTML = book.HTML;
        displaySection.appendChild(div);
    })

    const buttons = document.querySelectorAll('.fa');
    [...buttons].forEach(button => {
        button.addEventListener('click', removeFromFav);
        button.classList.toggle('liked');
    });

    nav.classList.toggle('translated-menu');
})

isUserLogged();