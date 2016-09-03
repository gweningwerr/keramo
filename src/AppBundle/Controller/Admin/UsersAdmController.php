<?php
namespace AppBundle\Controller\Admin;
use AppBundle\Entity\UserEntity;
use AppBundle\Helper\App;
use AppBundle\Helper\RequestHelper;
use AppBundle\Repository\UserRepository;
use Doctrine\Common\Persistence\ObjectRepository;


/**
 * class: UsersAdmController
 * -----------------------------------------------------
 * Created by MihailShirnin on 02.09.2016.
 * @package AppBundle\Controller\Admin
 */

class UsersAdmController extends ExtendsAdmController
{
	private $repoUser;


	public function indexAction()
	{
		if (RequestHelper::isAjax()) {
			$users = $this->repoUser()->findAll();

			$rows = [];
			/** @var UserEntity $user  */
			foreach ($users as $user) {
				$rows[] = [
					'id' => $user->getId(),
					'name' => $user->getUsername(),
					'stargazers_count' => 20,
					'forks_count' => 122,
					'description' => 'description',
				];
			}
			$response = ['rows' => $rows, "total"=> count($rows),];
		} else {
			$response = $this->render('AppBundle:Adminka:user_list.html.twig', [
				'sendUrl' => $this->generateUrl('adminka.user.list'),
			]);
		}

		return $this->ok($response);
	}

	public function profileAction()
	{
		App::dumpExit('UsersAdmController:indexAction');
	}

	public function editAction()
	{
		App::dumpExit('UsersAdmController:indexAction');
	}

	/**
	 * @return ObjectRepository|UserRepository
	 */
	private function repoUser()
	{
		if (!$this->repoUser) {
			$this->repoUser = App::getRepository('AppBundle:UserEntity');
		}
		return $this->repoUser;
	}
}

