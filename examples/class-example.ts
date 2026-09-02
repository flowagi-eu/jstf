import { second } from './second.ts';

class User {
   id = 1
}

@CheckAtRuntime
function fn1(user: User) {
	console.log(user);
}

second();
fn1(new User());

fn1('other type'); // TypeError: user must be User
