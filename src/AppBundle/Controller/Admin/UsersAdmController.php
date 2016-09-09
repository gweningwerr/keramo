<?php
namespace AppBundle\Controller\Admin;
use AppBundle\Entity\UserEntity;
use AppBundle\Helper\App;
use AppBundle\Helper\RequestCm;
use AppBundle\Repository\UserRepository;
use DateTime;
use Doctrine\Common\Persistence\ObjectRepository;
use FOS\UserBundle\Model\User;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;


/**
 * class: UsersAdmController
 * -----------------------------------------------------
 * Created by MihailShirnin on 02.09.2016.
 * @package AppBundle\Controller\Admin
 */

class UsersAdmController extends ExtendsAdmController
{
	private $repoUser;


	/**
	 * Список юзеров
	 * @return null|\Symfony\Component\HttpFoundation\JsonResponse
	 */
	public function listAction()
	{
		if (RequestCm::isAjax()) {
			$response = $this->getListUsersBySorted();
		} else {
			$response = $this->render('AppBundle:Adminka:user_list.html.twig', [
				'sendUrl' => $this->generateUrl('adminka.user.list')
			]);
		}

		return $this->ok($response);
	}

	private function getListUsersBySorted()
	{
		$bsTable = RequestCm::getVar('bstable', []);
		$users = $this->repoUser()->getByBsTable($bsTable);


		$rows = [];
		/** @var UserEntity $user  */
		foreach ($users as $user) {
			$lastLogin = $user->getLastLogin() ? $user->getLastLogin()->format('m.d.Y / H:i') : null;
			$rows[] = [
				'id' => $user->getId(),
				'username' => $user->getUsername(),
				'email' => $user->getEmail(),
				'lastLogin' => $lastLogin,
				'links' => [
					'edit' => $this->generateUrl('adminka.user.edit', ['id'=>$user->getId()]),
					'delete' => $this->generateUrl('adminka.user.delete', ['id'=>$user->getId()]),
				],
				'actions' => [
					'delete' => $this->generateUrl('adminka.user.delete', ['id'=>$user->getId()]),
					'edit' => $this->generateUrl('adminka.user.edit', ['id'=>$user->getId()]),
				],
			];
		}
		$response = ['rows' => $rows, "total"=> count($rows)];
		return $response;
	}

	public function editAction($id)
	{
        /** @var UserEntity $user  */
        $user = $this->repoUser()->find($id);
		if (!$user) {
			throw new NotFoundHttpException('Такого пользователя нет');
		}
		$roles = App::getListRoles();
		$response = $this->render('AppBundle:Adminka:user_edit.html.twig', [
			'user' => $user,
			'roles' => $roles,
			'formAction' => $this->generateUrl('adminka.user.update', ['id'=>$user->getId()]),
			'linkList' => $this->generateUrl('adminka.user.list'),
		]);

		return $this->ok($response);
	}

	public function deleteAction()
	{
		App::dumpExit('UsersAdmController:deleteAction');
	}

	public function updateAction($id)
	{
		/** @var UserEntity $user  */
		$user = $this->repoUser()->find($id);
		if (!$user) {
			return $this->error('Такого пользователя нет');
		}

		$newPwd = RequestCm::getString('new_password');
		if ($newPwd) {
			$encoder = $this->container->get('security.encoder_factory')->getEncoder($user);
			if (!$encoder) {
				return $this->error('Ошибка получения енкодера');
			}
			$newPwdEncoded = $encoder->encodePassword($newPwd, $user->getSalt());
			$user->setPasswordRequestedAt(new DateTime);
			$user->setPassword($newPwdEncoded);
		}

		$email = RequestCm::getEmail('email');
		if ($email) {
			$user->setEmail($email);
			$user->setEmailCanonical($email);
		}

		$roles = RequestCm::getVar('roles');
		if ($roles && is_array($roles)) {
			$user->setRoles($roles);
		}

		App::em()->persist($user);
		App::em()->flush();

		$response = [
			'Request' => RequestCm::getAll(),
			'msg' => 'Данные были успешно обновлены. Выберете дальнейшее действие.',
			'$roles' => $roles,
			'link' => [
				'list' => $this->generateUrl('adminka.user.list'),
				'edit' => $this->generateUrl('adminka.user.edit', ['id'=>$user->getId()]),
			],
		];
		return $this->ok($response);
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

