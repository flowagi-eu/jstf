class User {
   id = 1
}

function fn1(user) {
	console.log(user);
}

fn1(new User());

fn1('other type'); // no errors
