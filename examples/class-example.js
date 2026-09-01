class User {
   id = 1
}

function fn1(user: User) {
	console.log(user);
}

fn1(new User());

fn1('other type'); // TypeError: user must be User
