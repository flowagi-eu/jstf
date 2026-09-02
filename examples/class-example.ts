import { second } from './second.ts';

class User {
   id = 1
}

@CheckAtRuntime
function fn1(user: User) {
	console.log(user);
}

function fn2(user: User) {
	console.log(user);
}

second();
fn1(new User());
fn2('other type');
second();

fn1('other type'); // TypeError: user must be User
