/* A DOM component that displays text and allows the user to edit it, turning into an input.
   The current text value is exposed through .value, and it can be set directly with .setValue(). */
export default class EditableText {
  /* id is the name and id for the input element, needed to associate a label with it. */
  constructor(id) {
    this.id = id;
    this.elem = null;
    this.change = null;
    this.value = "";
    this._onSubmit = this._onSubmit.bind(this);
    this._onEdit = this._onEdit.bind(this);
  }

  /* Add the component (in display state) to the DOM tree under parent. When the value changes, onChange is called
       with a reference to this object as argument. */
  addToDOM(parent, onChange) {
    let elem = this._createDisplay();
    parent.append(elem);
    this.elem = elem;
    this.change = onChange;
  }

  /* Set the value of the component and switch to display state if necessary. Does not call onChange. */
  setValue(value) {
    this.value = value;
    let newDispContainer = this._createDisplay();
    this.elem.replaceWith(newDispContainer);
    this.elem = newDispContainer;
  }

  /* Create and return a DOM element representing this component in display state. */
  _createDisplay() {
    let container = document.createElement("div");
    container.classList.add("editableText");

    let text = document.createElement("span");
    text.textContent = this.value;
    container.append(text);

    let button = this._createImageButton("edit");
    button.type = "button";
    container.append(button);

    button.addEventListener("click", this._onEdit);

    return container;
  }

  /* Create and return a DOM element representing this component in input state. */
  _createInput() {
    let form = document.createElement("form");
    form.classList.add("editableText");

    let input = document.createElement("input");
    input.type = "text";
    input.name = this.id;
    input.id = this.id;
    input.value = this.value;
    form.append(input);

    let button = this._createImageButton("save");
    button.type = "submit";
    form.append(button);

    button.addEventListener("click", this._onSubmit);
    return form;
  }

  /* Helper to create a button containing an image. name is the name of the image, without directory or extension. */
  _createImageButton(name) {
    let button = document.createElement("button");
    let img = document.createElement("img");
    img.src = `images/${name}.svg`;
    img.alt = name;
    button.append(img);
    return button;
  }

  _onEdit(event) {
    let newInputContainer = this._createInput();
    this.elem.replaceWith(newInputContainer);

    // focus on input element
    let inputId = this.id;
    document.querySelector("#" + inputId).focus();

    this.elem = newInputContainer;
  }

  _onSubmit(event) {
    event.preventDefault();
    // set value of input element so that it is shown in display state
    let inputId = this.id;
    this.value = document.querySelector("#" + inputId).value;

    // replace current container (input form) with display state container
    let newDispContainer = this._createDisplay();
    this.elem.replaceWith(newDispContainer);

    this.elem = newDispContainer;

    // call onChange
    this.change(this);
  }
}
