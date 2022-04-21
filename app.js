const inputField = document.getElementById('input-field');
const resultField = document.getElementById('result-field');
inputField.focus();

// history & variables declarations
let variables = {};
let history = {};

// To display or clear values in input field
function display(text) {
	if (text === 'C') {
		inputField.value = '';
		resultField.value = '';
		return false;
	}
	inputField.value += text;
}

// To display history & variables divs
function displayDivs() {
	document.getElementById('historyDiv').style.display = 'block';
	document.getElementById('variableDiv').style.display = 'block';
}

// To hide variable Div
function hideVariable() {
	document.getElementById('variableDiv').style.display = 'none';
}

// To hide history Div
function hideHistory() {
	document.getElementById('historyDiv').style.display = 'none';
}

// To create new variables
function addVariable() {
	const name = document.getElementById('varName').value;
	const value = document.getElementById('varValue').value;
	if (name !== '' && value !== '') {
		variables = { ...variables, [name]: value };
		console.log(variables);

		// Creates li for new variables
		const ul = document.getElementById('variables-ul');
		const li = document.createElement('li');
		const liName = document.createElement('h4');
		liName.innerHTML = `${name} = ${value}`;
		li.appendChild(liName);
		ul.appendChild(li);

		// Makes input empty
		document.getElementById('varName').value = '';
		document.getElementById('varName').focus();
		document.getElementById('varValue').value = '';

		liName.setAttribute('onClick', 'addVariableExp(this)');
	} else {
		console.warn('Variable must have a name and value');
	}
}

// To create new history item
function addHistory() {
	const ul = document.getElementById('history-ul');
	while (ul.hasChildNodes()) {
		ul.removeChild(ul.firstChild);
	}

	for (const prop in history) {
		// To create li for new history item
		const li = document.createElement('li');
		const liName = document.createElement('h4');
		const liDelete = document.createElement('button');
		liDelete.className = 'btnHistory btn btn-danger';
		liName.innerHTML = `${prop} = ${history[prop]}`;
		liDelete.innerHTML = 'X';
		li.appendChild(liName);
		li.display = 'inline';
		li.appendChild(liDelete);
		ul.appendChild(li);

		liName.setAttribute('onClick', 'addHistoryExp(this)');
		liDelete.setAttribute('onClick', 'delHistoryExp(this)');
	}
}

// To add a variable's value to the input field
function addVariableExp(varValue) {
	const value = varValue.innerHTML.split(' = ')[1];
	inputField.value += value;
}

// To add a history's expression & result to the input & result field respectively
function addHistoryExp(varValue) {
	const name = varValue.innerHTML.split(' = ')[0];
	inputField.value = name;
	const value = varValue.innerHTML.split(' = ')[1];
	resultField.value = value;
}

// To delete history item
function delHistoryExp(deleteBtn, keyName) {
	const key = deleteBtn.parentElement.firstChild.innerHTML.split(' =')[0];
	delete history[key];
	addHistory();
}

// Parser to evaluate a given expression where tokens are separated by space.

function evaluate(expression) {
	let tokens = expression.split('');

	// Stack for numbers: 'values'
	let values = [];

	// Stack for Operators: 'ops'
	let ops = [];

	for (let i = 0; i < tokens.length; i++) {
		// Current token is a whitespace, skip it
		if (tokens[i] == ' ') {
			continue;
		}

		// Current token is a number, push it to stack for numbers
		if (tokens[i] >= '0' && tokens[i] <= '9') {
			let sbuf = '';

			// There may be more than one digits in number or a decimal point between them
			while (
				(i < tokens.length && tokens[i] >= '0' && tokens[i] <= '9') ||
				tokens[i] === '.'
			) {
				sbuf = sbuf + tokens[i++];
			}
			values.push(parseFloat(sbuf));

			// Right now the i points to the character next to the digit, we would skip one token position. So, we will decrease i by 1

			i--;
		}

		// Current token is a char, push it to stack for ops
		if (tokens[i] >= 'a' && tokens[i] <= 'z') {
			let cbuf = '';

			// There may be more than one char
			while (i < tokens.length && tokens[i] >= 'a' && tokens[i] <= 'z') {
				cbuf = cbuf + tokens[i++];
			}
			ops.push(cbuf);

			// Right now the i points to the character next to the digit, we would skip one token position. So, we will decrease i by 1

			i--;
		}

		// Current token is an opening brace, push it to 'ops'
		else if (tokens[i] == '(') {
			ops.push(tokens[i]);
		}

		// Closing brace encountered, solve entire brace
		else if (tokens[i] == ')') {
			while (ops[ops.length - 1] != '(') {
				if (ops.length == 0 && ops[ops.length - 1] != '(') {
					return 'Syntax Error!';
				}
				values.push(applyOp(ops.pop(), values.pop(), values.pop()));
			}
			ops.pop();
		}

		// Current token is an operator.
		else if (
			['+', '-', '*', '/', '^', 'sqrt', 'cos', 'sin', 'tan'].includes(tokens[i])
		) {
			/* While top of 'ops' has same or greater precedence to current token, which is an operator.
      Apply operator on top of 'ops' to top two elements in values stack */

			while (ops.length > 0 && hasPrecedence(tokens[i], ops[ops.length - 1])) {
				values.push(applyOp(ops.pop(), values.pop(), values.pop()));
			}

			// Push current token to 'ops'.
			ops.push(tokens[i]);
		}
	}

	// Entire expression has been parsed at this point, apply remaining ops to remaining values
	while (ops.length > 0) {
		// If the current ops is a function i.e cos, sin, tan or sqrt then we will only pop one value
		if (
			// ops[ops.length - 1] === 'cos' ||
			// ops[ops.length - 1] === 'sin' ||
			// ops[ops.length - 1] === 'tan' ||
			// ops[ops.length - 1] === 'sqrt'
			['cos', 'sin', 'tan', 'sqrt'].includes(ops[ops.length - 1])
		) {
			values.push(applyOp(ops.pop(), 0, values.pop()));
		} else {
			values.push(applyOp(ops.pop(), values.pop(), values.pop()));
		}
	}

	const newHistoryKey = expression.split(' ').join('');
	const newHistoryValue = values.pop();

	if (isNaN(newHistoryValue)) {
		return 'Syntax Error!';
	}

	history = { ...history, [newHistoryKey]: newHistoryValue };

	// Top of 'values' contains result, return it
	return newHistoryValue;
}

// Returns true if 'op2' has higher or same precedence as 'op1', otherwise returns false.
function hasPrecedence(op1, op2) {
	if (op2 == '(' || op2 == ')') {
		return false;
	}
	if ((op1 == '*' || op1 == '/') && (op2 == '+' || op2 == '-')) {
		return false;
	} else {
		return true;
	}
}

// To apply an operator 'op' on operands 'a' and 'b'. Return the result.
function applyOp(op, b, a) {
	switch (op) {
		case '+':
			return a + b;
		case '-':
			return a - b;
		case '*':
			return a * b;
		case '/':
			if (b == 0) {
				document.write('Cannot divide by zero');
			}
			return parseInt(a / b, 10);
		case '^': {
			return Math.pow(a, b);
		}
		case 'sqrt': {
			return Math.sqrt(a);
		}
		case 'cos': {
			b = (b * Math.PI) / 180;
			return Math.round(Math.cos(b));
		}
		case 'sin': {
			b = (b * Math.PI) / 180;
			return Math.round(Math.sin(b));
		}
		case 'tan': {
			b = (b * Math.PI) / 180;
			return Math.round(Math.tan(b));
		}
	}
	return 0;
}

function answer() {
	resultField.value = evaluate(inputField.value);
	addHistory();
}
