<?php
namespace AppBundle\Repository;
use AppBundle\Helper\App;
use Doctrine\ORM\EntityRepository;
use Doctrine\ORM\NoResultException;
use Symfony\Component\VarDumper\VarDumper;

/**
 * class: UserRepository
 * -----------------------------------------------------
 * Created by MihailShirnin on 31.08.2016.
 * @package AppBundle\Repository
 */

class UserRepository extends EntityRepository
{

	public function getByBsTable($params) {

		App::dumpAjax($params);
		$q = $this->createQueryBuilder('u')
			->select('u');



		// сортировка
		if (!empty($params['order']) && !empty($params['sort'])) {
			$sortOrder = mb_strtoupper($params['order'], 'UTF-8');
			$sortField = $params['sort'];
			$q->addOrderBy('u.' . $sortField , $sortOrder);
		}

		// органичение по выводу
		if (!empty($params['limit'])) {
			//$q->setMaxResults($params['limit']);
		}

		// отступ шага
		if (!empty($params['offset'])) {
			$q->setFirstResult($params['offset']);
		}

		// отступ шага
		if (!empty($params['search'])) {
			$likeSearch = '%' . $params['search'] . '%';
			$q->andWhere('
						u.username LIKE :likeSearch OR
						u.email LIKE :likeSearch OR
						u.lastLogin LIKE :likeSearch
			');
			$q->setParameters(['likeSearch' => $likeSearch]);
		}

//		$q->andWhere('fg.altName = :altName');
//		$q->andWhere('f_param.showFooter = 1');
//		$q->setParameters(['altName' => $altName]);
		$r = $q->getQuery();
		App::dumpAjax($r);


		try {
			$items = $r->getResult();
		} catch (NoResultException $e) {
			return null;
		}
		return $items;
	}
}

