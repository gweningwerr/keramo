<?php
namespace AppBundle\Controller;
use AppBundle\Helper\App;

/**
 * class: UserController
 * -----------------------------------------------------
 * Created by MihailShirnin on 31.08.2016.
 * @package AppBundle\Controller
 */

class UserController extends ExtendedController
{
	public function loginAction()
	{
		$authenticationUtils = $this->get('security.authentication_utils');

		$lastUsername = $authenticationUtils->getLastUsername();
		$error = $authenticationUtils->getLastAuthenticationError();


		$request = App::getRequest();
		$requestSess = $request->getSession();
		$csrfToken = $this->get('security.csrf.token_manager')->getToken('authenticate')->getValue();
		
		if(!$requestSess->has('_authError')){
			$requestSess->set('_authError', 0);
		}

		// Считаем кол-во попыток
		if ($error !== null) {
			if ($requestSess->has('_authError')) {
				// Сохраняем предыдущий результат
				$prevError = $requestSess->get('_authError');
				// Удаляем предыдущий результат
				$requestSess->remove('_authError');
				// Сохраняем новый
				$requestSess->set('_authError', $prevError + 1 );
			}
		}
		
		
//		App::dump($authenticationUtils);
//
//		App::dumpExit();

		return $this->render( 'AppBundle:User:login.html.twig', [
			// имя, введённое пользователем в последний раз
			'last_username' => $lastUsername,
			'csrf_token' => $csrfToken,
			//'token' => UserHelper::getInstance()->getToken(),
			//'authenticationError' => $authenticationError,
			//'authenticationTimeWait' => $request->getSession()->get('_authenticationTimeWait', null),
			'error' => $error,
			//'errorMessageBad' => $errorMessageBad
		] );
	}
}

