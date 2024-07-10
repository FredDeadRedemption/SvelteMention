import { users } from "./users.js";

const userSuggestionBox = document.getElementById("user-suggestion-box");
const commentField = document.getElementById("comment-field");
const RD = document.getElementById("RD");

let selectedUserIndex = -1; // Index of the currently selected user
let filteredUsers = []; // List of users matching current searchterm
const MAXUSERS = 8; // max amount of users in the suggetsion box

let prevSelectedUser = -1; // last user highlighted

const insertUser = (user) => {
    
    let val = commentField.innerHTML.trim(); // Remove leading and trailing spaces

    let atIndex = val.lastIndexOf("@"); // Index of the last occurrence of "@@" symbol
    
    let userSpan = document.createElement("span");
    userSpan.className = "user-tag"; 

    let nameSpan = document.createElement("span");
    nameSpan.className = "name-tag"; 
    nameSpan.innerHTML = `<span class="name-tag">${user.name}</span>`;

    let idSpan = document.createElement("span");
    idSpan.className = "id-tag"; 
    idSpan.innerHTML = `<span class="id-tag">${user.id}</span>`;

    if(atIndex !== -1) {
        // Remove everything after atIndex (including atIndex) from the commentField
        commentField.innerHTML = val.substring(0, atIndex + 1); // Add 1 to include "@" symbol
    }

    //commentField.innerHTML = prefix;   <-----   BREAKS IT 
    userSpan.appendChild(nameSpan);
    userSpan.appendChild(idSpan);
    commentField.appendChild(userSpan);

    // Create a non-breaking space after the inserted span to ensure correct cursor positioning
    let space = document.createTextNode("\u00A0");
    commentField.appendChild(space);

    // Move cursor to the end of the inserted span plus one character for the non-breaking space
    let range = document.createRange();
    let sel = window.getSelection();

    // Ensure the cursor is set correctly without exceeding the node's length
    range.setStartAfter(space);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);

    updateUserSuggestionBoxPosition();

    selectedUserIndex = 0; // Reset selectionIndex
    filteredUsers = []; // Reset filtered users
    userSuggestionBox.innerHTML = "";  // Clear the user suggestion box
    userSuggestionBox.style.display = "none";
}

const renderSuggestedUsers = (suggestedUsers) => {
    userSuggestionBox.innerHTML = " "; // Clear the suggestion box

    if (suggestedUsers.length === 0) return; // If no filtered users, stop here and keep the user box cleared


    userSuggestionBox.style.display = "block";
    // Render 
    suggestedUsers.forEach((user, index) => {

    if (index > MAXUSERS) return; // Render maximun of 8 users

    let userElement = document.createElement("div");
    userElement.textContent = user.name
    userSuggestionBox.appendChild(userElement);

    userElement.addEventListener("click", () => { insertUser(user); }); // On click insert that user in comment field

    // Highlight the previously selected user, if any
    if (index === selectedUserIndex) {
        prevSelectedUser = userElement;
        userElement.classList.add("selected");
    }
    });

    // If there are more users than the maximum display limit, add "..."
    if (suggestedUsers.length > MAXUSERS) {
        let moreElement = document.createElement("div");
        moreElement.textContent = "...";
        userSuggestionBox.appendChild(moreElement);
    } 
}

const updateUserSuggestionBoxPosition = () => {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0).cloneRange();
    const rect = range.getBoundingClientRect();

    userSuggestionBox.style.left = rect.left + window.scrollX + "px";
    userSuggestionBox.style.top = rect.top + window.scrollY - userSuggestionBox.offsetHeight + "px";
}

updateUserSuggestionBoxPosition();

commentField.addEventListener("mouseup", updateUserSuggestionBoxPosition);
commentField.addEventListener("keyup", (event) => {
    if (event.key === "Enter") {
        userSuggestionBox.innerHTML = ""; // Clear user suggestion box
        userSuggestionBox.style.display = "none";
        return; // Prevent search after user insert
    }

    console.clear() //DEBUGGING

    // Get the text content of the comment field excluding HTML tags
    let text = commentField.textContent.trim();

    // Replace &nbsp; with regular space
    text = text.replace(/\u00A0/g, ' ');

    let words = text.split(" "); 

    let threeLastWords = [words[words.length - 3], words[words.length - 2], words.pop()];

    // DEBUGGING
    if (!(threeLastWords.some(word => word?.startsWith("@")))) {
        console.log("Last three words", threeLastWords[0], threeLastWords[1], threeLastWords[2]);
        userSuggestionBox.innerText = " ";
        userSuggestionBox.style.display = "none";
    }

    if (!(threeLastWords.some(word => word?.startsWith("@")))) return;  // If any of 3 last words dont start with "@", dont search

    let atIndex = -1; // Find the latest index of a word containing at symbol and make it the start of the search term
    for (let i = threeLastWords.length - 1; i >= 0; i--) {
        if (threeLastWords[i]?.startsWith("@")) {
            atIndex = i;
            break;
        }
    }

    // Extract search term after "@" symbol, with a maximum lenght of 3 words, after 3 words searching will stop
    let searchTerm = " ";
    if (atIndex + 2 < threeLastWords.length) {
        // Words that starts with the "@" symbol (minus the "@" symbol) + space + second word + space + third word
        searchTerm = threeLastWords[atIndex].substring(1).concat(" ").concat(threeLastWords[atIndex + 1]).concat(" ").concat(threeLastWords[atIndex + 2]);
    } else if (atIndex + 1 < threeLastWords.length) {
        searchTerm = threeLastWords[atIndex].substring(1).concat(" ").concat(threeLastWords[atIndex + 1]);
    } else {
        searchTerm = threeLastWords[atIndex].substring(1);
    }

    // Determine users matching searchTerm
    filteredUsers = users.filter(user => user.name.toLowerCase().includes(searchTerm.toLowerCase()));

    if(filteredUsers.length == 0 ) userSuggestionBox.style.display = "none";

    console.log("SEARCHING FOR: " + searchTerm); /// DEBUGGING
    console.log(filteredUsers); // DEBUGGING

    renderSuggestedUsers(filteredUsers);
    updateUserSuggestionBoxPosition();
});

const selectUser = (index) => {
    // Ensure index stays within the bounds of visible users
    selectedUserIndex = Math.max(0, Math.min(index, Math.min(MAXUSERS, filteredUsers.length - 1)));

    // Remove "selected" class from previously selected user
    prevSelectedUser?.classList.remove("selected");

    // Get the currently selected user element
    const userElements = userSuggestionBox.querySelectorAll("div");
    const selectedUserElement = userElements[selectedUserIndex];

    // Add "selected" class to the currently selected user
    if (selectedUserElement) {
        selectedUserElement.classList.add("selected");
        prevSelectedUser = selectedUserElement;
    }
};

commentField.addEventListener("keydown", (event) => {
    switch (event.key) {
        case "ArrowUp":
            event.preventDefault(); // Prevent scroll
            selectUser(Math.max(0, selectedUserIndex - 1));
            break;
        case "ArrowDown":
            event.preventDefault(); // Prevent scroll
            selectUser(Math.min(filteredUsers.length - 1, selectedUserIndex + 1));
            break;
        case "Enter":
            if (!userSuggestionBox.innerText || userSuggestionBox.style.display == "none") return; // Prevent inserting when not searching           
            event.preventDefault(); // Prevent new line in user insert           
            insertUser(filteredUsers[selectedUserIndex]);
            userSuggestionBox.innerHTML = ""; // Clear userBox after selection
            userSuggestionBox.style.display = "none";
            break;
        default:
            // Reset selected user index
            selectedUserIndex = 0;
    }
});
