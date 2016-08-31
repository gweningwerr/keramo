<?php
namespace AppBundle\Entity;
use Doctrine\ORM\Mapping as ORM;
use FOS\UserBundle\Model\User as BaseUser;
use FOS\UserBundle\Model\Group;

/**
 * class: UserEntity
 * -----------------------------------------------------
 * Created by MihailShirnin on 31.08.2016.
 *
 * @package AppBundle\Entity
 * @ORM\Table(name="user", options={"comment" = "Юзеры", "collate" = "utf8_general_ci"})
 * @ORM\Entity(repositoryClass="AppBundle\Repository\UserRepository")
 */

class UserEntity extends BaseUser
{
	/**
	 * @ORM\Id
	 * @ORM\Column(type="integer")
	 * @ORM\GeneratedValue(strategy="AUTO")
	 */
	protected $id;

	public function __construct()
	{
		parent::__construct();
	}
}

