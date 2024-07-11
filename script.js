import { users } from "./users.js";

const userSuggestionBox = document.getElementById("user-suggestion-box");
const commentField = document.getElementById("comment-field");

let selectedUserIndex = -1; // Index of the currently selected user
let filteredUsers = []; // List of users matching current searchterm
const MAXUSERS = 8; // max amount of users in the suggetsion box

let prevSelectedUser = -1; // last user highlighted

const insertUser = (user) => {
    // Get the full HTML content of the comment field
    let val = commentField.innerHTML.trim();

    // Get the current cursor position
    let selection = window.getSelection();
    let range = selection.getRangeAt(0);
    let preCursorRange = document.createRange();
    preCursorRange.selectNodeContents(commentField);
    preCursorRange.setEnd(range.endContainer, range.endOffset);

    // Get the HTML content up to the cursor position
    let preCursorHTML = preCursorRange.cloneContents();

    // Convert the DocumentFragment to a string
    let container = document.createElement("div");
    container.appendChild(preCursorHTML);
    let preCursorText = container.innerHTML;

    // Find the last index of "@" in the text before the cursor
    let atIndex = preCursorText.lastIndexOf("@");

    if (atIndex === -1) return; // No "@" found, exit the function

    // Get the HTML content after the cursor position
    let postCursorRange = document.createRange();
    postCursorRange.setStart(range.endContainer, range.endOffset);
    postCursorRange.setEnd(commentField, commentField.childNodes.length);
    let postCursorHTML = postCursorRange.cloneContents();

    // Remove everything after atIndex (including @ symbol) from the commentField
    commentField.innerHTML = preCursorText.substring(0, atIndex);

    // Create the user mention span
    let userSpan = document.createElement("span");
    userSpan.className = "user-tag"; 

    let nameSpan = document.createElement("span");
    nameSpan.className = "name-tag"; 
    nameSpan.innerHTML = `@${user.name}`;

    let idSpan = document.createElement("span");
    idSpan.className = "id-tag"; 
    idSpan.innerHTML = `${user.id}`;

    userSpan.appendChild(nameSpan);
    userSpan.appendChild(idSpan);
    commentField.appendChild(userSpan);

    // Create a non-breaking space after the inserted span to ensure correct cursor positioning
    let space = document.createTextNode("\u00A0");
    commentField.appendChild(space);

    // Append the remaining content after the cursor position
    commentField.appendChild(postCursorHTML);

    // Move cursor to the end of the inserted span plus one character for the non-breaking space
    let newRange = document.createRange();
    newRange.setStartAfter(space);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);

    updateUserSuggestionBoxPosition();

    selectedUserIndex = 0; // reset selectionIndex
    filteredUsers = []; // reset filtered users
    userSuggestionBox.innerHTML = "";  // clear the user suggestion box
    userSuggestionBox.style.display = "none";
};

const isCursorInsideUserSpan = () => {
    let selection = window.getSelection();
    if (selection.rangeCount === 0) return false;

    let range = selection.getRangeAt(0);
    let container = range.startContainer;

    while (container) {
        if (container.nodeType === Node.ELEMENT_NODE && container.classList.contains('user-tag')) {
            return true;
        }
        container = container.parentNode;
    }

    return false;
};



const renderSuggestedUsers = (suggestedUsers) => {
    userSuggestionBox.innerHTML = " "; // clear the suggestion box

    if (suggestedUsers.length === 0) return; // if no filtered users, stop here and keep the user box cleared


    userSuggestionBox.style.display = "block";
    // render 
    suggestedUsers.forEach((user, index) => {

    if (index > MAXUSERS) return; // render maximun of 8 users

    let userElement = document.createElement("div");
    userElement.textContent = user.name
    userSuggestionBox.appendChild(userElement);

    userElement.addEventListener("click", () => { insertUser(user); }); // on click insert that user in comment field

    // highlight the previously selected user, if any
    if (index === selectedUserIndex) {
        prevSelectedUser = userElement;
        userElement.classList.add("selected");
    }
    });

    // if there are more users than the maximum display limit, add "..."
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
    if(isCursorInsideUserSpan()) return;

    if (event.key === "Enter") {
        userSuggestionBox.innerHTML = ""; // clear user suggestion box
        userSuggestionBox.style.display = "none";
        return; // prevent search after user insert
    }

    console.clear(); // DEBUGGING

    // Get the text content of the comment field excluding HTML tags
    let text = commentField.textContent;

    // Replace &nbsp; with regular space
    text = text.replace(/\u00A0/g, ' ');

    // Get the current cursor position
    let selection = window.getSelection();
    let range = selection.getRangeAt(0);
    let preCursorRange = document.createRange();
    preCursorRange.selectNodeContents(commentField);
    preCursorRange.setEnd(range.endContainer, range.endOffset);

    // Get the text content up to the cursor position
    let preCursorText = preCursorRange.toString().trim();

    let words = preCursorText.split(/\s+/); // Split by spaces

    // Get the three last words before the cursor
    let threeLastWords = [words[words.length - 3], words[words.length - 2], words[words.length - 1]];

    if (!(threeLastWords.some(word => word?.startsWith("@")))) {
        console.log("Last three words", threeLastWords[0], threeLastWords[1], threeLastWords[2]); // DEBUGGING
        userSuggestionBox.innerText = " ";
        userSuggestionBox.style.display = "none";
        return;
    }

    let atIndex = -1; // Find the latest index of a word containing the "@" symbol
    for (let i = threeLastWords.length - 1; i >= 0; i--) {
        if (threeLastWords[i]?.startsWith("@")) {
            atIndex = i;
            break;
        }
    }

    // Extract search term after "@" symbol, with a maximum length of 3 words
    let searchTerm = "";
    if (atIndex + 2 < threeLastWords.length) {
        searchTerm = threeLastWords[atIndex].substring(1).concat(" ").concat(threeLastWords[atIndex + 1]).concat(" ").concat(threeLastWords[atIndex + 2]);
    } else if (atIndex + 1 < threeLastWords.length) {
        searchTerm = threeLastWords[atIndex].substring(1).concat(" ").concat(threeLastWords[atIndex + 1]);
    } else {
        searchTerm = threeLastWords[atIndex].substring(1);
    }

    // Determine users matching searchTerm
    filteredUsers = users.filter(user => user.name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (filteredUsers.length == 0) {
        userSuggestionBox.style.display = "none";
        return;
    }

    console.log("SEARCHING FOR: " + searchTerm); // DEBUGGING
    console.log(filteredUsers); // DEBUGGING

    renderSuggestedUsers(filteredUsers);
    updateUserSuggestionBoxPosition();
});

const selectUser = (index) => {
    // ensure index stays within the bounds of visible users
    selectedUserIndex = Math.max(0, Math.min(index, Math.min(MAXUSERS, filteredUsers.length - 1)));

    // remove "selected" class from previously selected user
    prevSelectedUser?.classList.remove("selected");

    // get the currently selected user element
    const userElements = userSuggestionBox.querySelectorAll("div");
    const selectedUserElement = userElements[selectedUserIndex];

    // add "selected" class to the currently selected user
    if (selectedUserElement) {
        selectedUserElement.classList.add("selected");
        prevSelectedUser = selectedUserElement;
    }
};

const insertLineBreak = () => {
    let range = window.getSelection().getRangeAt(0);
    let br = document.createElement("br");

    // Insert the <br> tag at the current position
    range.insertNode(br);

    // Move cursor to after the inserted <br>
    range.setStartAfter(br);
    range.setEndAfter(br);
    range.collapse(false);

    // Apply the range to the selection
    let sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
};

const deleteUserSpanIfNecessary = () => {

    if(!isCursorInsideUserSpan()) return;

     // Get selection and range
     let selection = window.getSelection();
     if (!selection.rangeCount) return;
 
     let range = selection.getRangeAt(0);
     let container = range.startContainer;
 
     // Find the parent node that the cursor is inside of
     let parentNode = container.nodeType === Node.TEXT_NODE ? container.parentNode : container;
 
     // Delete the parent node
     if (parentNode && parentNode.parentNode) {
         parentNode.parentNode.removeChild(parentNode);
     }
};



commentField.addEventListener("keydown", (event) => {
    switch (event.key) {
        case "ArrowUp":
            event.preventDefault(); // prevent scroll
            selectUser(Math.max(0, selectedUserIndex - 1));
            break;
        case "ArrowDown":
            event.preventDefault(); // prevent scroll
            selectUser(Math.min(filteredUsers.length - 1, selectedUserIndex + 1));
            break;
        case "Enter":
            if(isCursorInsideUserSpan()) return;
            const isSearching = userSuggestionBox.innerText && userSuggestionBox.style.display == "block";
            if(isSearching){
                event.preventDefault(); // prevent new line in user insert           
                insertUser(filteredUsers[selectedUserIndex]);
                userSuggestionBox.innerHTML = ""; // clear userBox after selection
                userSuggestionBox.style.display = "none";
            } else{ 
                event.preventDefault();
                insertLineBreak();
            }
            break;
        case "Backspace":
        case "Delete":
            deleteUserSpanIfNecessary();
            break;
        default:
            selectedUserIndex = 0; // reset selected user index
    }
});